import { SemanticLayout, ArticleCategory } from "@/types";
import { callAI } from "./ai-client";

const ANALYSIS_SYSTEM = `You are a semantic content architect. Your job is to analyze an article's structure and output a JSON blueprint that a template engine will render.

## Output schema (strict JSON)

{
  "articleType": "opinion" | "tutorial" | "story" | "news" | "product",
  "title": "文章标题",
  "subtitle": "副标题（不超过20字，无则为空字符串）",
  "category": "tech" | "finance" | "travel" | "tutorial" | "story" | "news",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "estimatedReadMinutes": 数字,
  "sections": [
    {
      "heading": "章节标题",
      "headingLevel": 2,
      "blocks": [
        {
          "id": "content block id from input",
          "sectionIndex": 0,
          "semanticType": "prose" | "callout" | "steps" | "comparison" | "data" | "quote" | "transition",
          "emphasis": "normal" | "high" | "subtle",
          "calloutLabel": "提示/警告/注意/重点/信息（仅callout类型）",
          "dataPoints": [{"label": "指标名", "value": "数值"}],
          "comparisonSides": {"left": "方案A", "right": "方案B"},
          "steps": [{"heading": "步骤简短标题"}],
          "quoteAttribution": "引用来源"
        }
      ]
    }
  ]
}

## Rules

1. Split content into 2-6 sections. Group related paragraphs under meaningful headings.
2. Assign every content block a semanticType:
   - "prose": normal paragraphs (most blocks)
   - "callout": tips, warnings, key takeaways, important notes — assign a Chinese calloutLabel
   - "steps": ordered how-to instructions (numbered steps) — split the step headings into the steps array
   - "comparison": A-vs-B comparisons, pros/cons — set comparisonSides
   - "data": statistics, metrics, numbers worth highlighting — extract dataPoints (max 4)
   - "quote": citations, notable quotes — add quoteAttribution if source is clear
   - "transition": section dividers, topic shifts, "接下来我们看..." — these are transitional paragraphs

3. Emphasis:
   - "high" for thesis statements, key conclusions, bold claims
   - "subtle" for footnotes, disclaimers, minor asides
   - "normal" for everything else

4. articleType determines the visual tone:
   - "opinion": argument-driven, persuasive
   - "tutorial": instructional, step-by-step
   - "story": narrative, emotional
   - "news": factual, concise
   - "product": feature-driven, benefit-oriented

5. Output ONLY valid JSON, no markdown fences, no explanations.`;

export async function analyzeArticleSemantics(
  text: string,
  blocks: { id: string; sectionIndex: number; rawText: string }[],
  apiKey: string,
  provider: string,
  model?: string,
): Promise<SemanticLayout> {
  const blockList = blocks
    .map((b) => `[${b.id}] section=${b.sectionIndex}: ${b.rawText.slice(0, 300)}`)
    .join("\n---\n");

  const userPrompt = `Analyze this article and output the semantic layout JSON.

## Full article text
${text.slice(0, 6000)}

## Content block inventory (use these exact IDs)
${blockList}`;

  const response = await callAI(
    { provider: provider as "anthropic" | "openai" | "gemini" | "deepseek", apiKey, model },
    [{ role: "user", content: userPrompt }],
    { system: ANALYSIS_SYSTEM, maxTokens: 4096, jsonMode: true },
  );

  return parseSemanticLayout(response);
}

function parseSemanticLayout(raw: string): SemanticLayout {
  let json = raw.trim();
  if (json.startsWith("```")) {
    json = json.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(json) as SemanticLayout;

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("SemanticLayout missing sections array");
  }

  parsed.sections = parsed.sections.map((sec, si) => ({
    heading: sec.heading || `Section ${si + 1}`,
    headingLevel: sec.headingLevel || 2,
    blocks: (sec.blocks || []).map((b) => ({
      id: String(b.id || ""),
      sectionIndex: b.sectionIndex ?? si,
      semanticType: b.semanticType || "prose",
      emphasis: b.emphasis || "normal",
      calloutLabel: b.calloutLabel,
      dataPoints: b.dataPoints,
      comparisonSides: b.comparisonSides,
      steps: b.steps,
      quoteAttribution: b.quoteAttribution,
    })),
  }));

  return {
    articleType: parsed.articleType || "opinion",
    title: parsed.title || "",
    subtitle: parsed.subtitle || "",
    category: (parsed.category || "tech") as ArticleCategory,
    keywords: parsed.keywords || [],
    estimatedReadMinutes: parsed.estimatedReadMinutes || 5,
    sections: parsed.sections,
  };
}
