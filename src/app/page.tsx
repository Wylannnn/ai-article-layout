"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Wand2, Copy, RefreshCw, Image, ChevronDown, ChevronRight,
  Loader2, CheckCircle2, Circle, Moon, Sun, FileCode, Sparkles, Settings, LayoutGrid,
} from "lucide-react";
import { ArticleAnalysis, ArticleCategory, LayoutStyle, ProviderConfig, PROVIDER_META } from "@/types";
import { loadConfig } from "@/lib/storage";
import { callAI } from "@/lib/ai-client";
import { TEMPLATE_GUIDES, HTML_SYSTEM_PROMPT } from "@/lib/templates";
import { cleanHTMLOutput, extractJSON } from "@/lib/html-utils";
import ProviderSettings from "@/components/ProviderSettings";
import CardDeckPanel from "@/components/CardDeckPanel";
import clsx from "clsx";

// ── 默认自定义设计师 Prompt ──────────────────────────────────
const DEFAULT_CUSTOM_PROMPT = `你是一位顶级的UI/前端设计师，拥有10年杂志排版和数字媒体设计经验。

【设计风格】
请根据文章内容自由发挥，创造一个独一无二的视觉风格。可以参考但不限于：
- 包豪斯风格：几何构成、原色系、强烈的视觉秩序感
- 赛博朋克：霓虹色、故障艺术、深色背景、像素感
- 日系简约：大量留白、细线条、米白底色、无衬线字体
- 瑞士国际风格：网格系统、无衬线、黑白红经典配色
- 复古印刷风：做旧纹理感、衬线字体、棕褐色调

【设计原则】
- 每个页面都有强烈的视觉个性，拒绝模板感
- 配色方案要有情绪感染力，与文章主题高度契合
- 字体层级清晰：标题 / 副标题 / 正文 / 引用各有特色
- 留白是设计语言，不要填满每一寸空间
- SVG 插画要有手工感和创意，与文章主题强相关

【技术要求】
- 完整单文件 HTML，所有 CSS 内嵌在 <style> 标签
- 封面区域要有视觉个性，但必须紧凑克制：总高度（含内边距）控制在 400-500px 之间，不超过视口高度的60%，不要做成全屏banner
- 封面顶部小图标/徽标尺寸不超过80x80px，作为点缀而非主体；标题字号28-40px；上下padding控制在40-60px
- 封面和正文必须共用同一个最大宽度容器（如 max-width: 780px），不要让封面单独撑满整行而比正文更宽
- 正文章节配图与封面小图标完全不同，是独立的大尺寸视觉元素：宽度撑满容器（width:100%），高度240-360px，绝不能做成孤立的小方块悬浮在空白中
- 章节插画必须用渐变色或多层有机形状铺满整个插画区域背景，再叠加1-2个与内容强相关的线条图标，避免"矩形+虚线+小圆点"式的敷衍占位图风格，要体现完整画面感而非零散零件拼接
- 插画配色呼应章节情绪（鼓励性内容用暖色渐变，理性分析用冷色/中性渐变），可适当用模糊光晕（filter: blur()）增加氛围层次
- 至少包含 2 个主题相关 SVG 插画，不要用简单几何形状
- 顶部阅读进度条
- scroll-reveal 入场动画（IntersectionObserver 实现），初始opacity设为0.01而非0，并加JS保底机制：setTimeout 1.5秒后强制重置所有动画元素为可见状态，防止导出长图时出现空白
- 目录跳转禁止使用 <a href="#xxx">，必须用 onclick 配合 scrollIntoView({behavior:'smooth'}) 实现，避免在iframe环境中触发页面级导航
- 目录布局：不要把目录做成正文中间的独立大区块卡片（这在导出长图时会变成无用的空白占位）；要么做成桌面端固定定位的侧边浮动栏（移动端用媒体查询隐藏），要么干脆不要目录（适合强调沉浸阅读的风格），并加上 @media print { .toc相关类名 { display:none } } 确保打印/截图时不出现
- 禁止出现 target="_top"、target="_parent"、window.top、window.parent、location.href=、location.reload() 等代码
- 响应式，移动端可正常阅读
- 不引用任何外部资源`;

