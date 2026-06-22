"use client";

import { useState, useCallback } from "react";
import {
  ArticleAnalysis, CardPlatformPreset, CardPage, CardSettings, ContentCardStyle,
  CARD_PLATFORMS, CARD_THEMES_BY_CATEGORY, CARD_THEMES_EXTRAS, CardTheme,
} from "@/types";
import { getCardTheme, getThemeCSS } from "@/lib/card-themes";
import { buildCardDeck } from "@/lib/card-deck";
import { renderCardDeck } from "@/lib/render-png";
import { saveCardSettings, loadCardSettings } from "@/lib/storage";

interface Props {
  analysis: ArticleAnalysis;
  articleText: string;
  showToast: (msg: string) => void;
  onClose: () => void;
}

export default function CardDeckPanel({ analysis, articleText, showToast, onClose }: Props) {
  // Load saved settings or use defaults
  const saved = loadCardSettings();
  const [platformId, setPlatformId] = useState(saved?.platformId ?? "xhs34");
  const [customW, setCustomW] = useState(saved?.customWidth ?? 1080);
  const [customH, setCustomH] = useState(saved?.customHeight ?? 1440);
  const [themeId, setThemeId] = useState(saved?.themeId ?? "auto");
  const [contentStyle, setContentStyle] = useState<ContentCardStyle>(saved?.contentStyle ?? "auto");
  const [handle, setHandle] = useState(saved?.accountHandle ?? "");
  const [slogan, setSlogan] = useState(saved?.endingSlogan ?? "");

  const [pages, setPages] = useState<CardPage[]>([]);
  const [generated, setGenerated] = useState<{ id: string; label: string; dataUrl: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const platform: CardPlatformPreset = (() => {
    const found = CARD_PLATFORMS.find((p) => p.id === platformId);
    return found ?? { id: "custom", label: "自定义", shortLabel: "自定义", width: customW, height: customH };
  })();

  const activeTheme = getCardTheme(themeId, analysis.category);

  const save = useCallback(() => {
    const s: CardSettings = {
      platformId, customWidth: customW, customHeight: customH,
      themeId, contentStyle, accountHandle: handle, endingSlogan: slogan,
    };
    saveCardSettings(s);
  }, [platformId, customW, customH, themeId, contentStyle, handle, slogan]);

  const generate = useCallback(async () => {
    save();
    setLoading(true);
    setProgress(0);
    setGenerated([]);

    try {
      const cardPages = buildCardDeck(
        analysis, articleText, platform, activeTheme,
        contentStyle, handle, slogan,
      );
      setPages(cardPages);

      const results = await renderCardDeck(
        cardPages.map((p, i) => ({ id: `card-${i}`, label: p.label, html: p.html })),
        platform.width,
        platform.height,
        (done, total) => setProgress(Math.round((done / total) * 100)),
      );
      setGenerated(results);
      showToast(`✓ 已生成 ${results.length} 张卡片`);
    } catch (e) {
      showToast(`⚠ 生成失败: ${e instanceof Error ? e.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  }, [analysis, articleText, platform, activeTheme, contentStyle, handle, slogan, save, showToast]);

  const downloadSingle = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const downloadAll = async () => {
    if (generated.length === 0) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < generated.length; i++) {
        const label = `${String(i + 1).padStart(2, "0")}-${generated[i].label}`;
        const safe = label.replace(/[^\w一-龥]/g, "_").slice(0, 40);
        const base64 = generated[i].dataUrl.split(",")[1];
        zip.file(`${safe}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const title = (analysis?.title ?? "article").replace(/[^\w一-龥]/g, "_").slice(0, 20);
      a.download = `${title}-cards.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✓ 已下载 ${generated.length} 张卡片 (ZIP)`);
    } catch {
      showToast("⚠ ZIP 打包失败，请逐张下载");
    }
  };

  const themeOptions: { id: string; name: string; primary: string }[] = [
    { id: "auto", name: "自动匹配", primary: activeTheme.primary },
    ...Object.values(CARD_THEMES_BY_CATEGORY).map((t) => ({ id: t.id, name: t.name, primary: t.primary })),
    ...CARD_THEMES_EXTRAS.map((t) => ({ id: t.id, name: t.name, primary: t.primary })),
  ];

  // Filter out current platform from list for "custom" trigger
  const regularPlatforms = CARD_PLATFORMS.filter((p) => p.id !== "custom");
  const isCustomPlatform = platformId === "custom";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "var(--bg, #ffffff)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid var(--border, #e5e7eb)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text, #111827)" }}>
            🃏 卡片图套装
          </h2>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-secondary,#f3f4f6)]"
            style={{ color: "var(--text-secondary, #6b7280)" }}>✕ 关闭</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Platform */}
          <div>
            <Label>发布平台</Label>
            <div className="grid grid-cols-5 gap-2">
              {regularPlatforms.map((p) => (
                <button key={p.id} onClick={() => { setPlatformId(p.id); save(); }}
                  className={`text-xs px-2 py-2 rounded-lg border transition-all ${
                    platformId === p.id ? "font-semibold" : ""
                  }`}
                  style={{
                    borderColor: platformId === p.id ? "var(--text, #111)" : "var(--border, #e5e7eb)",
                    background: platformId === p.id ? "var(--bg-secondary, #f3f4f6)" : "transparent",
                    color: platformId === p.id ? "var(--text, #111)" : "var(--text-secondary, #6b7280)",
                  }}>
                  {p.shortLabel}<br /><span style={{ fontSize: 10, opacity: 0.6 }}>{p.width}×{p.height}</span>
                </button>
              ))}
              <button onClick={() => { setPlatformId("custom"); save(); }}
                className={`text-xs px-2 py-2 rounded-lg border transition-all ${
                  isCustomPlatform ? "font-semibold" : ""
                }`}
                style={{
                  borderColor: isCustomPlatform ? "var(--text, #111)" : "var(--border, #e5e7eb)",
                  background: isCustomPlatform ? "var(--bg-secondary, #f3f4f6)" : "transparent",
                  color: isCustomPlatform ? "var(--text, #111)" : "var(--text-secondary, #6b7280)",
                }}>
                自定义<br /><span style={{ fontSize: 10, opacity: 0.6 }}>尺寸</span>
              </button>
            </div>
            {isCustomPlatform && (
              <div className="flex gap-3 mt-2">
                <input type="number" value={customW} onChange={(e) => setCustomW(Number(e.target.value))}
                  className="w-full text-xs px-3 py-1.5 rounded-lg" placeholder="宽度 (px)"
                  style={{ background: "var(--bg-secondary, #f3f4f6)", border: "1px solid var(--border, #e5e7eb)", color: "var(--text, #111)", outline: "none" }} />
                <span className="flex items-center text-xs" style={{ color: "var(--text-secondary, #6b7280)" }}>×</span>
                <input type="number" value={customH} onChange={(e) => setCustomH(Number(e.target.value))}
                  className="w-full text-xs px-3 py-1.5 rounded-lg" placeholder="高度 (px)"
                  style={{ background: "var(--bg-secondary, #f3f4f6)", border: "1px solid var(--border, #e5e7eb)", color: "var(--text, #111)", outline: "none" }} />
              </div>
            )}
          </div>

          {/* Content style */}
          <div>
            <Label>排版风格</Label>
            <div className="flex gap-2">
              {(["auto", "article", "steps", "data"] as ContentCardStyle[]).map((s) => (
                <button key={s} onClick={() => { setContentStyle(s); save(); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    contentStyle === s ? "font-semibold" : ""
                  }`}
                  style={{
                    borderColor: contentStyle === s ? "var(--text, #111)" : "var(--border, #e5e7eb)",
                    background: contentStyle === s ? "var(--bg-secondary, #f3f4f6)" : "transparent",
                    color: contentStyle === s ? "var(--text, #111)" : "var(--text-secondary, #6b7280)",
                  }}>
                  {s === "auto" ? "🤖 自动" : s === "article" ? "📝 文章" : s === "steps" ? "📋 步骤" : "📊 数据"}
                </button>
              ))}
            </div>
          </div>

          {/* Theme picker */}
          <div>
            <Label>配色方案</Label>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map((t) => (
                <button key={t.id} onClick={() => { setThemeId(t.id); save(); }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    themeId === t.id ? "font-semibold" : ""
                  }`}
                  style={{
                    borderColor: themeId === t.id ? t.primary : "var(--border, #e5e7eb)",
                    boxShadow: themeId === t.id ? `0 0 0 1px ${t.primary}` : "none",
                    background: "transparent",
                    color: "var(--text, #111)",
                  }}>
                  <span className="w-3 h-3 rounded-full inline-block"
                    style={{ background: t.primary }} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>账号名</Label>
              <input value={handle} onChange={(e) => { setHandle(e.target.value); save(); }}
                className="w-full text-xs px-3 py-1.5 rounded-lg"
                placeholder="你的昵称"
                style={{ background: "var(--bg-secondary, #f3f4f6)", border: "1px solid var(--border, #e5e7eb)", color: "var(--text, #111)", outline: "none" }} />
            </div>
            <div>
              <Label>结尾引导语</Label>
              <input value={slogan} onChange={(e) => { setSlogan(e.target.value); save(); }}
                className="w-full text-xs px-3 py-1.5 rounded-lg"
                placeholder="分享知识与思考"
                style={{ background: "var(--bg-secondary, #f3f4f6)", border: "1px solid var(--border, #e5e7eb)", color: "var(--text, #111)", outline: "none" }} />
            </div>
          </div>

          {/* Generate button + progress */}
          {loading && (
            <div className="text-xs" style={{ color: "var(--text-secondary, #6b7280)" }}>
              正在渲染卡片... {progress}%
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary, #e5e7eb)" }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: "var(--text, #111)" }} />
              </div>
            </div>
          )}

          <button onClick={generate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
            style={{
              background: loading ? "var(--bg-tertiary, #e5e7eb)" : "var(--text, #111)",
              color: loading ? "var(--text-tertiary, #9ca3af)" : "var(--bg, #fff)",
              cursor: loading ? "not-allowed" : "pointer",
            }}>
            {loading ? "⏳ 生成中..." : "🎨 生成卡片图套装"}
          </button>

          {/* Gallery */}
          {generated.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary, #6b7280)" }}>
                  共 {generated.length} 张卡片
                </span>
                <button onClick={downloadAll}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium border"
                  style={{
                    borderColor: "var(--border, #e5e7eb)",
                    color: "var(--text, #111)",
                    background: "var(--bg-secondary, #f3f4f6)",
                  }}>
                  📦 下载全部 ZIP
                </button>
              </div>

              <div className="space-y-4">
                {generated.map((card, i) => (
                  <div key={card.id} className="rounded-lg overflow-hidden border"
                    style={{ borderColor: "var(--border, #e5e7eb)" }}>
                    <div className="flex items-center justify-between px-3 py-2"
                      style={{ background: "var(--bg-secondary, #f3f4f6)", borderBottom: "1px solid var(--border, #e5e7eb)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--text, #111)" }}>
                        {card.label === "封面" ? "📌 封面" : card.label === "结尾引导" ? "🔚 结尾" : `📄 ${i}/${generated.length-2}`}
                      </span>
                      <button onClick={() => downloadSingle(card.dataUrl, `card-${String(i+1).padStart(2,"0")}.png`)}
                        className="text-xs px-2 py-1 rounded hover:underline"
                        style={{ color: "var(--text-secondary, #6b7280)" }}>
                        💾 下载
                      </button>
                    </div>
                    <div className="flex justify-center p-3" style={{ background: "#f9fafb" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={card.dataUrl} alt={card.label}
                        className="rounded shadow-sm"
                        style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wide mb-1.5"
      style={{ color: "var(--text-tertiary, #9ca3af)" }}>
      {children}
    </div>
  );
}
