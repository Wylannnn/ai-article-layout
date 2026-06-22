export type AIProvider = "anthropic" | "openai" | "gemini" | "deepseek";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export const PROVIDER_META: Record<
  AIProvider,
  {
    label: string;
    placeholder: string;
    docsUrl: string;
    defaultModel: string;
    models: { id: string; label: string }[];
    free: boolean;
  }
> = {
  anthropic: {
    label: "Anthropic (Claude)",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-sonnet-4-6",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (推荐)" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (快速省钱)" },
    ],
    free: false,
  },
  openai: {
    label: "OpenAI (GPT)",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini (推荐，便宜)" },
      { id: "gpt-4o", label: "GPT-4o (质量最高)" },
      { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (最省钱)" },
    ],
    free: false,
  },
  gemini: {
    label: "Google Gemini",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "gemini-2.5-flash",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (推荐，免费额度大)" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (最快最省)" },
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (最新旗舰)" },
    ],
    free: true,
  },
  deepseek: {
    label: "DeepSeek",
    placeholder: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek V3 (推荐，极低价)" },
      { id: "deepseek-reasoner", label: "DeepSeek R1 (推理增强)" },
    ],
    free: false,
  },
};

export type ArticleCategory =
  | "tech"
  | "finance"
  | "travel"
  | "tutorial"
  | "story"
  | "news";

export interface ArticleSection {
  title: string;
  content: string;
}

export interface ArticleAnalysis {
  title: string;
  summary: string;
  category: ArticleCategory;
  keywords: string[];
  sections: ArticleSection[];
  imagePrompts: string[];
}

export interface LayoutStyle {
  id: ArticleCategory | "auto" | "custom";
  label: string;
  icon: string;
  description: string;
}

export interface GenerateRequest {
  text: string;
  analysis: ArticleAnalysis;
  category: ArticleCategory;
}
