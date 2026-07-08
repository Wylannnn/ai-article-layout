/**
 * Card HTML templates.
 *
 * Each template takes theme variables and content, returns a complete
 * self-contained HTML document string sized to the given platform dimensions.
 *
 * Layout variables are injected as CSS custom properties via tokenToCSSVars().
 */

import { CardDesignToken } from "@/types";

export interface CardTemplateProps {
  width: number;
  height: number;
  token: CardDesignToken;
}

/** Convert a CardDesignToken into CSS custom property declarations */
export function tokenToCSSVars(t: CardDesignToken): string {
  return `
--card-bg: ${t.palette.bg};
--card-surface: ${t.palette.surface};
--card-title: ${t.palette.title};
--card-text: ${t.palette.text};
--card-subtle: ${t.palette.subtle};
--card-border: ${t.palette.border};
--card-primary: ${t.palette.primary};
--card-secondary: ${t.palette.secondary};
--card-accent: ${t.palette.accent};
--card-heading-family: ${t.typography.headingFamily};
--card-body-family: ${t.typography.bodyFamily};
--card-heading-weight: ${t.typography.headingWeight};
--card-title-size: ${t.typography.headingSize}px;
--card-body-size: ${t.typography.bodySize}px;
--card-letter-spacing: ${t.typography.letterSpacing};
--card-line-height: ${t.typography.lineHeight};
--card-radius: ${t.layout.borderRadius}px;
--card-padding: ${t.layout.cardPadding}px;
--card-shadow: ${t.layout.shadow};
`.trim();
}