const STYLES: LayoutStyle[] = [
  { id: "auto",     label: "自动",   icon: "✦", description: "AI 自动判断最适合的风格" },
  { id: "tech",     label: "科技",   icon: "⚡", description: "极简科技风，深色背景" },
  { id: "finance",  label: "财经",   icon: "📈", description: "商业杂志风，专业感" },
  { id: "travel",   label: "旅行",   icon: "🌏", description: "旅行杂志风，温暖色调" },
  { id: "tutorial", label: "教程",   icon: "📖", description: "Notion 风，步骤清晰" },
  { id: "story",    label: "故事",   icon: "✍️", description: "Medium 风，专注阅读" },
  { id: "news",     label: "新闻",   icon: "📰", description: "报纸风，信息密集" },
  { id: "custom",   label: "自定义", icon: "🎨", description: "自己写设计师 Prompt" },
];

type StepState = "idle" | "active" | "done" | "error";
interface Step { label: string; state: StepState }
const INITIAL_STEPS: Step[] = [
  { label: "分析文章内容", state: "idle" },
  { label: "判断文章类型", state: "idle" },
  { label: "生成配图方案", state: "idle" },
  { label: "生成精美排版", state: "idle" },
];

function StepIcon({ state }: { state: StepState }) {
  if (state === "done")   return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (state === "active") return <Loader2      className="w-4 h-4 animate-spin text-blue-500" />;
  if (state === "error")  return <Circle       className="w-4 h-4 text-red-400" />;
  return <Circle className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />;
}

const ANALYSIS_SYSTEM = `You are a JSON API. Output ONLY a single JSON object. Do NOT write any text, greeting, or explanation before or after. Start with { immediately.

{
  "title": "article title (keep original if exists)",
  "summary": "one sentence summary under 30 chars",
  "category": "tech|finance|travel|tutorial|story|news",
  "keywords": ["kw1","kw2","kw3"],
  "sections": [{"title":"section title","content":"brief summary"}],
  "imagePrompts": ["cover illustration prompt in English","illustration 1 prompt","illustration 2 prompt"]
}

Categories: tech=programming/AI/product, finance=investing/business, travel=travel guide, tutorial=how-to, story=personal/emotional, news=reporting`;

