// lib/inject-content.ts
// ──────────────────────────────────────────────────────────────
// 占位符注入模块：把 ContentBlock 的原文精确注入到排版LLM生成的
// HTML骨架中，替换占位符标记。
//
// 设计原则：
// - 注入的文本必须是原文逐字内容（经过HTML转义），绝不允许任何转写。
// - 三类异常必须都有明确处理，不能静默失败。
// ──────────────────────────────────────────────────────────────

import { ContentBlock } from "./content-blocks";

export interface InjectionReport {
  injectedCount: number;
  orphanPlaceholderIds: string[];
  missingPlaceholderIds: string[];
  fullyDegraded: boolean;
}

// ── HTML 转义 ──────────────────────────────────────────────

export function escapeAndFormatText(rawText: string): string {
  const escapeChar = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const trimmed = rawText.trim();
  if (trimmed.length === 0) return "";

  const paragraphs = trimmed.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) {
    return `<p>${escapeChar(trimmed).replace(/\n/g, "<br>")}</p>`;
  }
  return paragraphs
    .map((p) => `<p>${escapeChar(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

// ── 占位符匹配 ──────────────────────────────────────────────

const PLACEHOLDER_RE =
  /<div\b[^>]*\bdata-block-id\s*=\s*["']([^"']+)["'][^>]*>(?:\s*)<\/div>|<div\b[^>]*\bdata-block-id\s*=\s*["']([^"']+)["'][^>]*\/>/gi;

interface PlaceholderMatch {
  fullMatch: string;
  blockId: string;
  index: number;
}

function findPlaceholders(html: string): PlaceholderMatch[] {
  const results: PlaceholderMatch[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_RE);
  while ((m = re.exec(html)) !== null) {
    const blockId = m[1] ?? m[2];
    if (blockId) {
      results.push({ fullMatch: m[0], blockId, index: m.index });
    }
  }
  return results;
}

// ── 主注入函数 ──────────────────────────────────────────────

export function injectContentBlocks(
  htmlSkeleton: string,
  blocks: ContentBlock[]
): { html: string; report: InjectionReport } {
  const blockMap = new Map(blocks.map((b) => [b.id, b]));
  const placeholders = findPlaceholders(htmlSkeleton);

  const orphanIds: string[] = [];
  const matchedIds = new Set<string>();
  let injectedCount = 0;

  let result = htmlSkeleton;

  // 从后往前替换，避免字符串长度变化导致 index 错位
  const sortedPlaceholders = [...placeholders].sort((a, b) => b.index - a.index);

  for (const ph of sortedPlaceholders) {
    const block = blockMap.get(ph.blockId);
    if (block) {
      const formatted = escapeAndFormatText(block.rawText);
      const replacement = `<div class="section-content" data-block-id="${ph.blockId}">${formatted}</div>`;
      result =
        result.slice(0, ph.index) + replacement + result.slice(ph.index + ph.fullMatch.length);
      matchedIds.add(ph.blockId);
      injectedCount++;
    } else {
      // 模型编造了不存在的 block_id — 移除占位符标签本身
      result = result.slice(0, ph.index) + result.slice(ph.index + ph.fullMatch.length);
      orphanIds.push(ph.blockId);
    }
  }

  // 模型漏写了占位符 — 追加到 </body> 之前
  const missingIds: string[] = [];
  for (const block of blocks) {
    if (matchedIds.has(block.id)) continue;
    missingIds.push(block.id);
    const formatted = escapeAndFormatText(block.rawText);
    const fallbackBlock = `<div class="section-content" data-block-id="${block.id}" data-fallback-injected="true">${formatted}</div>`;
    result = appendFallbackBlock(result, fallbackBlock);
  }

  const fullyDegraded = injectedCount === 0 && blocks.length > 0;

  return {
    html: result,
    report: {
      injectedCount,
      orphanPlaceholderIds: orphanIds,
      missingPlaceholderIds: missingIds,
      fullyDegraded,
    },
  };
}

function appendFallbackBlock(html: string, blockHtml: string): string {
  const bodyCloseIdx = html.lastIndexOf("</body>");
  if (bodyCloseIdx !== -1) {
    return html.slice(0, bodyCloseIdx) + blockHtml + html.slice(bodyCloseIdx);
  }
  return html + blockHtml;
}

// ── 完全降级兜底模板 ──────────────────────────────────────────

export function buildFallbackHTML(title: string, blocks: ContentBlock[]): string {
  const sectionsHtml = blocks
    .map(
      (b) => `
    <section data-block-id="${b.id}" data-fallback-injected="true">
      ${escapeAndFormatText(b.rawText)}
    </section>`
    )
    .join("\n");

  const escapedTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${escapedTitle}</title>
<style>
  body { max-width: 720px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, sans-serif; line-height: 1.8; color: #1a1a1a; }
  h1 { font-size: 28px; margin-bottom: 24px; }
  section { margin-bottom: 32px; }
  p { margin: 12px 0; }
</style>
</head>
<body>
<h1>${escapedTitle}</h1>
${sectionsHtml}
</body>
</html>`;
}
