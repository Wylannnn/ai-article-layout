import { describe, it, expect } from "vitest";
import { articleTokenToCSSVars, PRESET_TOKENS, FALLBACK_ARTICLE_TOKEN, resolveArticleToken } from "../article-templates/design-tokens";
import { buildBlockMap, renderBlock, wrapDocument, buildFontLink, sectionHeadingHTML, SHARED_CSS } from "../article-templates/template-base";
import { renderArticle, getAvailableTemplates } from "../article-templates";
import { editorialHTML } from "../article-templates/editorial";
import { tutorialMinimalHTML } from "../article-templates/tutorial-minimal";
import { EDITORIAL_TOKEN, TUTORIAL_MINIMAL_TOKEN } from "../article-templates/design-tokens";
import type { TemplateRenderInput, SemanticSection, SemanticBlock } from "@/types";
import type { ContentBlock } from "../content-blocks";

// ── Helpers ──────────────────────────────────────────────

function makeBlock(id: string, rawText: string, sectionIndex = 0): ContentBlock {
  return { id, sectionIndex, rawText };
}

function makeInput(overrides: Partial<TemplateRenderInput> = {}): TemplateRenderInput {
  return {
    token: EDITORIAL_TOKEN,
    semantic: {
      articleType: "opinion",
      title: "测试文章",
      subtitle: "副标题",
      category: "tech",
      keywords: ["测试", "排版"],
      estimatedReadMinutes: 3,
      sections: [],
    },
    contentBlocks: [],
    metadata: {},
    ...overrides,
  };
}

// ── design-tokens ────────────────────────────────────────

describe("articleTokenToCSSVars", () => {
  it("produces --art-* CSS custom properties", () => {
    const vars = articleTokenToCSSVars(EDITORIAL_TOKEN);
    expect(vars).toContain("--art-bg: #f5f2ed;");
    expect(vars).toContain("--art-primary: #4a6741;");
    expect(vars).toContain("--art-heading-family: 'Inter'");
    expect(vars).toContain("--art-body-family: 'Source Serif 4'");
    expect(vars).toContain("--art-content-width: 720px;");
  });

  it("produces tutorial-minimal token vars", () => {
    const vars = articleTokenToCSSVars(TUTORIAL_MINIMAL_TOKEN);
    expect(vars).toContain("--art-primary: #2383e2;");
    expect(vars).toContain("--art-code-bg: #1e1e1e;");
    expect(vars).toContain("--art-body-size: 16px;");
  });
});

describe("PRESET_TOKENS", () => {
  it("has editorial and tutorial-minimal entries", () => {
    expect(PRESET_TOKENS.editorial).toBeDefined();
    expect(PRESET_TOKENS["tutorial-minimal"]).toBeDefined();
  });

  it("editorial token has dropCap enabled", () => {
    expect(PRESET_TOKENS.editorial.decoration.dropCap).toBe(true);
  });

  it("tutorial-minimal token has dropCap disabled", () => {
    expect(PRESET_TOKENS["tutorial-minimal"].decoration.dropCap).toBe(false);
  });

  it("editorial has sidebar toc, tutorial-minimal has inline toc", () => {
    expect(PRESET_TOKENS.editorial.layout.tocStyle).toBe("sidebar");
    expect(PRESET_TOKENS["tutorial-minimal"].layout.tocStyle).toBe("inline");
  });
});

describe("resolveArticleToken", () => {
  it("returns the correct token for known templates", () => {
    expect(resolveArticleToken("editorial").templateId).toBe("editorial");
    expect(resolveArticleToken("tutorial-minimal").templateId).toBe("tutorial-minimal");
  });

  it("falls back to EDITORIAL_TOKEN for unknown template", () => {
    const resolved = resolveArticleToken("nonexistent" as "editorial");
    expect(resolved).toBe(FALLBACK_ARTICLE_TOKEN);
  });
});

// ── template-base ────────────────────────────────────────

describe("buildBlockMap", () => {
  it("builds a Map from ContentBlock array", () => {
    const blocks = [makeBlock("b1", "hello"), makeBlock("b2", "world")];
    const map = buildBlockMap(blocks);
    expect(map.size).toBe(2);
    expect(map.get("b1")!.rawText).toBe("hello");
  });
});