// ── shared CSS base ──────────────────────────────────────
const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;
 -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.wrap{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;overflow-y:auto;word-break:break-word;overflow-wrap:break-word;
 font-family:var(--card-body-family,inherit);font-size:var(--card-body-size,16px);line-height:var(--card-line-height,1.6);
 color:var(--card-text,#334155)}
h2{font-size:var(--card-title-size,24px);font-weight:var(--card-heading-weight,700);color:var(--card-title,#0f172a);
 line-height:1.4;margin-bottom:16px;letter-spacing:var(--card-letter-spacing,-0.01em);flex-shrink:0}
p{font-size:var(--card-body-size,16px);line-height:var(--card-line-height,1.6);color:var(--card-text,#334155);margin-bottom:14px}
`;

/** Pick a 2-color gradient from primary→secondary */
function grad(p: CardTemplateProps): string {
  return `linear-gradient(135deg,var(--card-primary),var(--card-secondary))`;
}

// ── Cover ────────────────────────────────────────────────
export function coverCardHTML(p: CardTemplateProps, data: {
  categoryLabel: string;
  title: string;
  summary: string;
  readTime: string;
  author: string;
  keywords: string[];
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
:root{${tokenToCSSVars(p.token)}}
.wrap{background:var(--card-bg,#fff);
 border-radius:var(--card-radius,20px);
 box-shadow:var(--card-shadow,0 4px 24px rgba(0,0,0,0.06));
 padding:var(--card-padding,32px)}
.band{height:160px;background:${grad(p)};position:relative;overflow:hidden;flex-shrink:0;margin:calc(var(--card-padding,32px)*-1);margin-bottom:0}
.band::before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.05);top:-100px;right:-80px}
.tag{position:absolute;bottom:calc(var(--card-padding,32px) - 12px);left:var(--card-padding,32px);color:rgba(255,255,255,0.9);
 font-size:13px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600}
.body{padding:var(--card-padding,32px) var(--card-padding,32px) calc(var(--card-padding,32px)*0.6);display:flex;flex-direction:column;flex:1}
h1{font-size:${p.token.typography.headingSize + 12}px;font-weight:var(--card-heading-weight,800);
 font-family:var(--card-heading-family,inherit);color:var(--card-title,#0f172a);line-height:1.3;
 letter-spacing:var(--card-letter-spacing,-0.02em);margin-bottom:16px;flex-shrink:0}
.sub{font-size:var(--card-body-size,17px);line-height:var(--card-line-height,1.75);color:var(--card-text,#334155);flex:1;overflow-y:auto}
.sub:empty::before{content:'暂无摘要';opacity:0.4}
.meta{display:flex;gap:16px;font-size:13px;color:var(--card-primary,#4f46e5);opacity:0.65;
 border-top:1px solid var(--card-subtle,#e2e8f0);padding-top:18px;flex-wrap:wrap;flex-shrink:0;margin-top:16px}
.meta span{display:flex;align-items:center;gap:4px}
</style></head><body><div class="wrap">
${coverStyleHTML(p)}
<div class="body">
<h1>${data.title}</h1>
<div class="sub">${data.summary}</div>
<div class="meta">
<span>📖 ${data.readTime}</span>
<span>✍️ ${data.author}</span>
${data.keywords.slice(0,3).map(k => `<span>🏷️ ${k}</span>`).join("")}
</div>
</div></div></body></html>`;
}

function coverStyleHTML(p: CardTemplateProps): string {
  switch (p.token.layout.coverStyle) {
    case "band-above":
      return `<div class="band"><div class="tag">${p.token.layout.topDecoration === "dots" ? "● ● ●" : ""}</div></div>`;
    case "landscape": {
      const g = grad(p);
      return `<div style="height:140px;background:${g};margin:calc(var(--card-padding,32px)*-1);margin-bottom:0;display:flex;align-items:flex-end;padding:20px var(--card-padding,32px);font-size:12px;color:rgba(255,255,255,0.7)"></div>`;
    }
    default:
      // centered — no top band
      return "";
  }
}

// ── Article ──────────────────────────────────────────────
export function articleCardHTML(p: CardTemplateProps, data: {
  sectionIndex: number;
  totalSections: number;
  title: string;
  paragraphs: string;
  quote?: string;
}): string {
  const quoteHtml = data.quote
    ? `<div class="qwrap"><div class="qbar"></div><div class="qtext">${data.quote}</div></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
:root{${tokenToCSSVars(p.token)}}
.wrap{background:var(--card-bg,#fff);border-radius:var(--card-radius,20px);padding:var(--card-padding,32px);
 box-shadow:var(--card-shadow,0 4px 24px rgba(0,0,0,0.06))}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-shrink:0}
.marker .num{font-size:12px;font-weight:700;color:var(--card-primary,#4f46e5);letter-spacing:0.08em}
.marker .line{flex:1;height:1px;background:var(--card-subtle,#e2e8f0)}
.marker .pg{font-size:11px;color:var(--card-text,#334155);opacity:0.45}
.qwrap{margin:18px 0 14px;padding:0 0 0 20px;display:flex;gap:16px;align-items:flex-start}
.qbar{width:4px;min-height:100%;border-radius:2px;background:${grad(p)};flex-shrink:0;align-self:stretch}
.qtext{font-size:17px;line-height:var(--card-line-height,1.7);color:var(--card-text,#334155);font-style:italic;opacity:0.85}
</style></head><body><div class="wrap">
<div class="marker">
<span class="num">${progressLabel(p, data.sectionIndex, data.totalSections)}</span>
<span class="line"></span>
<span class="pg">${data.sectionIndex+1} / ${data.totalSections}</span>
</div>
<h2>${data.title}</h2>
${data.paragraphs}
${quoteHtml}
</div></body></html>`;
}

// ── Steps ────────────────────────────────────────────────
export function stepsCardHTML(p: CardTemplateProps, data: {
  sectionIndex: number;
  totalSections: number;
  title: string;
  steps: { num: number; heading: string; desc: string }[];
}): string {
  const stepsHtml = data.steps.map((s, i) => `
${i > 0 ? `<div class="connector"></div>` : ""}
<div class="step">
<div class="snum">${s.num}</div>
<div class="sbody"><h3>${s.heading}</h3><p>${s.desc}</p></div>
</div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
:root{${tokenToCSSVars(p.token)}}
.wrap{background:var(--card-bg,#fff);border-radius:var(--card-radius,20px);padding:var(--card-padding,32px);
 box-shadow:var(--card-shadow,0 4px 24px rgba(0,0,0,0.06))}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-shrink:0}
.marker .num{font-size:12px;font-weight:700;color:var(--card-primary,#4f46e5);letter-spacing:0.08em}
.marker .line{flex:1;height:1px;background:var(--card-subtle,#e2e8f0)}
.marker .pg{font-size:11px;color:var(--card-text,#334155);opacity:0.45}
.step{display:flex;gap:16px;align-items:flex-start;position:relative}
.snum{width:30px;height:30px;border-radius:50%;background:var(--card-primary,#4f46e5);color:#fff;
 font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.sbody h3{font-size:17px;font-weight:600;color:var(--card-title,#0f172a);margin-bottom:4px}
.sbody p{font-size:var(--card-body-size,16px);line-height:var(--card-line-height,1.75);color:var(--card-text,#334155)}
.connector{width:2px;height:14px;background:var(--card-subtle,#e2e8f0);margin-left:14px;flex-shrink:0}
</style></head><body><div class="wrap">
<div class="marker">
<span class="num">${progressLabel(p, data.sectionIndex, data.totalSections)}</span>
<span class="line"></span>
<span class="pg">${data.sectionIndex+1} / ${data.totalSections}</span>
</div>
<h2>${data.title}</h2>
${stepsHtml}
</div></body></html>`;
}

// ── Data / infographic ───────────────────────────────────
export function dataCardHTML(p: CardTemplateProps, data: {
  sectionIndex: number;
  totalSections: number;
  title: string;
  stats: { value: string; label: string }[];
  paragraphs: string;
}): string {
  const gridHtml = data.stats.map((s) =>
    `<div class="cell"><div class="big">${s.value}</div><div class="lbl">${s.label}</div></div>`
  ).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
:root{${tokenToCSSVars(p.token)}}
.wrap{background:var(--card-bg,#fff);border-radius:var(--card-radius,20px);
 box-shadow:var(--card-shadow,0 4px 24px rgba(0,0,0,0.06))}
.accent{height:5px;background:${grad(p)};flex-shrink:0}
.inner{padding:var(--card-padding,32px);flex:1}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-shrink:0}
.marker .num{font-size:12px;font-weight:700;color:var(--card-primary,#4f46e5);letter-spacing:0.08em}
.marker .line{flex:1;height:1px;background:var(--card-subtle,#e2e8f0)}
.marker .pg{font-size:11px;color:var(--card-text,#334155);opacity:0.45}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.cell{background:var(--card-surface,#f3f4f6);border:1px solid var(--card-subtle,#e2e8f0);border-radius:12px;padding:20px 16px;text-align:center}
.cell .big{font-size:34px;font-weight:800;color:var(--card-primary,#4f46e5);letter-spacing:-0.02em;line-height:1.1}
.cell .lbl{font-size:12px;color:var(--card-text,#334155);margin-top:8px;opacity:0.7;line-height:1.4}
p{font-size:var(--card-body-size,16px);line-height:var(--card-line-height,1.85);color:var(--card-text,#334155)}
</style></head><body><div class="wrap">
<div class="accent"></div>
<div class="inner">
<div class="marker">
<span class="num">${progressLabel(p, data.sectionIndex, data.totalSections)}</span>
<span class="line"></span>
<span class="pg">${data.sectionIndex+1} / ${data.totalSections}</span>
</div>
<h2>${data.title}</h2>
${data.stats.length > 0 ? `<div class="grid">${gridHtml}</div>` : ""}
<p>${data.paragraphs}</p>
</div></div></body></html>`;
}

// ── Ending ───────────────────────────────────────────────
export function endingCardHTML(p: CardTemplateProps, data: {
  handle: string;
  slogan: string;
}): string {
  const displayHandle = data.handle || "your_name";
  const displaySlogan = data.slogan || "分享知识与思考，欢迎关注";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
:root{${tokenToCSSVars(p.token)}}
.wrap{background:var(--card-bg,#fff);border-radius:var(--card-radius,20px);position:relative;display:flex;flex-direction:column;
 box-shadow:var(--card-shadow,0 4px 24px rgba(0,0,0,0.06))}
.bgdeco{position:absolute;width:100%;height:100px;flex-shrink:0;background:${grad(p)};top:0;left:0}
.content{position:relative;z-index:1;display:flex;flex-direction:column;
 align-items:center;justify-content:center;flex:1;padding:56px var(--card-padding,32px);text-align:center}
.avatar{width:52px;height:52px;border-radius:50%;background:var(--card-primary,#4f46e5);
 color:#fff;display:flex;align-items:center;justify-content:center;
 font-weight:700;font-size:20px;margin-bottom:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);
 font-family:var(--card-heading-family,inherit)}
.handle{font-size:18px;font-weight:600;color:var(--card-title,#0f172a);margin-bottom:4px}
.slogan{font-size:15px;color:var(--card-text,#334155);line-height:1.6;margin-bottom:22px;max-width:80%}
.actions{display:flex;gap:24px}
.actions .b{width:44px;height:44px;border-radius:50%;background:var(--card-subtle,#e2e8f0);
 display:flex;align-items:center;justify-content:center;font-size:18px}
</style></head><body><div class="wrap">
<div class="bgdeco"></div>
<div class="content">
<div class="avatar">${displayHandle[0]?.toUpperCase() || "?"}</div>
<div class="handle">@${displayHandle}</div>
<div class="slogan">${displaySlogan}</div>
<div class="actions">
<div class="b">❤️</div><div class="b">⭐</div><div class="b">💬</div><div class="b">🔁</div>
</div>
</div></div></body></html>`;
}

// ── Helpers ──────────────────────────────────────────────
function progressLabel(p: CardTemplateProps, idx: number, total: number): string {
  switch (p.token.layout.progressStyle) {
    case "minimal":
      return `${idx+1}/${total}`;
    case "dot":
      return "●".repeat(Math.min(total, 5)) + (total > 5 ? "+" : "");
    default:
      return `SECTION ${String(idx+1).padStart(2,"0")}`;
  }
}
