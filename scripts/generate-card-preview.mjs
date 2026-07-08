/**
 * 生成当前卡片模板的可视化预览页面。
 * 直接调用 card-templates.ts 的导出函数，生成所有卡片类型的 HTML 快照。
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 直接将 card-templates 代码内联，避免 import TypeScript ──
// 主题配色（从 types/index.ts 复制）
const themes = {
  tech:     { id: "tech",     name: "科技",     primary: "#4f46e5", secondary: "#818cf8", bg: "#ffffff", title: "#0f172a", text: "#334155", subtle: "#eef2ff" },
  finance:  { id: "finance",  name: "财经",     primary: "#1e3a5f", secondary: "#2d5a87", bg: "#ffffff", title: "#0f172a", text: "#334155", subtle: "#f1f5f9" },
  travel:   { id: "travel",   name: "旅行",     primary: "#ea580c", secondary: "#f97316", bg: "#ffffff", title: "#1c1917", text: "#44403c", subtle: "#fff7ed" },
  tutorial: { id: "tutorial", name: "教程",     primary: "#047857", secondary: "#10b981", bg: "#ffffff", title: "#0f172a", text: "#334155", subtle: "#f0fdf4" },
  story:    { id: "story",    name: "故事",     primary: "#be185d", secondary: "#ec4899", bg: "#ffffff", title: "#1f2937", text: "#374151", subtle: "#fdf2f8" },
  news:     { id: "news",     name: "新闻",     primary: "#b91c1c", secondary: "#ef4444", bg: "#ffffff", title: "#111827", text: "#374151", subtle: "#fef2f2" },
};

const extraThemes = {
  minimal: { id: "minimal", name: "极简灰", primary: "#374151", secondary: "#6b7280", bg: "#ffffff", title: "#111827", text: "#4b5563", subtle: "#f3f4f6" },
  warm:    { id: "warm",    name: "暖阳",   primary: "#92400e", secondary: "#d97706", bg: "#fffbeb", title: "#1c1917", text: "#44403c", subtle: "#fef3c7" },
};

// ── BASE_CSS ──
const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;
 -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.wrap{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;overflow-y:auto;word-break:break-word;overflow-wrap:break-word}
`;

// ── Template functions ──
function coverCardHTML(p, data) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:linear-gradient(180deg,${p.bg},${p.subtle} 100%);border-radius:20px}
.band{height:160px;background:linear-gradient(135deg,${p.primary},${p.secondary});position:relative;overflow:hidden;flex-shrink:0}
.band::before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.05);top:-100px;right:-80px}
.band::after{content:'';position:absolute;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.08);bottom:-60px;left:-40px}
.tag{position:absolute;bottom:20px;left:36px;color:rgba(255,255,255,0.9);font-size:13px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600}
.body{padding:44px 36px 36px;display:flex;flex-direction:column;flex:1}
h1{font-size:36px;font-weight:800;color:${p.title};line-height:1.3;letter-spacing:-0.02em;margin-bottom:16px;flex-shrink:0}
.sub{font-size:17px;line-height:1.75;color:${p.text};flex:1;overflow-y:auto;padding-right:4px}
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

function articleCardHTML(p, data) {
  const quoteHtml = data.quote
    ? `<div class="qwrap"><div class="qbar"></div><div class="qtext">${data.quote}</div></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;padding:44px 36px;position:relative}
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

function stepsCardHTML(p, data) {
  const stepsHtml = data.steps.map((s, i) => `
${i > 0 ? `<div class="connector"></div>` : ""}
<div class="step">
<div class="snum">${s.num}</div>
<div class="sbody"><h3>${s.heading}</h3><p>${s.desc}</p></div>
</div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;padding:44px 36px;position:relative}
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

function dataCardHTML(p, data) {
  const gridHtml = data.stats.map((s, i) =>
    `<div class="cell"><div class="big">${s.value}</div><div class="lbl">${s.label}</div></div>`
  ).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;position:relative}
.wrap::before{content:'';position:absolute;width:200px;height:200px;border-radius:50%;
 background:${p.subtle};opacity:0.5;bottom:-60px;right:-60px;pointer-events:none}
.accent{height:5px;background:linear-gradient(90deg,${p.primary},${p.secondary});flex-shrink:0}
.inner{padding:36px 36px 32px;flex:1;overflow-y:auto}
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
${gridHtml}
<p>${data.paragraphs}</p>
</div></div></body></html>`;
}

function endingCardHTML(p, data) {
  const displayHandle = data.handle || "your_name";
  const displaySlogan = data.slogan || "分享知识与思考，欢迎关注";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.wrap{background:${p.bg};border-radius:20px;position:relative;display:flex;flex-direction:column}
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

// ── 生成所有卡片 HTML ──

const w = 1080, h = 1440;
const sampleData = {
  categoryLabel: "教程",
  title: "如何用 Notion 搭建个人知识管理系统",
  summary: "一个从零开始的 Notion 搭建指南，帮你把碎片信息转化为体系化知识库。包含数据库设计、模板创建、自动化流程三大核心模块。",
  readTime: "约 12 分钟阅读",
  author: "AI 排版工具",
  keywords: ["Notion", "知识管理", "效率工具", "数据库"],
};

const sampleParas = `
<p>Notion 的强大之处在于它的灵活性和可扩展性。无论是个人知识管理、项目协作还是团队 Wiki，Notion 都能胜任。</p>
<p>但灵活性也带来了学习成本——很多人打开 Notion 后面对空白页面不知道从哪里开始。这篇文章将带你从零搭建一套完整的个人知识管理系统。</p>
`.trim();

const sampleSteps = [
  { num: 1, heading: "确定信息分类体系", desc: "先规划你的知识领域，推荐使用 PARA 方法（Project、Area、Resource、Archive）" },
  { num: 2, heading: "创建数据库模板", desc: "为每个类别创建对应的数据库，设置属性字段和视图布局" },
  { num: 3, heading: "建立关联和汇总", desc: "用 Relation 和 Rollup 把不同数据库串联起来" },
];

const sampleStats = [
  { value: "87%", label: "知识留存率提升" },
  { value: "3×", label: "信息检索速度" },
  { value: "50+", label: "预设模板" },
  { value: "24h", label: "从搭建到上手" },
];

// ── 生成预览 HTML ──

let allHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>卡片模板预览 - 当前输出</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;background:#f0f0f0;padding:40px 20px}
  h1{font-size:28px;font-weight:800;text-align:center;margin-bottom:8px}
  .subtitle{text-align:center;color:#666;font-size:14px;margin-bottom:40px}
  .section{margin-bottom:60px}
  h2{font-size:20px;font-weight:700;margin-bottom:20px;padding-left:12px;border-left:4px solid #333}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(580px,1fr));gap:32px;justify-items:center}
  .card-wrapper{width:540px;overflow:hidden;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:#fff}
  .card-label{padding:8px 12px;font-size:12px;font-weight:600;color:#666;background:#f9f9f9;border-bottom:1px solid #eee}
  .card-frame-wrap{width:540px;height:720px;overflow:hidden;position:relative}
  .card-frame-wrap iframe{width:1080px;height:1440px;border:none;transform:scale(0.5);transform-origin:top left;position:absolute;top:0;left:0}
</style>
</head>
<body>
<h1>🎴 卡片模板预览 · 当前输出</h1>
<p class="subtitle">1080 × 1440 (3:4) · 原生分辨率缩放 50% 显示 · ${Object.keys(themes).length + Object.keys(extraThemes).length} 种主题</p>
`;

for (const [themeId, theme] of Object.entries(themes)) {
  // 统一建立 props
  const p = { width: w, height: h, ...theme };

  allHTML += `<div class="section"><h2>${theme.name} 主题 (${themeId}) · #${theme.primary}</h2><div class="grid">`;

  // Cover
  allHTML += `<div class="card-wrapper"><div class="card-label">📌 封面</div><div class="card-frame-wrap"><iframe srcdoc="${escapeHTML(coverCardHTML(p, sampleData))}"></iframe></div></div>`;

  // Article
  allHTML += `<div class="card-wrapper"><div class="card-label">📝 文章排版</div><div class="card-frame-wrap"><iframe srcdoc="${escapeHTML(articleCardHTML(p, { sectionIndex: 0, totalSections: 3, title: "第一步：确定分类体系", paragraphs: sampleParas, quote: "知识管理的核心不是收集，而是连接。" }))}"></iframe></div></div>`;

  // Steps
  allHTML += `<div class="card-wrapper"><div class="card-label">📋 步骤教程</div><div class="card-frame-wrap"><iframe srcdoc="${escapeHTML(stepsCardHTML(p, { sectionIndex: 0, totalSections: 3, title: "三步搭建知识库", steps: sampleSteps }))}"></iframe></div></div>`;

  // Data
  allHTML += `<div class="card-wrapper"><div class="card-label">📊 数据可视化</div><div class="card-frame-wrap"><iframe srcdoc="${escapeHTML(dataCardHTML(p, { sectionIndex: 2, totalSections: 3, title: "效率数据一览", stats: sampleStats, paragraphs: "以上数据来自 2024 年用户调研。Notion 用户在搭建系统后，平均信息检索效率提升 3 倍。" }))}"></iframe></div></div>`;

  // Ending
  allHTML += `<div class="card-wrapper"><div class="card-label">🔚 结尾引导</div><div class="card-frame-wrap"><iframe srcdoc="${escapeHTML(endingCardHTML(p, { handle: "your_name", slogan: "分享知识与思考，欢迎关注" }))}"></iframe></div></div>`;

  allHTML += `</div></div>`;
}

// Extra themes
for (const [themeId, theme] of Object.entries(extraThemes)) {
  const p = { width: w, height: h, ...theme };
  allHTML += `<div class="section"><h2>${theme.name} (${themeId}) · #${theme.primary}</h2><div class="grid">`;
  allHTML += `<div class="card-wrapper"><div class="card-label">📌 封面</div><div class="card-frame-wrap"><iframe srcdoc="${escapeHTML(coverCardHTML(p, sampleData))}"></iframe></div></div>`;
  allHTML += `<div class="card-wrapper"><div class="card-label">🔚 结尾</div><div class="card-frame-wrap"><iframe srcdoc="${escapeHTML(endingCardHTML(p, { handle: "your_name", slogan: "分享知识与思考，欢迎关注" }))}"></iframe></div></div>`;
  allHTML += `</div></div>`;
}

allHTML += `</body></html>`;

function escapeHTML(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

const outDir = resolve(__dirname, "..", "_prototypes");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "card-preview-current.html"), allHTML, "utf-8");
console.log("✅ 已生成: _prototypes/card-preview-current.html");
console.log(`   http://localhost:3002/card-preview-current.html`);
