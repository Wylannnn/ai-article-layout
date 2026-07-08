/**
 * Editorial template — Nordic minimalism magazine layout.
 * For opinion pieces, long-form essays, and deep stories.
 */
import { TemplateRenderInput, SemanticSection, ArticleDesignToken } from "@/types";
import {
  TemplateContext, buildBlockMap, renderBlock, sectionHeadingHTML,
  wrapDocument, buildFontLink, renderProseBlock,
} from "../template-base";

export function editorialHTML(input: TemplateRenderInput): string {
  const ctx: TemplateContext = { token: input.token, blocks: input.contentBlocks };
  const blockMap = buildBlockMap(input.contentBlocks);
  const { token, semantic } = input;

  const cover = renderCover(semantic, token);
  const toc = token.layout.tocStyle === "sidebar" ? renderTOC(semantic) : "";
  const sections = semantic.sections
    .map((sec, i) => renderSection(sec, i, blockMap, token))
    .join("\n");
  const footer = renderFooter();

  const bodyHTML = `<div class="page-wrapper">
  <article class="page">
    ${cover}
    ${toc}
    <div class="content-body">
      ${sections}
    </div>
    ${footer}
  </article>
</div>`;

  return wrapDocument(token, semantic.title, buildFontLink(token), editorialCSS(token), bodyHTML);
}

function renderCover(semantic: { title: string; subtitle: string; category: string; keywords: string[]; estimatedReadMinutes: number }, token: ArticleDesignToken): string {
  const gradient = token.decoration.coverGradient !== "none"
    ? `<div class="cover-gradient"></div>`
    : "";
  const kw = semantic.keywords.slice(0, 3).map((k) => `<span class="cover-kw">${e(k)}</span>`).join("");
  return `<header class="cover">
    ${gradient}
    <div class="cover-inner">
      <div class="cover-tag">${e(semantic.category)} · ${semantic.estimatedReadMinutes} min read</div>
      <h1>${e(semantic.title)}</h1>
      ${semantic.subtitle ? `<p class="cover-subtitle">${e(semantic.subtitle)}</p>` : ""}
      ${kw ? `<div class="cover-keywords">${kw}</div>` : ""}
    </div>
  </header>`;
}

function renderTOC(semantic: { sections: SemanticSection[] }): string {
  const items = semantic.sections.slice(0, 5).map((s, i) =>
    `<a class="toc-item" href="#s${i + 1}">${String(i + 1).padStart(2, "0")}  ${e(s.heading)}</a>`
  ).join("\n");
  return `<nav class="toc-sidebar">
  <div class="toc-sidebar-inner">
    <div class="toc-label">目录</div>
    ${items}
  </div>
</nav>`;
}

function renderSection(
  sec: SemanticSection,
  index: number,
  blockMap: ReturnType<typeof buildBlockMap>,
  token: ArticleDesignToken,
): string {
  const heading = sectionHeadingHTML(sec, index);
  const blocks = sec.blocks.map((b) => {
    const rendered = renderBlock(b, blockMap);
    if (index === 0 && b.semanticType === "prose" && b.emphasis === "normal" && token.decoration.dropCap) {
      return rendered.replace('class="block-prose', 'class="block-prose drop-cap');
    }
    return rendered;
  }).join("\n");

  const divider = token.layout.dividerStyle !== "none"
    ? renderDivider(token)
    : "";

  return `<section class="section-block" id="s${index + 1}">
  ${heading}
  <div class="section-blocks">${blocks}</div>
  ${divider}
</section>`;
}

function renderDivider(token: ArticleDesignToken): string {
  if (token.layout.dividerStyle === "dot") {
    return `<div class="section-divider"><div class="section-divider-dot"></div></div>`;
  }
  return `<div class="section-divider"><hr class="section-divider-line"></div>`;
}

function renderFooter(): string {
  return `<footer class="article-footer">
  <div class="footer-divider"></div>
  <p class="footer-text">— END —</p>
</footer>`;
}

