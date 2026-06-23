/**
 * Card HTML templates.
 *
 * Each template is a function that takes theme variables and content,
 * returns a complete self-contained HTML document string sized to the
 * given platform dimensions.
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
html,body{width:100%;height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;
 -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.wrap{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;overflow-y:auto;word-break:break-word;overflow-wrap:break-word}
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
.wrap{background:linear-gradient(180deg,${p.bg},${p.subtle} 100%);border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.06),0 1px 4px rgba(0,0,0,0.03)}
.band{height:160px;background:linear-gradient(135deg,${p.primary},${p.secondary});position:relative;overflow:hidden;flex-shrink:0}
.band::before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.05);top:-100px;right:-80px}
.band::after{content:'';position:absolute;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.08);bottom:-60px;left:-40px}
.tag{position:absolute;bottom:20px;left:36px;color:rgba(255,255,255,0.9);font-size:13px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600}
.body{padding:44px 36px 36px;display:flex;flex-direction:column;flex:1}
h1{font-size:36px;font-weight:800;color:${p.title};line-height:1.3;letter-spacing:-0.02em;margin-bottom:16px;flex-shrink:0}
.sub{font-size:17px;line-height:1.75;color:${p.text};flex:1;overflow-y:auto;padding-right:4px}
.sub:empty::before{content:'暂无摘要';opacity:0.4}
.meta{display:flex;gap:16px;font-size:13px;color:${p.primary};opacity:0.65;border-top:1px solid ${p.subtle};padding-top:18px;flex-wrap:wrap;flex-shrink:0;margin-top:16px}
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
    ? `<div class="qwrap"><div class="qbar"></div><div class="qtext">${data.quote}</div></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;padding:44px 36px;position:relative;
 box-shadow:0 4px 24px rgba(0,0,0,0.06),0 1px 4px rgba(0,0,0,0.03)}
.wrap::before{content:'';position:absolute;width:200px;height:200px;border-radius:50%;
 background:${p.subtle};opacity:0.5;bottom:-60px;right:-60px;pointer-events:none}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-shrink:0}
.marker .num{font-size:12px;font-weight:700;color:${p.primary};letter-spacing:0.08em}
.marker .line{flex:1;height:1px;background:${p.subtle}}
.marker .pg{font-size:11px;color:${p.text};opacity:0.45}
h2{font-size:24px;font-weight:700;color:${p.title};line-height:1.4;margin-bottom:16px;letter-spacing:-0.01em;flex-shrink:0}
p{font-size:18px;line-height:1.85;color:${p.text};margin-bottom:14px}
.qwrap{margin:18px 0 14px;padding:0 0 0 20px;display:flex;gap:16px;align-items:flex-start}
.qbar{width:4px;min-height:100%;border-radius:2px;background:linear-gradient(180deg,${p.primary},${p.secondary});flex-shrink:0;align-self:stretch}
.qtext{font-size:17px;line-height:1.7;color:${p.text};font-style:italic;opacity:0.85}
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
  const stepsHtml = data.steps.map((s, i) => `
${i > 0 ? `<div class="connector"></div>` : ""}
<div class="step">
<div class="snum">${s.num}</div>
<div class="sbody"><h3>${s.heading}</h3><p>${s.desc}</p></div>
</div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;padding:44px 36px;position:relative;
 box-shadow:0 4px 24px rgba(0,0,0,0.06),0 1px 4px rgba(0,0,0,0.03)}
.wrap::before{content:'';position:absolute;width:200px;height:200px;border-radius:50%;
 background:${p.subtle};opacity:0.5;bottom:-60px;right:-60px;pointer-events:none}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-shrink:0}
.marker .num{font-size:12px;font-weight:700;color:${p.primary};letter-spacing:0.08em}
.marker .line{flex:1;height:1px;background:${p.subtle}}
.marker .pg{font-size:11px;color:${p.text};opacity:0.45}
h2{font-size:24px;font-weight:700;color:${p.title};line-height:1.4;margin-bottom:22px;letter-spacing:-0.01em;flex-shrink:0}
.step{display:flex;gap:16px;align-items:flex-start;position:relative}
.snum{width:30px;height:30px;border-radius:50%;background:${p.primary};color:#fff;
 font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.sbody h3{font-size:17px;font-weight:600;color:${p.title};margin-bottom:4px}
.sbody p{font-size:16px;line-height:1.75;color:${p.text}}
.connector{width:2px;height:14px;background:${p.subtle};margin-left:14px;flex-shrink:0}
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
  const gridHtml = data.stats.map((s) =>
    `<div class="cell"><div class="big">${s.value}</div><div class="lbl">${s.label}</div></div>`
  ).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;position:relative;
 box-shadow:0 4px 24px rgba(0,0,0,0.06),0 1px 4px rgba(0,0,0,0.03)}
.wrap::before{content:'';position:absolute;width:200px;height:200px;border-radius:50%;
 background:${p.subtle};opacity:0.5;bottom:-60px;right:-60px;pointer-events:none}
.accent{height:5px;background:linear-gradient(90deg,${p.primary},${p.secondary});flex-shrink:0}
.inner{padding:36px 36px 32px;flex:1}
.marker{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-shrink:0}
.marker .num{font-size:12px;font-weight:700;color:${p.primary};letter-spacing:0.08em}
.marker .line{flex:1;height:1px;background:${p.subtle}}
.marker .pg{font-size:11px;color:${p.text};opacity:0.45}
h2{font-size:22px;font-weight:700;color:${p.title};line-height:1.4;margin-bottom:18px;letter-spacing:-0.01em;flex-shrink:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.cell{background:linear-gradient(135deg,${p.subtle},${p.bg});border:1px solid ${p.subtle};border-radius:12px;padding:20px 16px;text-align:center}
.cell .big{font-size:34px;font-weight:800;color:${p.primary};letter-spacing:-0.02em;line-height:1.1}
.cell .lbl{font-size:12px;color:${p.text};margin-top:8px;opacity:0.7;line-height:1.4}
p{font-size:16px;line-height:1.85;color:${p.text}}
</style></head><body><div class="wrap">
<div class="accent"></div>
<div class="inner">
<div class="marker">
<span class="num">DATA ${String(data.sectionIndex+1).padStart(2,"0")}</span>
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
.wrap{background:${p.bg};border-radius:20px;position:relative;display:flex;flex-direction:column;
 box-shadow:0 4px 24px rgba(0,0,0,0.06),0 1px 4px rgba(0,0,0,0.03)}
.bgdeco{position:absolute;width:100%;height:100px;flex-shrink:0;
 background:linear-gradient(135deg,${p.primary},${p.secondary});top:0;left:0}
.bgdeco::after{content:'';position:absolute;width:160px;height:160px;border-radius:50%;
 background:rgba(255,255,255,0.06);top:-60px;right:-40px}
.bgdeco::before{content:'';position:absolute;width:100px;height:100px;border-radius:50%;
 background:rgba(255,255,255,0.04);bottom:-30px;left:20%}
.content{position:relative;z-index:1;display:flex;flex-direction:column;
 align-items:center;justify-content:center;flex:1;padding:56px 36px;text-align:center}
.avatar{width:52px;height:52px;border-radius:50%;background:${p.primary};
 color:#fff;display:flex;align-items:center;justify-content:center;
 font-weight:700;font-size:20px;margin-bottom:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
.handle{font-size:18px;font-weight:600;color:${p.title};margin-bottom:4px}
.slogan{font-size:15px;color:${p.text};line-height:1.6;margin-bottom:22px;max-width:80%}
.actions{display:flex;gap:24px}
.actions .b{width:44px;height:44px;border-radius:50%;background:${p.subtle};
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
