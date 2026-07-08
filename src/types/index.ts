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

// ── 卡片图套装 ──────────────────────────────────────────

export interface CardPlatformPreset {
  id: string;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
}

export const CARD_PLATFORMS: CardPlatformPreset[] = [
  { id: "xhs34", label: "小红书 3:4", shortLabel: "小红书", width: 1080, height: 1440 },
  { id: "xhs11", label: "小红书 1:1", shortLabel: "小红书方图", width: 1080, height: 1080 },
  { id: "dy34", label: "抖音图文 3:4", shortLabel: "抖音", width: 1080, height: 1440 },
  { id: "dy916", label: "抖音图文 9:16", shortLabel: "抖音竖屏", width: 1080, height: 1920 },
  { id: "moments", label: "朋友圈 1:1", shortLabel: "朋友圈", width: 1080, height: 1080 },
  { id: "custom", label: "自定义尺寸", shortLabel: "自定义", width: 1080, height: 1440 },
];

export interface CardTheme {
  id: string;
  name: string;
  // 主色 — 封面顶部色带、章节标记、数字高亮
  primary: string;
  // 辅色 — 渐变终点、装饰元素
  secondary: string;
  // 背景色 — 卡片整体背景
  bg: string;
  // 标题色
  title: string;
  // 正文色
  text: string;
  // 浅色装饰色 — 分割线、标签底
  subtle: string;
}

export const CARD_THEMES_BY_CATEGORY: Record<ArticleCategory, CardTheme> = {
  tech:     { id: "tech",     name: "科技",     primary: "#4f46e5", secondary: "#818cf8", bg: "#ffffff", title: "#0f172a", text: "#334155", subtle: "#eef2ff" },
  finance:  { id: "finance",  name: "财经",     primary: "#1e3a5f", secondary: "#2d5a87", bg: "#ffffff", title: "#0f172a", text: "#334155", subtle: "#f1f5f9" },
  travel:   { id: "travel",   name: "旅行",     primary: "#ea580c", secondary: "#f97316", bg: "#ffffff", title: "#1c1917", text: "#44403c", subtle: "#fff7ed" },
  tutorial: { id: "tutorial", name: "教程",     primary: "#047857", secondary: "#10b981", bg: "#ffffff", title: "#0f172a", text: "#334155", subtle: "#f0fdf4" },
  story:    { id: "story",    name: "故事",     primary: "#be185d", secondary: "#ec4899", bg: "#ffffff", title: "#1f2937", text: "#374151", subtle: "#fdf2f8" },
  news:     { id: "news",     name: "新闻",     primary: "#b91c1c", secondary: "#ef4444", bg: "#ffffff", title: "#111827", text: "#374151", subtle: "#fef2f2" },
};

export const CARD_THEMES_EXTRAS: CardTheme[] = [
  { id: "minimal", name: "极简灰", primary: "#374151", secondary: "#6b7280", bg: "#ffffff", title: "#111827", text: "#4b5563", subtle: "#f3f4f6" },
  { id: "warm",    name: "暖阳",   primary: "#92400e", secondary: "#d97706", bg: "#fffbeb", title: "#1c1917", text: "#44403c", subtle: "#fef3c7" },
];

export type CardType = "cover" | "content" | "ending";

export type ContentCardStyle = "auto" | "article" | "steps" | "data";

// ── AI 驱动视觉设计系统 ─────────────────────────────────

export interface CardDesignToken {
  palette: {
    bg: string;
    surface: string;
    title: string;
    text: string;
    subtle: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headingFamily: string;
    bodyFamily: string;
    headingWeight: number;
    headingSize: number;
    bodySize: number;
    letterSpacing: string;
    lineHeight: number;
  };
  layout: {
    borderRadius: number;
    cardPadding: number;
    shadow: string;
    topDecoration: "gradient" | "solid" | "dots" | "none";
    progressStyle: "number" | "dot" | "minimal";
    coverStyle: "centered" | "band-above" | "landscape";
  };
  moodDescription?: string;
}

export interface DesignInput {
  title: string;
  summary: string;
  category: ArticleCategory;
  keywords: string[];
  sections: { title: string; estimatedType: "article" | "steps" | "data" }[];
  targetPlatform: string;
}

export interface CardSettings {
  platformId: string;
  customWidth: number;
  customHeight: number;
  themeId: string; // "auto" 表示跟随文章分类，否则是 CardTheme.id
  designStyle: "ai" | "preset"; // AI 设计 or 预设主题
  contentStyle: ContentCardStyle;
  accountHandle: string;
  endingSlogan: string;
}

export interface CardPage {
  type: CardType;
  label: string;
  sectionIndex?: number; // which section this maps to
  html: string;
}

export interface GeneratedCard {
  id: string;
  type: CardType;
  label: string;
  dataUrl: string;
}

// ── 文章模板排版 v0.5.0 ─────────────────────────────────────

export type TemplateId = "editorial" | "tutorial-minimal";

export type SemanticBlockType =
  | "prose"       // 普通段落
  | "callout"     // 提示/警告/重点框
  | "steps"       // 步骤列表
  | "comparison"  // 对比
  | "data"        // 数据亮点
  | "quote"       // 引用/引言
  | "transition"; // 视觉过渡

export type EmphasisLevel = "normal" | "high" | "subtle";

export interface DataPoint {
  label: string;
  value: string;
}

export interface SemanticBlock {
  id: string;
  sectionIndex: number;
  semanticType: SemanticBlockType;
  emphasis: EmphasisLevel;
  calloutLabel?: string;
  dataPoints?: DataPoint[];
  comparisonSides?: { left: string; right: string };
  steps?: { heading: string }[];
  quoteAttribution?: string;
}

export interface SemanticSection {
  heading: string;
  headingLevel: number;
  blocks: SemanticBlock[];
}

export interface SemanticLayout {
  articleType: "opinion" | "tutorial" | "story" | "news" | "product";
  title: string;
  subtitle: string;
  category: ArticleCategory;
  keywords: string[];
  estimatedReadMinutes: number;
  sections: SemanticSection[];
}

export interface ArticleDesignToken {
  templateId: TemplateId;
  palette: {
    bg: string;
    surface: string;
    title: string;
    heading: string;
    text: string;
    subtle: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    codeBg: string;
    codeText: string;
  };
  typography: {
    headingFamily: string;
    bodyFamily: string;
    monoFamily: string;
    headingWeight: number;
    h1Size: number;
    h2Size: number;
    bodySize: number;
    captionSize: number;
    lineHeight: number;
    letterSpacing: string;
  };
  layout: {
    contentMaxWidth: number;
    coverPaddingV: number;
    sectionGap: number;
    dividerStyle: "line" | "dot" | "space" | "none";
    tocStyle: "sidebar" | "inline" | "none";
    coverLayout: "centered" | "left-aligned";
  };
  decoration: {
    coverGradient: string;
    accentShape: "circle" | "line" | "dots" | "none";
    dropCap: boolean;
  };
  moodDescription?: string;
}

export interface TemplateRenderInput {
  token: ArticleDesignToken;
  semantic: SemanticLayout;
  contentBlocks: import("../lib/content-blocks").ContentBlock[];
  metadata: {
    author?: string;
    date?: string;
    accountHandle?: string;
  };
}

export interface ArticleSettings {
  templateId: TemplateId;
  layoutMode: "ai" | "template";
}