function editorialCSS(token: ArticleDesignToken): string {
  return `
/* ── Layout ──────────────────── */
.page-wrapper{display:flex;justify-content:center;padding:0 24px 60px}
.page{width:100%;max-width:var(--art-content-width,720px);
  background:var(--art-surface,#fff);
  box-shadow:0 2px 20px rgba(0,0,0,0.06);margin:40px 0 0;position:relative}

/* ── Cover ───────────────────── */
.cover{position:relative;overflow:hidden;
  padding:var(--art-cover-padding-v,60px) 56px 48px}
.cover::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;
  background:var(--art-primary)}
.cover-gradient{position:absolute;top:0;left:0;right:0;bottom:0;
  background:${token.decoration.coverGradient};opacity:0.05;pointer-events:none}
.cover-inner{position:relative;z-index:1}
.cover-tag{font-family:var(--art-heading-family);font-size:var(--art-caption-size,13px);
  text-transform:uppercase;letter-spacing:0.12em;
  color:var(--art-primary);margin-bottom:24px;font-weight:600}
.cover h1{font-family:var(--art-heading-family);font-size:var(--art-h1-size,44px);
  font-weight:700;color:var(--art-title,#0a0a0a);
  line-height:1.15;letter-spacing:-0.025em;margin-bottom:16px}
.cover-subtitle{font-family:var(--art-body-family);font-size:1.15rem;
  color:var(--art-subtle);line-height:1.7;max-width:90%}
.cover-keywords{display:flex;gap:10px;margin-top:28px;flex-wrap:wrap}
.cover-kw{font-family:var(--art-heading-family);font-size:var(--art-caption-size,13px);
  color:var(--art-subtle);padding:4px 12px;
  border:1px solid var(--art-border);border-radius:20px}

/* ── TOC ─────────────────────── */
.toc-sidebar{position:absolute;right:-220px;top:140px;width:180px;
  font-family:var(--art-heading-family)}
@media(max-width:1180px){.toc-sidebar{display:none}}
.toc-sidebar-inner{position:sticky;top:48px}
.toc-label{font-size:11px;text-transform:uppercase;letter-spacing:0.1em;
  color:var(--art-subtle);margin-bottom:14px;font-weight:600}
.toc-item{display:block;font-size:13px;color:var(--art-subtle);
  padding:7px 0;border-bottom:1px solid var(--art-border);
  text-decoration:none;transition:color 0.2s;line-height:1.4}
.toc-item:hover{color:var(--art-primary)}

/* ── Content body ────────────── */
.content-body{padding:0 56px 0}

/* ── Section ─────────────────── */
.section-block{margin-bottom:var(--art-section-gap,52px)}
.section-heading{font-family:var(--art-heading-family);font-size:var(--art-h2-size,26px);
  font-weight:var(--art-heading-weight,600);color:var(--art-heading);
  line-height:1.3;letter-spacing:var(--art-letter-spacing);margin-bottom:1.2em}
.section-number{display:block;font-family:var(--art-mono-family);
  font-size:var(--art-caption-size,12px);color:var(--art-subtle);
  margin-bottom:6px;letter-spacing:0.08em;font-weight:500}
.section-eng{display:block;font-family:var(--art-mono-family);
  font-size:11px;color:var(--art-primary);letter-spacing:0.15em;
  margin-bottom:8px;font-weight:500}

/* ── Prose ───────────────────── */
.block-prose p{margin-bottom:1.1em}
.block-prose p:last-child{margin-bottom:0}
.drop-cap .block-content p:first-child::first-letter{
  float:left;font-family:var(--art-heading-family);
  font-size:4.2em;line-height:0.75;padding-right:12px;padding-top:4px;
  color:var(--art-primary);font-weight:700}

/* ── Callout ─────────────────── */
.block-callout{margin:2.2em 0;padding:28px 32px;
  background:var(--art-accent);border-radius:6px;
  border-left:4px solid var(--art-primary)}
.callout-label{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,13px);font-weight:700;
  text-transform:uppercase;letter-spacing:0.08em;
  color:var(--art-primary);margin-bottom:10px}

/* ── Quote ───────────────────── */
.block-quote{position:relative;margin:2.5em 0;padding-left:24px}
.block-quote::before{content:'';position:absolute;left:0;top:4px;bottom:4px;
  width:3px;background:var(--art-primary);border-radius:2px}
.block-quote .block-content{font-style:italic;font-size:1.1rem;
  color:var(--art-text)}
.quote-attribution{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,13px);color:var(--art-subtle);
  margin-top:10px;font-style:normal}

/* ── Steps ───────────────────── */
.block-steps{margin:2em 0}
.step-item{display:flex;gap:16px;margin-bottom:1.5em}
.step-item:last-child{margin-bottom:0}
.step-num{flex-shrink:0;width:30px;height:30px;border-radius:50%;
  background:var(--art-primary);color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--art-mono-family);font-size:14px;font-weight:700}
.step-heading{font-family:var(--art-heading-family);font-size:1rem;
  font-weight:600;color:var(--art-heading);margin-bottom:6px}
.step-body{flex:1;min-width:0}
.step-body p{line-height:1.8;margin:0}

/* ── Data ────────────────────── */
.block-data{margin:2em 0}
.data-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.2em}
.data-cell{background:var(--art-accent);border-radius:6px;
  padding:22px 18px;text-align:center}
.data-value{font-family:var(--art-heading-family);font-size:30px;
  font-weight:700;color:var(--art-primary);line-height:1.1}
.data-label{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,12px);color:var(--art-subtle);margin-top:6px}

/* ── Comparison ──────────────── */
.block-comparison{margin:2em 0}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1em}
.comp-side{padding:22px 20px;border-radius:6px;border:1px solid var(--art-border)}
.comp-label{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,12px);font-weight:700;
  text-transform:uppercase;letter-spacing:0.06em;color:var(--art-subtle)}

/* ── Transition ──────────────── */
.block-transition{text-align:center;margin:3em 0}
.transition-mark::before{content:'';display:block;
  width:6px;height:6px;border-radius:50%;background:var(--art-primary);
  margin:0 auto 12px}

/* ── Emphasis ────────────────── */
.block-emphasis-high .block-content{font-size:1.05rem;color:var(--art-heading)}
.block-emphasis-subtle .block-content{color:var(--art-subtle);font-size:0.9rem}

/* ── Divider ─────────────────── */
.section-divider{text-align:center;margin:1.5em 0 0}
.section-divider-line{width:40px;height:1px;background:var(--art-border);
  border:none;margin:0 auto}
.section-divider-dot{width:6px;height:6px;border-radius:50%;
  background:var(--art-primary);margin:0 auto}

/* ── Footer ──────────────────── */
.article-footer{padding:40px 56px 48px;text-align:center}
.footer-divider{width:40px;height:1px;background:var(--art-border);
  margin:0 auto 20px}
.footer-text{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,13px);color:var(--art-subtle);
  letter-spacing:0.08em}
`;
}

function e(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
