/**
 * Tutorial-minimal template — clean documentation style.
 * For tutorials, guides, and knowledge-base articles.
 */
import { TemplateRenderInput, SemanticSection } from "@/types";
import {
  TemplateContext, buildBlockMap, renderBlock, sectionHeadingHTML,
  wrapDocument, buildFontLink,
} from "../template-base";

export function tutorialMinimalHTML(input: TemplateRenderInput): string {
  const blockMap = buildBlockMap(input.contentBlocks);
  const { token, semantic } = input;

  const cover = renderCover(semantic, token);
  const toc = token.layout.tocStyle !== "none" ? renderInlineTOC(semantic) : "";
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

  return wrapDocument(token, semantic.title, buildFontLink(token), tutorialCSS(token), bodyHTML);
}

function renderCover(semantic: { title: string; subtitle: string; category: string; keywords: string[]; estimatedReadMinutes: number }, _token: unknown): string {
  return `<header class="cover">
  <div class="cover-inner">
    <div class="cover-meta">
      <span class="cover-cat">${e(semantic.category)}</span>
      <span class="cover-dot">·</span>
      <span>${semantic.estimatedReadMinutes} min read</span>
    </div>
    <h1>${e(semantic.title)}</h1>
    ${semantic.subtitle ? `<p class="cover-subtitle">${e(semantic.subtitle)}</p>` : ""}
  </div>
</header>`;
}

function renderInlineTOC(semantic: { sections: SemanticSection[] }): string {
  const items = semantic.sections.slice(0, 8).map((s, i) =>
    `<a class="itoc-item" href="#s${i + 1}">${e(s.heading)}</a>`
  ).join("");
  return `<nav class="inline-toc">
  <span class="itoc-label">目录</span>
  <div class="itoc-links">${items}</div>
</nav>`;
}

function renderSection(
  sec: SemanticSection,
  index: number,
  blockMap: ReturnType<typeof buildBlockMap>,
  _token: unknown,
): string {
  const heading = sectionHeadingHTML(sec, index);
  const blocks = sec.blocks.map((b) => renderBlock(b, blockMap)).join("\n");

  return `<section class="section-block" id="s${index + 1}">
  ${heading}
  <div class="section-blocks">${blocks}</div>
</section>`;
}

function renderFooter(): string {
  return `<footer class="article-footer">
  <div class="footer-divider"></div>
  <p class="footer-text">— END —</p>
</footer>`;
}