describe("renderBlock", () => {
  it("renders prose as default for unknown types", () => {
    const block: SemanticBlock = { id: "b1", sectionIndex: 0, semanticType: "prose", emphasis: "normal" };
    const map = buildBlockMap([makeBlock("b1", "一段文字")]);
    const html = renderBlock(block, map);
    expect(html).toContain("block-prose");
    expect(html).toContain("一段文字");
  });

  it("renders callout with label", () => {
    const block: SemanticBlock = { id: "b1", sectionIndex: 0, semanticType: "callout", emphasis: "normal", calloutLabel: "提示" };
    const map = buildBlockMap([makeBlock("b1", "注意这里")]);
    const html = renderBlock(block, map);
    expect(html).toContain("block-callout");
    expect(html).toContain("callout-label");
    expect(html).toContain("提示");
    expect(html).toContain("注意这里");
  });

  it("shows fallback for missing block in map", () => {
    const block: SemanticBlock = { id: "missing", sectionIndex: 0, semanticType: "prose", emphasis: "normal" };
    const html = renderBlock(block, new Map());
    expect(html).toContain("—");
  });

  it("renders quote with attribution", () => {
    const block: SemanticBlock = { id: "b1", sectionIndex: 0, semanticType: "quote", emphasis: "normal", quoteAttribution: "鲁迅" };
    const map = buildBlockMap([makeBlock("b1", "世上本没有路")]);
    const html = renderBlock(block, map);
    expect(html).toContain("block-quote");
    expect(html).toContain("鲁迅");
  });
});

describe("sectionHeadingHTML", () => {
  it("renders numbered heading with english label", () => {
    const sec: SemanticSection = { heading: "引言", headingLevel: 2, blocks: [] };
    const html = sectionHeadingHTML(sec, 0);
    expect(html).toContain("01");
    expect(html).toContain("INTRODUCTION");
    expect(html).toContain("引言");
    expect(html).toContain('id="s1"');
  });

  it("falls back to CHAPTER for unknown headings", () => {
    const sec: SemanticSection = { heading: "随便写写", headingLevel: 2, blocks: [] };
    const html = sectionHeadingHTML(sec, 2);
    expect(html).toContain("CHAPTER");
    expect(html).toContain("03");
  });
});

describe("wrapDocument", () => {
  it("outputs complete HTML document", () => {
    const html = wrapDocument(EDITORIAL_TOKEN, "My Title", "<link>", "body{color:red}", "<p>hi</p>");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>My Title</title>");
    expect(html).toContain("<link>");
    expect(html).toContain("body{color:red}");
    expect(html).toContain("<p>hi</p>");
    expect(html).toContain("</html>");
  });
});

describe("SHARED_CSS", () => {
  it("includes CSS custom property references", () => {
    expect(SHARED_CSS).toContain("--art-bg");
    expect(SHARED_CSS).toContain("--art-body-family");
    expect(SHARED_CSS).toContain("--art-text");
  });
});

describe("buildFontLink", () => {
  it("includes Inter and JetBrains Mono", () => {
    const link = buildFontLink(EDITORIAL_TOKEN);
    expect(link).toContain("Inter");
    expect(link).toContain("JetBrains+Mono");
    expect(link).toContain("fonts.googleapis.com");
  });

  it("includes Source Serif for serif body tokens", () => {
    const link = buildFontLink(EDITORIAL_TOKEN);
    expect(link).toContain("Source+Serif+4");
  });

  it("skips Source Serif for sans-serif body tokens", () => {
    const link = buildFontLink(TUTORIAL_MINIMAL_TOKEN);
    expect(link).not.toContain("Source+Serif");
  });
});

// ── editorial template ───────────────────────────────────

