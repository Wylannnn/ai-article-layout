/**
 * AI 驱动的卡片视觉设计 — 不碰内容，只生成设计 Token
 *
 * 流程：文章元数据 → AI 分析情绪/类型 → 输出 CardDesignToken
 */

import { DesignInput, CardDesignToken } from "@/types";
import { callAI } from "./ai-client";
import { loadConfig } from "./storage";

const DESIGN_SYSTEM = `你是一名为文章匹配视觉设计的 AI。输出 JSON，不要包含任何文章原文。
根据文章的标题、摘要、分类和关键词，设计一套卡片图套装的设计 Token。

要求：
- 设计风格必须与文章主题/情绪匹配
- 科技类 → 冷色系、干净几何、数据感
- 财经类 → 深蓝/金色、专业感、有分量
- 旅行类 → 暖色、轻松、明亮通透
- 教程类 → 清晰、步骤化、高可读性
- 故事类 → 柔和、叙事感、有温度
- 新闻类 → 稳重、高对比、信息密度感
- 不要使用过于饱和或廉价的颜色
- 同一套 Token 内所有颜色必须协调
- 中文字体优先使用系统字体栈
- 不需要解释，只输出 JSON

输出格式：
{
  "palette": {
    "bg": "卡片背景色",
    "surface": "组件内背景色（数据卡片单元格等）",
    "title": "标题色",
    "text": "正文字",
    "subtle": "装饰色/分割线",
    "border": "边框色",
    "primary": "主强调色",
    "secondary": "辅强调色（渐变终点）",
    "accent": "高亮色（引文/标签）"
  },
  "typography": {
    "headingFamily": "标题字体族",
    "bodyFamily": "正文字体族",
    "headingWeight": 700,
    "headingSize": 24,
    "bodySize": 16,
    "letterSpacing": "-0.01em",
    "lineHeight": 1.6
  },
  "layout": {
    "borderRadius": 16,
    "cardPadding": 32,
    "shadow": "box-shadow 值",
    "topDecoration": "gradient | solid | dots | none",
    "progressStyle": "number | dot | minimal",
    "coverStyle": "centered | band-above | landscape"
  },
  "moodDescription": "一句话描述设计情绪（仅供调试）"
}`;

/** 兜底默认设计 Token（AI 调用失败时使用） */
export const FALLBACK_DESIGN_TOKEN: CardDesignToken = {
  palette: {
    bg: "#ffffff",
    surface: "#f3f4f6",
    title: "#0f172a",
    text: "#334155",
    subtle: "#e2e8f0",
    border: "#e5e7eb",
    primary: "#4f46e5",
    secondary: "#818cf8",
    accent: "#6366f1",
  },
  typography: {
    headingFamily: "Inter, -apple-system, sans-serif",
    bodyFamily: "Inter, -apple-system, sans-serif",
    headingWeight: 700,
    headingSize: 24,
    bodySize: 16,
    letterSpacing: "-0.01em",
    lineHeight: 1.6,
  },
  layout: {
    borderRadius: 16,
    cardPadding: 32,
    shadow: "0 4px 24px rgba(0,0,0,0.06)",
    topDecoration: "gradient",
    progressStyle: "number",
    coverStyle: "centered",
  },
  moodDescription: "默认 — AI 设计不可用时回退",
};

export async function generateDesign(input: DesignInput): Promise<CardDesignToken> {
  const config = loadConfig();
  if (!config || !config.apiKey) {
    console.warn("[card-design] 未配置 API Key，使用默认设计");
    return FALLBACK_DESIGN_TOKEN;
  }

  const platformLabel = PLATFORM_LABELS[input.targetPlatform] || input.targetPlatform;
  const sectionSummary = input.sections
    .map((s) => `- "${s.title}" (${s.estimatedType})`)
    .join("\n");

  const userPrompt = `为以下文章设计卡片图视觉方案：

标题：${input.title}
摘要：${input.summary}
分类：${input.category}
关键词：${input.keywords.join(", ") || "无"}
发布平台：${platformLabel}
文章节数：共 ${input.sections.length} 节

各节标题：
${sectionSummary}

请根据以上信息生成 CardDesignToken JSON。`;

  try {
    const text = await callAI(config, [
      { role: "user", content: userPrompt },
    ], { system: DESIGN_SYSTEM, maxTokens: 4000 });

    const parsed = parseDesignToken(text);
    if (parsed) return parsed;

    console.warn("[card-design] AI 输出解析失败，使用默认设计");
    return FALLBACK_DESIGN_TOKEN;
  } catch (err) {
    console.error("[card-design] AI 调用失败:", err);
    return FALLBACK_DESIGN_TOKEN;
  }
}

