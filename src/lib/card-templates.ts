/**
 * Card HTML templates.
 *
 * Each template is a function that takes theme variables and content,
 * returns a complete self-contained HTML document string sized to the
 * given platform dimensions.
 *
 * Template types:
 *  - cover:     Magazine-style cover with colored top band
 *  - article:   Clean article layout with section marker + pull quote
 *  - steps:     Numbered step list (tutorial content)
 *  - data:      Data visualization grid with stats
 *  - ending:    Follow/social card with avatar
 */

export interface CardTemplateProps {
  width: number;
  height: number;
  primary: string;
  secondary: string;
  bg: string;
  title: string;
  text: string;
  subtle: string;
}

// ── shared CSS base ──────────────────────────────────────
const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;
 -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow:hidden}
.wrap{width:100%;height:100%;display:flex;flex-direction:column}
`;

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
.wrap{background:${p.bg};border-radius:20px;overflow:hidden}
.band{height:130px;background:linear-gradient(135deg,${p.primary},${p.secondary});position:relative;overflow:hidden}
.band::after{content:'';position:absolute;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.06);top:-60px;right:-40px}
.tag{position:absolute;bottom:18px;left:36px;color:rgba(255,255,255,0.85);font-size:12px;letter-spacing:0.08em;text-transform:uppercase}
.body{flex:1;padding:38px 36px 32px;display:flex;flex-direction:column}
h1{font-size:30px;font-weight:700;color:${p.title};line-height:1.3;letter-spacing:-0.02em;margin-bottom:14px}
.sub{font-size:14px;line-height:1.7;color:${p.text};flex:1;max-height:80px;overflow:hidden}
.meta{display:flex;gap:14px;font-size:12px;color:${p.primary};opacity:0.6;border-top:1px solid ${p.subtle};padding-top:16px;flex-wrap:wrap}
.meta span{display:flex;align-items:center;gap:4px}
</style></head><body><div class="wrap">
<div class="band"><div class="tag">${data.categoryLabel} · 深度阅读</div></div>
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

// ── Article ──────────────────────────────────────────────
export function articleCardHTML(p: CardTemplateProps, data: {
  sectionIndex: number;
  totalSections: number;
  title: string;
  paragraphs: string;
  quote?: string;
}): string {
  const quoteHtml = data.quote
    ? `<div class="qwrap"><div class="qicon">"</div><div class="qtext">${data.quote}</div></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;overflow:hidden;padding:40px 36px;position:relative}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.marker .num{font-size:12px;font-weight:700;color:${p.primary};letter-spacing:0.05em}
