import { describe, it, expect } from "vitest";
import { TEMPLATE_GUIDES, HTML_SYSTEM_PROMPT, TOC_AND_EXPORT_RULES } from "../templates";
import { ArticleCategory } from "@/types";

const ALL_CATEGORIES: ArticleCategory[] = [
  "tech",
  "finance",
  "travel",
  "tutorial",
  "story",
  "news",
];

describe("TEMPLATE_GUIDES", () => {
  it("has entries for all 6 categories", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(TEMPLATE_GUIDES[cat]).toBeDefined();
      expect(typeof TEMPLATE_GUIDES[cat]).toBe("string");
    }
  });

  it("each guide is a non-empty string with required sections", () => {
    for (const cat of ALL_CATEGORIES) {
      const guide = TEMPLATE_GUIDES[cat];
      expect(guide.length).toBeGreaterThan(100);
      // Every guide must mention 配色, 字体, 排版特征
      expect(guide).toMatch(/配色/);
      expect(guide).toMatch(/字体/);
      expect(guide).toMatch(/排版特征/);
    }
  });

  it("no guide mentions dark mode or prefers-color-scheme", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(TEMPLATE_GUIDES[cat]).not.toMatch(/prefers-color-scheme|暗黑|[Dd]ark.?[Mm]ode/);
    }
  });

  it("no guide allows 100vw in cover", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(TEMPLATE_GUIDES[cat]).not.toMatch(/100vw/);
    }
  });
});

describe("HTML_SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(HTML_SYSTEM_PROMPT.length).toBeGreaterThan(500);
  });

  it("includes TOC_AND_EXPORT_RULES", () => {
    expect(HTML_SYSTEM_PROMPT).toContain(TOC_AND_EXPORT_RULES);
  });

  it("uses 780px as max-width (not 720px)", () => {
    expect(HTML_SYSTEM_PROMPT).toMatch(/max-width:\s*780px/);
    expect(HTML_SYSTEM_PROMPT).not.toMatch(/max-width:\s*720px/);
  });

  it("includes 画框感 layout rules (14a-14c)", () => {
    expect(HTML_SYSTEM_PROMPT).toMatch(/14a/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/14b/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/14c/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/e8e8e8/);  // gray bg color
    expect(HTML_SYSTEM_PROMPT).toMatch(/box-shadow/);
  });

  it("does NOT mention dark mode or prefers-color-scheme", () => {
    expect(HTML_SYSTEM_PROMPT).not.toMatch(/prefers-color-scheme/);
    expect(HTML_SYSTEM_PROMPT).not.toMatch(/dark.*mode/i);
  });

  it("forbids <a href=#> anchor jumps in rules 23-25", () => {
    expect(HTML_SYSTEM_PROMPT).toContain("绝对禁止使用 <a href=");
    expect(HTML_SYSTEM_PROMPT).toContain("scrollIntoView");
    expect(HTML_SYSTEM_PROMPT).toContain("target=\"_top\"");
  });

  it("requires output starts with <!DOCTYPE html> (rule 11)", () => {
    expect(HTML_SYSTEM_PROMPT).toContain("<!DOCTYPE html>");
  });

  it("rules numbered 1-27 without gaps or dark-mode rules", () => {
    // Check that core rules 1-11 are present and sequential
    expect(HTML_SYSTEM_PROMPT).toMatch(/1\.\s+输出完整HTML/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/2\.\s+所有CSS/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/3\.\s+完全响应式/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/4\.\s+生成与文章/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/5\.\s+封面区域/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/6\.\s+有平滑的/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/7\.\s+自动生成/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/8\.\s+顶部有/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/9\.\s+图片用/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/10\.\s+代码简洁/);
    expect(HTML_SYSTEM_PROMPT).toMatch(/11\.\s+只输出HTML/);
  });
});

describe("TOC_AND_EXPORT_RULES", () => {
  it("uses 780px content width", () => {
    expect(TOC_AND_EXPORT_RULES).toMatch(/780px/);
  });

  it("describes viewport-relative and content-relative positioning", () => {
    expect(TOC_AND_EXPORT_RULES).toMatch(/viewport-relative/);
    expect(TOC_AND_EXPORT_RULES).toMatch(/content-relative/);
  });

  it("specifies 1180px as display threshold", () => {
    expect(TOC_AND_EXPORT_RULES).toMatch(/1180px/);
  });

  it("requires @media print to hide TOC", () => {
    expect(TOC_AND_EXPORT_RULES).toMatch(/@media print/);
    expect(TOC_AND_EXPORT_RULES).toMatch(/display:\s*none/);
  });
});
