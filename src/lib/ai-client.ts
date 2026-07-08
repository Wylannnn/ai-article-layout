/**
 * 统一 AI 调用层
 * 支持 Anthropic / OpenAI / Gemini / DeepSeek
 * API Key 存在浏览器 localStorage，不经过本地服务器
 * 调用直接从前端发出（各厂商均支持 CORS）
 */

import { AIProvider, ProviderConfig } from "@/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CallOptions {
  system?: string;
  maxTokens?: number;
  stream?: boolean;
  onChunk?: (text: string) => void;
  jsonMode?: boolean;
  prefill?: string;
}

// ── Anthropic ────────────────────────────────────────────────
async function callAnthropic(
  config: ProviderConfig,
  messages: ChatMessage[],
  opts: CallOptions
): Promise<string> {
  const msgs = opts.prefill
    ? [...messages, { role: "assistant", content: opts.prefill } as ChatMessage]
    : messages;
  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: opts.maxTokens ?? 8000,
    messages: msgs,
  };
  if (opts.system) body.system = opts.system;
  if (opts.stream) body.stream = true;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Anthropic API 错误 ${res.status}: ${(err as { error?: { message?: string } })?.error?.message ?? res.statusText}`
    );
  }

  if (opts.stream && opts.onChunk) {
    return consumeSSE(res, (data) => {
      const d = JSON.parse(data) as { type: string; delta?: { type: string; text?: string } };
      if (d.type === "content_block_delta" && d.delta?.type === "text_delta") {
        opts.onChunk!(d.delta.text ?? "");
        return d.delta.text ?? "";
      }
      return "";
    });
  }

  const json = await res.json() as { content: { type: string; text: string }[] };
  return json.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

// ── OpenAI-compatible (OpenAI + DeepSeek) ───────────────────
async function callOpenAICompat(
  config: ProviderConfig,
  messages: ChatMessage[],
  opts: CallOptions,
  baseUrl: string
): Promise<string> {
  let allMessages = opts.system
    ? [{ role: "system", content: opts.system }, ...messages]
    : [...messages];
  if (opts.prefill) {
    allMessages = [...allMessages, { role: "assistant", content: opts.prefill }];
  }

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: opts.maxTokens ?? 8000,
    messages: allMessages,
    stream: !!opts.stream,
  };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `API 错误 ${res.status}: ${(err as { error?: { message?: string } })?.error?.message ?? res.statusText}`
    );
  }

  if (opts.stream && opts.onChunk) {
    return consumeSSE(res, (data) => {
      if (data === "[DONE]") return "";
      const d = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
      const text = d.choices?.[0]?.delta?.content ?? "";
      if (text) opts.onChunk!(text);
      return text;
    });
  }

  const json = await res.json() as { choices: { message: { content: string } }[] };
  return json.choices[0]?.message?.content ?? "";
}

// ── Gemini ───────────────────────────────────────────────────
async function callGemini(
  config: ProviderConfig,
  messages: ChatMessage[],
  opts: CallOptions
): Promise<string> {
  const model = config.model ?? "gemini-2.5-flash";
  const streamSuffix = opts.stream ? "streamGenerateContent?alt=sse&" : "generateContent?";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${streamSuffix}key=${config.apiKey}`;

  // Convert messages to Gemini format
  const msgs = opts.prefill
    ? [...messages, { role: "assistant", content: opts.prefill } as ChatMessage]
    : messages;
  const contents = msgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }
  body.generationConfig = { maxOutputTokens: opts.maxTokens ?? 8000 };

  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    const errBody = await res.json().catch(() => ({}));
    const retryMatch = JSON.stringify(errBody).match(/retryDelay["':]+\s*([\d.]+)s/);
    const delay = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000 : 15000;
    await new Promise((r) => setTimeout(r, delay));
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Gemini API 错误 ${res.status}: ${JSON.stringify((err as { error?: unknown })?.error ?? err)}`
    );
  }

  if (opts.stream && opts.onChunk) {
    return consumeGeminiStream(res, opts.onChunk);
  }

  const json = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
}

// ── SSE stream consumer ──────────────────────────────────────
async function consumeSSE(
  res: Response,
  parse: (data: string) => string
): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data) acc += parse(data);
      }
    }
  }
  return acc;
}



// ── Gemini stream consumer ────────────────────────────────
async function consumeGeminiStream(
  res: Response,
  onChunk: (text: string) => void
): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      // Handle both SSE (data:) and raw JSON lines
      const trimmed = (line.startsWith("data: ") ? line.slice(6) : line).trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        // Handle both array and single object responses
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          const text = item.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            onChunk(text);
            acc += text;
          }
        }
      } catch {
        // skip unparseable lines
      }
    }
  }
  return acc;
}

// ── Public entry point ───────────────────────────────────────
export async function callAI(
  config: ProviderConfig,
  messages: ChatMessage[],
  opts: CallOptions = {}
): Promise<string> {
  switch (config.provider) {
    case "anthropic":
      return callAnthropic(config, messages, opts);
    case "openai":
      return callOpenAICompat(config, messages, opts, "https://api.openai.com/v1");
    case "deepseek":
      return callOpenAICompat(config, messages, opts, "https://api.deepseek.com/v1");
    case "gemini":
      return callGemini(config, messages, opts);
    default:
      throw new Error(`未知 provider: ${config.provider}`);
  }
}