.marker .line{flex:1;height:1px;background:${p.subtle}}
.marker .pg{font-size:11px;color:${p.text};opacity:0.4}
h2{font-size:20px;font-weight:700;color:${p.title};line-height:1.4;margin-bottom:14px}
p{font-size:15px;line-height:1.85;color:${p.text};margin-bottom:12px}
.qwrap{margin:16px 0;padding:16px 18px;background:${p.subtle};border-radius:12px;display:flex;gap:12px;align-items:flex-start}
.qicon{font-size:22px;line-height:1;color:${p.primary};opacity:0.3;flex-shrink:0}
.qtext{font-size:14px;line-height:1.7;color:${p.text};font-style:italic}
</style></head><body><div class="wrap">
<div class="marker">
<span class="num">SECTION ${String(data.sectionIndex+1).padStart(2,"0")}</span>
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
  const stepsHtml = data.steps.map(s => `
<div class="step">
<div class="snum">${s.num}</div>
<div class="sbody"><h3>${s.heading}</h3><p>${s.desc}</p></div>
</div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;overflow:hidden;padding:40px 36px}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.marker .num{font-size:12px;font-weight:700;color:${p.primary};letter-spacing:0.05em}
.marker .line{flex:1;height:1px;background:${p.subtle}}
.marker .pg{font-size:11px;color:${p.text};opacity:0.4}
h2{font-size:20px;font-weight:700;color:${p.title};line-height:1.4;margin-bottom:20px}
.step{display:flex;gap:14px;margin-bottom:16px;align-items:flex-start}
.step:last-child{margin-bottom:0}
.snum{width:26px;height:26px;border-radius:50%;background:${p.primary};color:#fff;
 font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.sbody h3{font-size:15px;font-weight:600;color:${p.title};margin-bottom:3px}
.sbody p{font-size:14px;line-height:1.7;color:${p.text}}
</style></head><body><div class="wrap">
<div class="marker">
<span class="num">STEP ${String(data.sectionIndex+1).padStart(2,"0")}</span>
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
  const gridHtml = data.stats.map(s =>
    `<div class="cell"><div class="big">${s.value}</div><div class="lbl">${s.label}</div></div>`
  ).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;overflow:hidden}
.accent{height:5px;background:linear-gradient(90deg,${p.primary},${p.secondary})}
.inner{padding:32px 36px}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.marker .num{font-size:12px;font-weight:700;color:${p.primary};letter-spacing:0.05em}
.marker .line{flex:1;height:1px;background:${p.subtle}}
.marker .pg{font-size:11px;color:${p.text};opacity:0.4}
h2{font-size:19px;font-weight:700;color:${p.title};line-height:1.4;margin-bottom:16px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.cell{background:${p.subtle};border-radius:10px;padding:16px;text-align:center}
.cell .big{font-size:26px;font-weight:700;color:${p.primary}}
.cell .lbl{font-size:11px;color:${p.text};margin-top:4px;opacity:0.7}
p{font-size:14px;line-height:1.8;color:${p.text}}
</style></head><body><div class="wrap">
<div class="accent"></div>
<div class="inner">
<div class="marker">
<span class="num">DATA ${String(data.sectionIndex+1).padStart(2,"0")}</span>
<span class="line"></span>
<span class="pg">${data.sectionIndex+1} / ${data.totalSections}</span>
</div>
<h2>${data.title}</h2>
<div class="grid">${gridHtml}</div>
<p>${data.paragraphs}</p>
</div></div></body></html>`;
}

// ── Ending ───────────────────────────────────────────────
export function endingCardHTML(p: CardTemplateProps, data: {
  handle: string;
  slogan: string;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;overflow:hidden;position:relative}
.bgdeco{position:absolute;width:100%;height:90px;
 background:linear-gradient(135deg,${p.primary},${p.secondary});top:0;left:0}
.bgdeco::after{content:'';position:absolute;width:140px;height:140px;border-radius:50%;
 background:rgba(255,255,255,0.05);top:-50px;right:-30px}
.content{position:relative;z-index:1;display:flex;flex-direction:column;
 align-items:center;justify-content:center;height:100%;padding:48px 36px;text-align:center}
.avatar{width:44px;height:44px;border-radius:50%;background:${p.primary};
 color:#fff;display:flex;align-items:center;justify-content:center;
 font-weight:700;font-size:17px;margin-bottom:10px}
.handle{font-size:15px;font-weight:600;color:${p.title};margin-bottom:3px}
.slogan{font-size:13px;color:${p.text};line-height:1.6;margin-bottom:18px}
.actions{display:flex;gap:20px}
.actions .b{width:40px;height:40px;border-radius:50%;background:${p.subtle};
 display:flex;align-items:center;justify-content:center;font-size:17px}
</style></head><body><div class="wrap">
<div class="bgdeco"></div>
<div class="content">
<div class="avatar">${data.handle[0]?.toUpperCase() || "?"}</div>
<div class="handle">@${data.handle}</div>
<div class="slogan">${data.slogan}</div>
<div class="actions">
<div class="b">❤️</div><div class="b">⭐</div><div class="b">💬</div><div class="b">🔁</div>
</div>
</div></div></body></html>`;
}