export default function Home() {
  const [text, setText]                 = useState("");
  const [selectedStyle, setStyle]       = useState<ArticleCategory | "auto" | "custom">("auto");
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_CUSTOM_PROMPT);
  const [styleDirty, setStyleDirty]     = useState(false); // 风格/Prompt改动后是否需要重新生成提示
  const [analysis, setAnalysis]         = useState<ArticleAnalysis | null>(null);
  const [generatedHTML, setHTML]        = useState("");
  const [steps, setSteps]               = useState<Step[]>(INITIAL_STEPS);
  const [isLoading, setLoading]         = useState(false);
  const [error, setError]               = useState("");
  const [toast, setToast]               = useState("");
  const [dark, setDark]                 = useState(false);
  const [progress, setProgress]         = useState(0);
  const [analysisOpen, setAOpen]        = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCardDeck, setShowCardDeck] = useState(false);
  const [providerConfig, setConfig]     = useState<ProviderConfig | null>(null);
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const htmlAccRef = useRef("");

  useEffect(() => {
    const saved = loadConfig();
    setConfig(saved);
    if (!saved) setShowSettings(true);
  }, []);

  useEffect(() => {
    function isExtensionError(err: unknown): boolean {
      if (!err || typeof err !== "object") return false;
      const e = err as { message?: string; stack?: string };
      if (e.stack?.includes("chrome-extension://")) return true;
      if (e.message?.includes("MetaMask")) return true;
      return false;
    }
    function onError(event: ErrorEvent) {
      if (isExtensionError(event.error)) event.stopImmediatePropagation();
    }
    function onRejection(event: PromiseRejectionEvent) {
      if (isExtensionError(event.reason)) event.preventDefault();
    }
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const setStep = (idx: number, state: StepState) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, state } : s)));

  const resetSteps = () => setSteps(INITIAL_STEPS.map((s) => ({ ...s })));

  const startLayout = async () => {
    if (!providerConfig?.apiKey) { setShowSettings(true); return; }
    if (!text.trim() || text.trim().length < 50) {
      setError("请输入至少 50 个字的文章内容"); return;
    }
    if (selectedStyle === "custom" && customPrompt.trim().length < 20) {
      setError("自定义 Prompt 太短，请描述你想要的风格"); return;
    }
    setError("");
    setLoading(true);
    setHTML("");
    setProgress(0);
    setStyleDirty(false);
    htmlAccRef.current = "";
    resetSteps();

    try {
      // ── Step 1-3: Analyze ──────────────────────────────────
      setStep(0, "active");
      const raw = await callAI(
        providerConfig,
        [{ role: "user", content: text.slice(0, 4000) }],
        { system: ANALYSIS_SYSTEM, maxTokens: 1500, jsonMode: true, prefill: "{" }
      );
      // prefill "{" makes the model continue from {, so raw may not include the leading {
      const full = raw.startsWith("{") ? raw : "{" + raw;
      const jsonStr = extractJSON(full);
      if (!jsonStr) {
        throw new Error("AI 返回中未找到 JSON，原始响应: " + raw.slice(0, 200));
      }
      const a: ArticleAnalysis = JSON.parse(jsonStr);
      setAnalysis(a);
      setStep(0, "done");
      setStep(1, "done");
      setStep(2, "done");

      // ── Step 4: Generate HTML (streaming) ─────────────────
      setStep(3, "active");

      // 决定使用哪个 guide
      let guide: string;
      if (selectedStyle === "custom") {
        guide = customPrompt;
      } else {
        const category: ArticleCategory =
          selectedStyle === "auto" ? a.category : (selectedStyle as ArticleCategory);
        guide = TEMPLATE_GUIDES[category];
      }

      const userPrompt = `请根据以下信息生成完整HTML排版页面。

设计风格要求：
${guide}

文章信息：
标题：${a.title}
关键词：${a.keywords.join("、")}
摘要：${a.summary}

章节结构：
${a.sections.map((s, i) => `${i + 1}. ${s.title}\n   ${s.content}`).join("\n\n")}

配图方向（请生成主题相关SVG插画）：
- 封面：${a.imagePrompts[0] ?? ""}
- 插图1：${a.imagePrompts[1] ?? ""}
- 插图2：${a.imagePrompts[2] ?? ""}

原文（请保留完整内容排版）：
${text.slice(0, 6000)}`;

      let received = 0;
      await callAI(
        providerConfig,
        [{ role: "user", content: userPrompt }],
        {
          system: HTML_SYSTEM_PROMPT,
          maxTokens: 16000,
          stream: true,
          onChunk: (chunk) => {
            htmlAccRef.current += chunk;
            received += chunk.length;
            setProgress(Math.min(95, Math.round((received / 6000) * 100)));
            // 注意：流式过程中不再调用 setHTML，避免iframe反复重载导致闪屏
          },
        }
      );
      setHTML(cleanHTMLOutput(htmlAccRef.current));
      setProgress(100);
      setStep(3, "done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setError(msg);
      setSteps((prev) => prev.map((s) => (s.state === "active" ? { ...s, state: "error" } : s)));
    } finally {
      setLoading(false);
    }
  };

  const copyHTML = async () => {
    if (!generatedHTML) return;
    await navigator.clipboard.writeText(generatedHTML);
    showToast("✓ HTML 已复制");
  };

  const exportHTML = () => {
    if (!generatedHTML) return;
    const safe = (analysis?.title ?? "article").replace(/[^\w\u4e00-\u9fa5]/g, "_").slice(0, 30);
    const blob = new Blob([generatedHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `${safe}.html` }).click();
    URL.revokeObjectURL(url);
    showToast("✓ HTML 已下载");
  };

  const exportPNG = async () => {
    if (!generatedHTML || !iframeRef.current) return;
    showToast("⏳ 生成长图中，请稍候...");
    try {
      const renderFrame = document.createElement("iframe");
      renderFrame.style.position = "fixed";
      renderFrame.style.left = "-99999px";
      renderFrame.style.top = "0";
      renderFrame.style.width = "900px";
      renderFrame.style.height = "600px";
      renderFrame.style.border = "none";
      document.body.appendChild(renderFrame);

      await new Promise<void>((resolve, reject) => {
        renderFrame.onload = () => resolve();
        renderFrame.onerror = () => reject(new Error("渲染失败"));
        renderFrame.srcdoc = generatedHTML;
      });

      const doc = renderFrame.contentDocument!;
      await new Promise((r) => setTimeout(r, 400));
      if (doc.fonts?.ready) await doc.fonts.ready;

      // ── 关键修复：强制让所有 scroll-reveal 动画元素可见 ──
      // 生成的页面通常用 IntersectionObserver 在元素滚入视口时
      // 才把 opacity 从 0 变成 1。离屏 iframe 不会真实滚动，
      // 导致内容停留在初始隐藏状态，截图变成大片空白。
      // 这里注入一段强制样式，覆盖所有常见的隐藏写法。
      const forceVisibleStyle = doc.createElement("style");
      forceVisibleStyle.textContent = `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition: none !important;
        }
        [class*="reveal"], [class*="fade"], [class*="animate"],
        [data-reveal], [data-animate], .observe, .scroll-animate,
        section, article, main * {
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
        }
        /* 导出长图时隐藏侧边目录/跳转导航——长图不可点击，目录在截图里只是占位空白 */
        [class*="toc"], [class*="sidebar"], [id*="toc"],
        nav[class*="catalog"], .table-of-contents, .progress-bar,
        [class*="reading-progress"] {
          display: none !important;
        }
      `;
      doc.head.appendChild(forceVisibleStyle);

      // 同时直接清除每个元素的 inline style 中可能残留的隐藏状态
      // （有些实现是用 JS 直接写 el.style.opacity，而不是 class 切换）
      doc.querySelectorAll<HTMLElement>("*").forEach((el) => {
        if (el.style.opacity === "0") el.style.opacity = "1";
        if (el.style.visibility === "hidden") el.style.visibility = "visible";
        if (el.style.transform && el.style.transform !== "none") {
          el.style.transform = "none";
        }
      });

      await new Promise((r) => setTimeout(r, 150));

      const fullHeight = doc.body.scrollHeight;
      renderFrame.style.height = `${fullHeight}px`;
      await new Promise((r) => setTimeout(r, 200));

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(doc.body, {
        width: 900,
        height: doc.body.scrollHeight,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: { margin: "0", transform: "none" },
      });

      document.body.removeChild(renderFrame);

      const safe = (analysis?.title ?? "article").replace(/[^\w\u4e00-\u9fa5]/g, "_").slice(0, 30);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${safe}.png`;
      link.click();
      showToast("✓ 长图已下载");
    } catch (e) {
      console.error("PNG export error:", e);
      showToast("⚠ 长图生成失败，可尝试浏览器自带的「整页截图」功能");
    }
  };

  const hasOutput = generatedHTML.length > 100;
  const cfg = providerConfig;
  const providerLabel = cfg ? PROVIDER_META[cfg.provider].label : "未配置";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflowX: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 sm:px-4 flex-shrink-0"
        style={{ height: 52, background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: "var(--text)" }} />
          <span className="hidden sm:inline font-semibold text-sm" style={{ color: "var(--text)" }}>AI 文章排版工具</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs border transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ border: "1px solid var(--border)", color: cfg ? "var(--text-secondary)" : "#dc2626" }}>
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{cfg ? providerLabel : "⚠ 请配置 API Key"}</span>
          </button>
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
          <button onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
            {dark
              ? <Sun  className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              : <Moon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />}
          </button>
          <TopBtn icon={<RefreshCw className="w-3.5 h-3.5" />} label="重新生成" disabled={!hasOutput || isLoading} onClick={startLayout} />
          <TopBtn icon={<Copy      className="w-3.5 h-3.5" />} label="复制 HTML"  disabled={!hasOutput}             onClick={copyHTML} />
          <TopBtn icon={<FileCode  className="w-3.5 h-3.5" />} label="导出 HTML"  disabled={!hasOutput}             onClick={exportHTML} primary />
          <TopBtn icon={<Image     className="w-3.5 h-3.5" />} label="导出长图"   disabled={!hasOutput || isLoading} onClick={exportPNG} />
          <TopBtn icon={<LayoutGrid className="w-3.5 h-3.5" />} label="卡片图套装" disabled={!analysis} onClick={() => setShowCardDeck(true)} />
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col md:flex-row overflow-y-auto md:overflow-hidden">

        {/* Left panel */}
        <div className="flex flex-col flex-shrink-0 w-full md:w-[420px] md:overflow-y-auto md:border-r"
          style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          <div className="flex flex-col p-3 gap-3 md:min-h-full">

            {/* Article input */}
            <div>
              <Label>文章内容</Label>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder={"在此粘贴或输入你要排版的文章内容...\n\n支持纯文本、Markdown、HTML"}
                className="w-full rounded-lg resize-none text-sm leading-relaxed p-3 transition-colors"
                style={{ height: "clamp(120px, 20vh, 180px)", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--text-secondary)")}
                onBlur={(e)  => (e.target.style.borderColor = "var(--border)")} />
              <div className="text-xs mt-0.5 text-right" style={{ color: "var(--text-tertiary)" }}>{text.length} 字</div>
            </div>

            {/* Style picker */}
            <div>
              <Label>排版风格</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {STYLES.map((s) => (
                  <button key={s.id} onClick={() => { setStyle(s.id as ArticleCategory | "auto" | "custom"); if (analysis) setStyleDirty(true); }}
                    title={s.description}
                    className={clsx(
                      "flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all border",
                      selectedStyle === s.id
                        ? "border-[var(--text)] bg-[var(--bg-secondary)]"
                        : "border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                    )}
                    style={{
                      color: selectedStyle === s.id ? "var(--text)" : "var(--text-secondary)",
                      fontWeight: selectedStyle === s.id ? 600 : 400,
                    }}>
                    <span className="text-base">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 风格已变更提示：提醒用户点重新生成，并说明AI生成存在随机性 */}
            {styleDirty && !isLoading && (
              <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
                <span style={{ flexShrink: 0 }}>💡</span>
                <span>
                  风格已更改，点击下方「{hasOutput ? "重新生成" : "开始智能排版"}」应用新风格。
                  若第一次生成的插画或布局不够满意，可以多点几次「重新生成」——AI 生成设计存在随机性，多试几次通常能拿到更满意的版本，这是正常现象。
                </span>
              </div>
            )}

            {/* Custom prompt textarea — 选中自定义时展开 */}
            {selectedStyle === "custom" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>设计师 Prompt</Label>
                  <button
                    onClick={() => { setCustomPrompt(DEFAULT_CUSTOM_PROMPT); if (analysis) setStyleDirty(true); }}
                    className="text-xs hover:underline"
                    style={{ color: "var(--text-tertiary)" }}>
                    重置默认
                  </button>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => { setCustomPrompt(e.target.value); if (analysis) setStyleDirty(true); }}
                  placeholder="描述你想要的排版风格、配色、字体、插画风格..."
                  className="w-full rounded-lg resize-none text-xs leading-relaxed p-3 transition-colors"
                  style={{
                    height: 200,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    outline: "none",
                    fontFamily: "var(--font-mono, monospace)",
                    lineHeight: 1.7,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--text-secondary)")}
                  onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
                />
                <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  提示：描述越具体，风格越精准。可以写配色、参考品牌、情绪氛围等。
                </div>
              </div>
            )}

            {/* Progress */}
            {isLoading && (
              <div className="rounded-lg p-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <div className="flex flex-col gap-2">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <StepIcon state={step.state} />
                      <span className="text-xs"
                        style={{ color: step.state === "idle" ? "var(--text-tertiary)" : "var(--text)", fontWeight: step.state === "active" ? 500 : 400 }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                {progress > 0 && progress < 100 && (
                  <div className="mt-3">
                    <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>生成进度 {progress}%</div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, background: "var(--text)" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Analysis result */}
            {analysis && !isLoading && (
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                <button className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ color: "var(--text-secondary)" }} onClick={() => setAOpen((o) => !o)}>
                  <span>AI 分析结果</span>
                  {analysisOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {analysisOpen && (
                  <div className="px-3 pb-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <AnalysisRow label="标题" value={analysis.title} />
                    <AnalysisRow label="摘要" value={analysis.summary} />
                    <AnalysisRow label="类型" value={STYLES.find((s) => s.id === analysis.category)?.label ?? analysis.category} />
                    <div className="mt-1.5">
                      <span className="inline-block w-14" style={{ color: "var(--text-tertiary)" }}>关键词</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.keywords.map((k) => (
                          <span key={k} className="px-2 py-0.5 rounded text-xs"
                            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text)" }}>
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                    <AnalysisRow label="内容区块" value={`共 ${analysis.sections.length} 个`} />
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-xs px-3 py-2 rounded-lg"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                {error}
              </div>
            )}

            <div className="flex-1" style={{ minHeight: 12 }} />

            {/* Generate button */}
            <button onClick={startLayout} disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
              style={{
                background: isLoading ? "var(--bg-tertiary)" : "var(--text)",
                color: isLoading ? "var(--text-tertiary)" : "var(--bg)",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}>
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> 排版中...</>
                : <><Wand2   className="w-4 h-4" /> 开始智能排版</>}
            </button>
          </div>
        </div>

        {/* Right: preview */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-[50vh] md:min-h-0">
          <div className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ height: 40, background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>实时预览</span>
            {analysis && (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {selectedStyle === "custom"
                  ? "🎨 自定义风格"
                  : `${STYLES.find((s) => s.id === (selectedStyle === "auto" ? analysis.category : selectedStyle))?.label ?? ""} 风格`}
                {" · "}{analysis.keywords.slice(0, 3).join(" · ")}
              </span>
            )}
          </div>
          <div className="flex-1 relative overflow-hidden">
            {!hasOutput && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ color: "var(--text-tertiary)" }}>
                <Wand2 className="w-10 h-10 opacity-20" />
                <p className="text-sm">输入文章，点击「开始智能排版」</p>
              </div>
            )}
            {isLoading && !hasOutput && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ color: "var(--text-tertiary)" }}>
                <Loader2 className="w-8 h-8 animate-spin opacity-30" />
              </div>
            )}
            {hasOutput && (
              <iframe ref={iframeRef} srcDoc={generatedHTML}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
                title="文章预览" />
            )}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <ProviderSettings
          current={providerConfig}
          onSave={(cfg) => setConfig(cfg)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Card deck panel */}
      {showCardDeck && (
        <CardDeckPanel
          analysis={analysis!}
          articleText={text}
          showToast={showToast}
          onClose={() => setShowCardDeck(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 px-4 py-2.5 rounded-lg text-sm z-50"
          style={{ background: "var(--text)", color: "var(--bg)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── 小组件 ───────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wide mb-1.5"
      style={{ color: "var(--text-tertiary)" }}>
      {children}
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 mt-1.5">
      <span className="flex-shrink-0 w-14" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ color: "var(--text)", lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

function TopBtn({ icon, label, disabled, onClick, primary }: {
  icon: React.ReactNode; label: string; disabled?: boolean; onClick: () => void; primary?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={clsx(
        "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
        primary
          ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] hover:opacity-85"
          : "bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]",
        disabled && "opacity-40 cursor-not-allowed"
      )}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}