function parseDesignToken(text: string): CardDesignToken | null {
  // 尝试从 ```json ... ``` 块中提取
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  try {
    const raw = JSON.parse(jsonStr);

    // 验证结构完整性
    if (!raw.palette || !raw.typography || !raw.layout) return null;

    return {
      palette: {
        bg: raw.palette.bg || FALLBACK_DESIGN_TOKEN.palette.bg,
        surface: raw.palette.surface || FALLBACK_DESIGN_TOKEN.palette.surface,
        title: raw.palette.title || FALLBACK_DESIGN_TOKEN.palette.title,
        text: raw.palette.text || FALLBACK_DESIGN_TOKEN.palette.text,
        subtle: raw.palette.subtle || FALLBACK_DESIGN_TOKEN.palette.subtle,
        border: raw.palette.border || FALLBACK_DESIGN_TOKEN.palette.border,
        primary: raw.palette.primary || FALLBACK_DESIGN_TOKEN.palette.primary,
        secondary: raw.palette.secondary || FALLBACK_DESIGN_TOKEN.palette.secondary,
        accent: raw.palette.accent || FALLBACK_DESIGN_TOKEN.palette.accent,
      },
      typography: {
        headingFamily: raw.typography.headingFamily || FALLBACK_DESIGN_TOKEN.typography.headingFamily,
        bodyFamily: raw.typography.bodyFamily || FALLBACK_DESIGN_TOKEN.typography.bodyFamily,
        headingWeight: raw.typography.headingWeight ?? FALLBACK_DESIGN_TOKEN.typography.headingWeight,
        headingSize: raw.typography.headingSize ?? FALLBACK_DESIGN_TOKEN.typography.headingSize,
        bodySize: raw.typography.bodySize ?? FALLBACK_DESIGN_TOKEN.typography.bodySize,
        letterSpacing: raw.typography.letterSpacing || FALLBACK_DESIGN_TOKEN.typography.letterSpacing,
        lineHeight: raw.typography.lineHeight ?? FALLBACK_DESIGN_TOKEN.typography.lineHeight,
      },
      layout: {
        borderRadius: raw.layout.borderRadius ?? FALLBACK_DESIGN_TOKEN.layout.borderRadius,
        cardPadding: raw.layout.cardPadding ?? FALLBACK_DESIGN_TOKEN.layout.cardPadding,
        shadow: raw.layout.shadow || FALLBACK_DESIGN_TOKEN.layout.shadow,
        topDecoration: validEnum(raw.layout.topDecoration, ["gradient", "solid", "dots", "none"], FALLBACK_DESIGN_TOKEN.layout.topDecoration),
        progressStyle: validEnum(raw.layout.progressStyle, ["number", "dot", "minimal"], FALLBACK_DESIGN_TOKEN.layout.progressStyle),
        coverStyle: validEnum(raw.layout.coverStyle, ["centered", "band-above", "landscape"], FALLBACK_DESIGN_TOKEN.layout.coverStyle),
      },
      moodDescription: raw.moodDescription,
    };
  } catch {
    return null;
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  xhs34: "小红书 3:4",
  xhs11: "小红书 1:1",
  dy34: "抖音图文 3:4",
  dy916: "抖音图文 9:16",
  moments: "朋友圈",
  custom: "自定义尺寸",
};

function validEnum<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}
