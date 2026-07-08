import { ArticleDesignToken, SemanticBlock, SemanticSection } from "@/types";
import { ContentBlock } from "../content-blocks";
import { escapeAndFormatText } from "../inject-content";
import { articleTokenToCSSVars } from "./design-tokens";

export interface TemplateContext {
  token: ArticleDesignToken;
  blocks: ContentBlock[];
}

export function buildBlockMap(blocks: ContentBlock[]): Map<string, ContentBlock> {
  return new Map(blocks.map((b) => [b.id, b]));
}

export function renderBlockContent(
  sb: SemanticBlock,
  blockMap: Map<string, ContentBlock>
): string {
  const block = blockMap.get(sb.id);
  if (!block) {
    return `<div class="block-content block-missing" data-block-id="${sb.id}"><p>—</p></div>`;
  }
  const formatted = escapeAndFormatText(block.rawText);
  if (!formatted) {
    return `<div class="block-content" data-block-id="${sb.id}"><p>—</p></div>`;
  }
  return `<div class="block-content" data-block-id="${sb.id}">${formatted}</div>`;
}

export const SHARED_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html{font-size:var(--art-body-size,18px);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{background:var(--art-bg,#ececec);font-family:var(--art-body-family,serif);
  font-size:1rem;line-height:var(--art-line-height,1.9);color:var(--art-text,#1a1a1a)}
`;

export function wrapDocument(
  token: ArticleDesignToken,
  title: string,
  fontLink: string,
  extraCSS: string,
  bodyHTML: string
): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${e(title)}</title>
${fontLink}
<style>
${SHARED_CSS}
:root{${articleTokenToCSSVars(token)}}
${extraCSS}
</style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}

function e(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildFontLink(token: ArticleDesignToken): string {
  const hasSerif = token.typography.bodyFamily.includes("Serif");
  const families: string[] = ["Inter"];
  if (hasSerif) families.push("Source+Serif+4:ital,wght@0,400;0,600;1,400");
  families.push("JetBrains+Mono");
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap" rel="stylesheet">`;
}

function sectionHeadingHTML(section: SemanticSection, index: number): string {
  const num = String(index + 1).padStart(2, "0");
  const eng = sectionEnglishLabel(section.heading);
  return `<h2 class="section-heading" id="s${index + 1}"><span class="section-number">${num}</span><span class="section-eng">${eng}</span>${e(section.heading)}</h2>`;
}

function sectionEnglishLabel(heading: string): string {
  const map: Record<string, string> = {
    "总结": "SUMMARY", "结语": "EPILOGUE", "结论": "CONCLUSION",
    "引言": "INTRODUCTION", "前言": "PREFACE", "概述": "OVERVIEW",
    "背景": "BACKGROUND", "方案": "SOLUTION", "实现": "IMPLEMENTATION",
    "测试": "TEST", "分析": "ANALYSIS", "对比": "COMPARISON",
    "思考": "THOUGHTS", "展望": "OUTLOOK", "实践": "PRACTICE",
    "教程": "TUTORIAL", "案例": "CASE STUDY", "复盘": "RETROSPECTIVE",
  };
  for (const [cn, en] of Object.entries(map)) {
    if (heading.includes(cn)) return en;
  }
  return "CHAPTER";
}

export function renderProseBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  const emphasis = sb.emphasis !== "normal" ? ` block-emphasis-${sb.emphasis}` : "";
  return `<div class="block-prose${emphasis}" data-block-id="${sb.id}">
  ${renderBlockContent(sb, blockMap)}
</div>`;
}

export function renderCalloutBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  const label = sb.calloutLabel ?? "提示";
  return `<div class="block-callout" data-block-id="${sb.id}">
  <div class="callout-label">${e(label)}</div>
  ${renderBlockContent(sb, blockMap)}
</div>`;
}

export function renderQuoteBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  const attr = sb.quoteAttribution ? `<div class="quote-attribution">— ${e(sb.quoteAttribution)}</div>` : "";
  return `<div class="block-quote" data-block-id="${sb.id}">
  ${renderBlockContent(sb, blockMap)}
  ${attr}
</div>`;
}

export function renderStepsBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  const block = blockMap.get(sb.id);
  if (!block) return renderBlockContent(sb, blockMap);

  const text = block.rawText.trim();
  const stepRe = /(?:第[一二三四五六七八九十\d]+[步章]|[Ss]tep\s*\d+|[①②③④⑤⑥⑦⑧⑨⑩]|\d+[.、．])\s*/g;
  const parts = text.split(stepRe).filter(Boolean);
  const headings = sb.steps ?? [];

  if (parts.length <= 1) {
    return renderProseBlock(sb, blockMap);
  }

  const items = parts.map((part, i) => {
    const heading = headings[i]?.heading ?? `步骤 ${i + 1}`;
    return `<div class="step-item">
    <div class="step-num">${i + 1}</div>
    <div class="step-body">
      <h4 class="step-heading">${e(heading)}</h4>
      <p>${e(part.trim()).replace(/\n/g, "<br>")}</p>
    </div>
  </div>`;
  }).join("\n");

  return `<div class="block-steps" data-block-id="${sb.id}">${items}</div>`;
}

export function renderDataBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  const points = sb.dataPoints ?? [];
  const cells = points.length > 0
    ? points.map((p) => `<div class="data-cell">
    <div class="data-value">${e(p.value)}</div>
    <div class="data-label">${e(p.label)}</div>
  </div>`).join("\n")
    : `<div class="data-cell"><div class="data-label">数据</div></div>`;

  const content = renderBlockContent(sb, blockMap);
  return `<div class="block-data" data-block-id="${sb.id}">
  <div class="data-grid">${cells}</div>
  ${content}
</div>`;
}

export function renderComparisonBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  const sides = sb.comparisonSides ?? { left: "A", right: "B" };
  const content = renderBlockContent(sb, blockMap);
  return `<div class="block-comparison" data-block-id="${sb.id}">
  <div class="comp-grid">
    <div class="comp-side"><div class="comp-label">${e(sides.left)}</div></div>
    <div class="comp-side"><div class="comp-label">${e(sides.right)}</div></div>
  </div>
  ${content}
</div>`;
}

export function renderTransitionBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  return `<div class="block-transition" data-block-id="${sb.id}">
  <div class="transition-mark"></div>
  ${renderBlockContent(sb, blockMap)}
</div>`;
}

export function renderBlock(sb: SemanticBlock, blockMap: Map<string, ContentBlock>): string {
  switch (sb.semanticType) {
    case "callout": return renderCalloutBlock(sb, blockMap);
    case "quote": return renderQuoteBlock(sb, blockMap);
    case "steps": return renderStepsBlock(sb, blockMap);
    case "data": return renderDataBlock(sb, blockMap);
    case "comparison": return renderComparisonBlock(sb, blockMap);
    case "transition": return renderTransitionBlock(sb, blockMap);
    default: return renderProseBlock(sb, blockMap);
  }
}

export { sectionHeadingHTML };
