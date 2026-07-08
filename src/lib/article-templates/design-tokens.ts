import { ArticleDesignToken, TemplateId } from "@/types";

export function articleTokenToCSSVars(t: ArticleDesignToken): string {
  return [
    `--art-bg: ${t.palette.bg};`,
    `--art-surface: ${t.palette.surface};`,
    `--art-title: ${t.palette.title};`,
    `--art-heading: ${t.palette.heading};`,
    `--art-text: ${t.palette.text};`,
    `--art-subtle: ${t.palette.subtle};`,
    `--art-border: ${t.palette.border};`,
    `--art-primary: ${t.palette.primary};`,
    `--art-secondary: ${t.palette.secondary};`,
    `--art-accent: ${t.palette.accent};`,
    `--art-code-bg: ${t.palette.codeBg};`,
    `--art-code-text: ${t.palette.codeText};`,
    `--art-heading-family: ${t.typography.headingFamily};`,
    `--art-body-family: ${t.typography.bodyFamily};`,
    `--art-mono-family: ${t.typography.monoFamily};`,
    `--art-heading-weight: ${t.typography.headingWeight};`,
    `--art-h1-size: ${t.typography.h1Size}px;`,
    `--art-h2-size: ${t.typography.h2Size}px;`,
    `--art-body-size: ${t.typography.bodySize}px;`,
    `--art-caption-size: ${t.typography.captionSize}px;`,
    `--art-line-height: ${t.typography.lineHeight};`,
    `--art-letter-spacing: ${t.typography.letterSpacing};`,
    `--art-content-width: ${t.layout.contentMaxWidth}px;`,
    `--art-cover-padding-v: ${t.layout.coverPaddingV}px;`,
    `--art-section-gap: ${t.layout.sectionGap}px;`,
  ].join("\n");
}

export const EDITORIAL_TOKEN: ArticleDesignToken = {
  templateId: "editorial",
  palette: {
    bg: "#f5f2ed",
    surface: "#ffffff",
    title: "#1a1a1a",
    heading: "#2b2b2b",
    text: "#333333",
    subtle: "#8c8c8c",
    border: "#e8e4df",
    primary: "#4a6741",
    secondary: "#7a9a6e",
    accent: "#f7f5f0",
    codeBg: "#f4f4f4",
    codeText: "#2d2d2d",
  },
  typography: {
    headingFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    bodyFamily: "'Source Serif 4', 'Georgia', 'Noto Serif CJK SC', serif",
    monoFamily: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
    headingWeight: 600,
    h1Size: 44,
    h2Size: 26,
    bodySize: 18,
    captionSize: 13,
    lineHeight: 1.9,
    letterSpacing: "-0.015em",
  },
  layout: {
    contentMaxWidth: 720,
    coverPaddingV: 60,
    sectionGap: 52,
    dividerStyle: "dot",
    tocStyle: "sidebar",
    coverLayout: "left-aligned",
  },
  decoration: {
    coverGradient: "linear-gradient(135deg, #4a6741 0%, #7a9a6e 100%)",
    accentShape: "line",
    dropCap: true,
  },
  moodDescription: "Nordic editorial minimalism — low saturation, generous whitespace, literary feel",
};

export const TUTORIAL_MINIMAL_TOKEN: ArticleDesignToken = {
  templateId: "tutorial-minimal",
  palette: {
    bg: "#ececec",
    surface: "#ffffff",
    title: "#111111",
    heading: "#1a1a1a",
    text: "#37352f",
    subtle: "#9b9a97",
    border: "#e5e5e5",
    primary: "#2383e2",
    secondary: "#5299e0",
    accent: "#f7f6f5",
    codeBg: "#1e1e1e",
    codeText: "#e0e0e0",
  },
  typography: {
    headingFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    bodyFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    monoFamily: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
    headingWeight: 600,
    h1Size: 36,
    h2Size: 22,
    bodySize: 16,
    captionSize: 12,
    lineHeight: 1.7,
    letterSpacing: "-0.01em",
  },
  layout: {
    contentMaxWidth: 780,
    coverPaddingV: 48,
    sectionGap: 40,
    dividerStyle: "line",
    tocStyle: "inline",
    coverLayout: "centered",
  },
  decoration: {
    coverGradient: "none",
    accentShape: "circle",
    dropCap: false,
  },
  moodDescription: "Clean documentation style — high readability, step-oriented, no distractions",
};

export const PRESET_TOKENS: Record<TemplateId, ArticleDesignToken> = {
  editorial: EDITORIAL_TOKEN,
  "tutorial-minimal": TUTORIAL_MINIMAL_TOKEN,
};

export const FALLBACK_ARTICLE_TOKEN: ArticleDesignToken = EDITORIAL_TOKEN;

export function resolveArticleToken(
  templateId: TemplateId,
  _overrides?: Partial<ArticleDesignToken>
): ArticleDesignToken {
  return PRESET_TOKENS[templateId] ?? FALLBACK_ARTICLE_TOKEN;
}
