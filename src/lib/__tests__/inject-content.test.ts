import { describe, it, expect } from "vitest";
import {
  injectContentBlocks,
  escapeAndFormatText,
  buildFallbackHTML,
} from "../inject-content";
import { ContentBlock } from "../content-blocks";

const sampleBlocks: ContentBlock[] = [
  { id: "block_1", sectionIndex: 1, rawText: "这是第一节的原文内容，包含具体案例。" },
  { id: "block_2", sectionIndex: 2, rawText: "这是第二节的原文内容，包含数字举例：3周时间。" },
];

describe("injectContentBlocks", () => {
  it("replaces standard placeholders with block content", () => {
    const skeleton = `<html><body>
<h2>第一节</h2>
<div class="section-content" data-block-id="block_1"></div>
<h2>第二节</h2>
<div class="section-content" data-block-id="block_2"></div>
</body></html>`;
    const { html, report } = injectContentBlocks(skeleton, sampleBlocks);
    expect(report.injectedCount).toBe(2);
    expect(html).toContain("这是第一节的原文内容");
    expect(html).toContain("这是第二节的原文内容");
    expect(report.orphanPlaceholderIds).toHaveLength(0);
    expect(report.missingPlaceholderIds).toHaveLength(0);
    expect(report.fullyDegraded).toBe(false);
  });

  it("handles single-quote attributes and self-closing div", () => {
    const skeleton = `<div data-block-id='block_1' class="section-content" />`;
    const { html, report } = injectContentBlocks(skeleton, sampleBlocks);
    expect(report.injectedCount).toBe(1);
    expect(html).toContain("这是第一节的原文内容");
  });

  it("handles swapped attribute order", () => {
    const skeleton = `<div data-block-id="block_2" class="section-content"></div>`;
    const { html, report } = injectContentBlocks(skeleton, sampleBlocks);
    expect(report.injectedCount).toBe(1);
    expect(html).toContain("3周时间");
  });

  it("handles placeholder with whitespace inside", () => {
    const skeleton = `<div class="section-content" data-block-id="block_1">   \n  </div>`;
    const { report } = injectContentBlocks(skeleton, sampleBlocks);
    expect(report.injectedCount).toBe(1);
  });

  it("removes orphan placeholders with unknown block_id", () => {
    const skeleton = `<div class="section-content" data-block-id="block_99"></div>`;
    const { html, report } = injectContentBlocks(skeleton, sampleBlocks);
    expect(report.orphanPlaceholderIds).toContain("block_99");
    expect(html).not.toContain('data-block-id="block_99"');
  });

  it("appends content for missing placeholders before </body>", () => {
    const skeleton = `<html><body><h2>第一节</h2><div class="section-content" data-block-id="block_1"></div></body></html>`;
    const { html, report } = injectContentBlocks(skeleton, sampleBlocks);
    expect(report.missingPlaceholderIds).toContain("block_2");
    expect(html).toContain("这是第二节的原文内容");
    expect(html.indexOf("</body>")).toBeGreaterThan(html.indexOf("这是第二节的原文内容"));
  });

  it("marks fullyDegraded when no valid placeholder found", () => {
    const skeleton = `<html><body><h1>排版完全跑偏，没有任何占位符</h1></body></html>`;
    const { html, report } = injectContentBlocks(skeleton, sampleBlocks);
    expect(report.fullyDegraded).toBe(true);
    expect(html).toContain("这是第一节的原文内容");
    expect(html).toContain("这是第二节的原文内容");
  });

  it("escapes HTML special characters to prevent XSS", () => {
    const blocks: ContentBlock[] = [
      { id: "block_1", sectionIndex: 1, rawText: `这里有<script>alert('xss')</script>和"引号"以及emoji😀。` },
    ];
    const skeleton = `<div class="section-content" data-block-id="block_1"></div>`;
    const { html } = injectContentBlocks(skeleton, blocks);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("😀");
  });

  it("converts double-newline into multiple <p> tags", () => {
    const blocks: ContentBlock[] = [
      { id: "block_1", sectionIndex: 1, rawText: "第一段内容在这里。\n\n第二段内容在这里。" },
    ];
    const formatted = escapeAndFormatText(blocks[0].rawText);
    const pCount = (formatted.match(/<p>/g) || []).length;
    expect(pCount).toBe(2);
  });

  it("is reversible through decode for special characters", () => {
    const original = `测试 & 符号、"双引号"、'单引号'、<尖括号>混合的情况`;
    const formatted = escapeAndFormatText(original);
    const decoded = formatted
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    expect(decoded).toBe(original);
  });

  it("buildFallbackHTML contains all blocks and is a valid HTML doc", () => {
    const html = buildFallbackHTML("测试标题", sampleBlocks);
    expect(html).toContain("这是第一节的原文内容");
    expect(html).toContain("3周时间");
    expect(html).toContain("<!DOCTYPE html>");
  });
});