describe("editorialHTML", () => {
  it("returns valid HTML document", () => {
    const input = makeInput();
    const html = editorialHTML(input);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>测试文章</title>");
    expect(html).toContain("</html>");
  });

  it("renders cover with title and category", () => {
    const input = makeInput();
    const html = editorialHTML(input);
    expect(html).toContain("class=\"cover\"");
    expect(html).toContain("测试文章");
    expect(html).toContain("3 min read");
  });

  it("renders TOC when tocStyle is sidebar", () => {
    const input = makeInput({
      semantic: {
        ...makeInput().semantic,
        sections: [
          { heading: "引言", headingLevel: 2, blocks: [] },
          { heading: "分析", headingLevel: 2, blocks: [] },
        ],
      },
    });
    const html = editorialHTML(input);
    expect(html).toContain("toc-sidebar");
    expect(html).toContain("引言");
    expect(html).toContain("分析");
  });

  it("applies drop-cap on first prose block", () => {
    const input = makeInput({
      semantic: {
        ...makeInput().semantic,
        sections: [{
          heading: "引言", headingLevel: 2,
          blocks: [{ id: "b1", sectionIndex: 0, semanticType: "prose", emphasis: "normal" }],
        }],
      },
      contentBlocks: [makeBlock("b1", "这是一段测试文字。")],
    });
    const html = editorialHTML(input);
    expect(html).toContain("drop-cap");
  });

  it("renders editorial footer", () => {
    const input = makeInput();
    const html = editorialHTML(input);
    expect(html).toContain("article-footer");
    expect(html).toContain("END");
  });

  it("sanitizes HTML in title", () => {
    const input = makeInput();
    input.semantic.title = "<script>alert('xss')</script>";
    const html = editorialHTML(input);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

// ── tutorial-minimal template ────────────────────────────

describe("tutorialMinimalHTML", () => {
  it("returns valid HTML document", () => {
    const input = makeInput({ token: TUTORIAL_MINIMAL_TOKEN });
    const html = tutorialMinimalHTML(input);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("renders centered cover without gradient", () => {
    const input = makeInput({ token: TUTORIAL_MINIMAL_TOKEN });
    const html = tutorialMinimalHTML(input);
    expect(html).toContain("class=\"cover\"");
    expect(html).not.toContain("cover-gradient");
  });

  it("renders inline TOC", () => {
    const input = makeInput({
      token: TUTORIAL_MINIMAL_TOKEN,
      semantic: {
        ...makeInput().semantic,
        sections: [
          { heading: "教程概述", headingLevel: 2, blocks: [] },
          { heading: "环境准备", headingLevel: 2, blocks: [] },
        ],
      },
    });
    const html = tutorialMinimalHTML(input);
    expect(html).toContain("inline-toc");
    expect(html).toContain("教程概述");
  });

  it("includes code block styling", () => {
    const input = makeInput({ token: TUTORIAL_MINIMAL_TOKEN });
    const html = tutorialMinimalHTML(input);
    expect(html).toContain("--art-code-bg");
    expect(html).toContain("--art-code-text");
  });

  it("does not have drop-cap", () => {
    const input = makeInput({
      token: TUTORIAL_MINIMAL_TOKEN,
      semantic: {
        ...makeInput().semantic,
        sections: [{
          heading: "概述", headingLevel: 2,
          blocks: [{ id: "b1", sectionIndex: 0, semanticType: "prose", emphasis: "normal" }],
        }],
      },
      contentBlocks: [makeBlock("b1", "测试文字")],
    });
    const html = tutorialMinimalHTML(input);
    // The token has dropCap:false, and the template never adds it
    expect(html).not.toContain("drop-cap");
  });
});

// ── registry ─────────────────────────────────────────────

describe("renderArticle / getAvailableTemplates", () => {
  it("dispatches to editorial template", () => {
    const input = makeInput();
    const html = renderArticle("editorial", input);
    expect(html).toContain("cover-gradient");
  });

  it("dispatches to tutorial-minimal template", () => {
    const input = makeInput({ token: TUTORIAL_MINIMAL_TOKEN });
    const html = renderArticle("tutorial-minimal", input);
    expect(html).toContain("inline-toc");
  });

  it("throws for unknown template", () => {
    expect(() => renderArticle("unknown" as "editorial", makeInput())).toThrow("Unknown template");
  });

  it("getAvailableTemplates returns both templates", () => {
    const ids = getAvailableTemplates();
    expect(ids).toContain("editorial");
    expect(ids).toContain("tutorial-minimal");
  });
});