function tutorialCSS(_token: unknown): string {
  return `
/* ── Layout ──────────────────── */
.page-wrapper{display:flex;justify-content:center;padding:0 24px 60px}
.page{width:100%;max-width:var(--art-content-width,780px);
  background:var(--art-surface,#fff);margin:32px 0 0}

/* ── Cover ───────────────────── */
.cover{text-align:center;padding:var(--art-cover-padding-v,48px) 48px 40px}
.cover-inner{max-width:640px;margin:0 auto}
.cover-meta{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,12px);
  color:var(--art-subtle);margin-bottom:20px;
  display:flex;align-items:center;justify-content:center;gap:8px}
.cover-dot{color:var(--art-border)}
.cover-cat{color:var(--art-primary);font-weight:600;
  text-transform:uppercase;letter-spacing:0.08em}
.cover h1{font-family:var(--art-heading-family);font-size:var(--art-h1-size,36px);
  font-weight:700;color:var(--art-title,#111);
  line-height:1.2;letter-spacing:-0.02em;margin-bottom:12px}
.cover-subtitle{font-family:var(--art-body-family);font-size:1.05rem;
  color:var(--art-subtle);line-height:1.65}

/* ── Inline TOC ──────────────── */
.inline-toc{display:flex;align-items:flex-start;gap:14px;
  padding:18px 48px;border-top:1px solid var(--art-border);
  border-bottom:1px solid var(--art-border);
  font-family:var(--art-heading-family);flex-wrap:wrap}
.itoc-label{font-size:11px;text-transform:uppercase;letter-spacing:0.1em;
  color:var(--art-subtle);font-weight:600;white-space:nowrap;padding-top:3px}
.itoc-links{display:flex;flex-wrap:wrap;gap:6px}
.itoc-item{font-size:12px;color:var(--art-subtle);text-decoration:none;
  padding:3px 10px;border-radius:4px;background:var(--art-accent);
  transition:color 0.15s;white-space:nowrap}
.itoc-item:hover{color:var(--art-primary)}

/* ── Content body ────────────── */
.content-body{padding:0 48px 0}

/* ── Section ─────────────────── */
.section-block{margin-bottom:var(--art-section-gap,40px)}
.section-heading{font-family:var(--art-heading-family);font-size:var(--art-h2-size,22px);
  font-weight:var(--art-heading-weight,600);color:var(--art-heading);
  line-height:1.3;letter-spacing:var(--art-letter-spacing);margin-bottom:1em}
.section-number{display:block;font-family:var(--art-mono-family);
  font-size:var(--art-caption-size,12px);color:var(--art-subtle);
  margin-bottom:4px;letter-spacing:0.06em;font-weight:500}
.section-eng{display:block;font-family:var(--art-mono-family);
  font-size:11px;color:var(--art-primary);letter-spacing:0.12em;
  margin-bottom:6px;font-weight:500}

/* ── Prose ───────────────────── */
.block-prose p{margin-bottom:0.85em}
.block-prose p:last-child{margin-bottom:0}

/* ── Callout ─────────────────── */
.block-callout{margin:1.6em 0;padding:18px 22px;
  background:var(--art-accent);border-radius:6px;
  border-left:3px solid var(--art-primary)}
.callout-label{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,12px);font-weight:700;
  text-transform:uppercase;letter-spacing:0.06em;
  color:var(--art-primary);margin-bottom:6px}
.block-callout .block-content{font-size:0.95rem}

/* ── Quote ───────────────────── */
.block-quote{margin:1.8em 0;padding:16px 20px;
  background:var(--art-accent);border-radius:6px}
.block-quote .block-content{font-style:italic;font-size:0.95rem;
  color:var(--art-text)}
.quote-attribution{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,12px);color:var(--art-subtle);
  margin-top:8px;font-style:normal}

/* ── Steps ───────────────────── */
.block-steps{margin:1.6em 0}
.step-item{display:flex;gap:14px;margin-bottom:1.2em}
.step-item:last-child{margin-bottom:0}
.step-num{flex-shrink:0;width:28px;height:28px;border-radius:50%;
  background:var(--art-primary);color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--art-mono-family);font-size:13px;font-weight:700}
.step-heading{font-family:var(--art-heading-family);font-size:0.95rem;
  font-weight:600;color:var(--art-heading);margin-bottom:4px}
.step-body{flex:1;min-width:0}
.step-body p{line-height:1.7;margin:0}

/* ── Data ────────────────────── */
.block-data{margin:1.6em 0}
.data-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1em}
.data-cell{background:var(--art-accent);border-radius:6px;
  padding:18px 16px;text-align:center}
.data-value{font-family:var(--art-heading-family);font-size:28px;
  font-weight:700;color:var(--art-primary);line-height:1.1}
.data-label{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,11px);color:var(--art-subtle);margin-top:4px}

/* ── Comparison ──────────────── */
.block-comparison{margin:1.6em 0}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:0.8em}
.comp-side{padding:18px 16px;border-radius:6px;
  border:1px solid var(--art-border);background:var(--art-accent)}
.comp-label{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,11px);font-weight:700;
  text-transform:uppercase;letter-spacing:0.05em;color:var(--art-subtle)}

/* ── Transition ──────────────── */
.block-transition{text-align:center;margin:2.5em 0}
.transition-mark::before{content:'···';display:block;
  font-size:18px;color:var(--art-border);
  letter-spacing:4px;margin-bottom:10px}

/* ── Emphasis ────────────────── */
.block-emphasis-high .block-content{font-weight:500;color:var(--art-heading)}
.block-emphasis-subtle .block-content{color:var(--art-subtle);font-size:0.9rem}

/* ── Footer ──────────────────── */
.article-footer{padding:32px 48px 40px;text-align:center}
.footer-divider{width:32px;height:1px;background:var(--art-border);
  margin:0 auto 16px}
.footer-text{font-family:var(--art-heading-family);
  font-size:var(--art-caption-size,12px);color:var(--art-subtle)}

/* ── Code blocks (inline in prose) ── */
.block-prose code{font-family:var(--art-mono-family);
  background:var(--art-code-bg,#1e1e1e);color:var(--art-code-text,#e0e0e0);
  padding:1px 6px;border-radius:3px;font-size:0.88em}
.block-prose pre{background:var(--art-code-bg,#1e1e1e);
  color:var(--art-code-text,#e0e0e0);
  padding:18px 22px;border-radius:6px;overflow-x:auto;
  margin:1.2em 0;font-size:0.88rem;line-height:1.6}
.block-prose pre code{background:none;padding:0;font-size:inherit}
`;
}

function e(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
