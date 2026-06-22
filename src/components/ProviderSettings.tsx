"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AIProvider, ProviderConfig, PROVIDER_META } from "@/types";
import { saveConfig, clearConfig, defaultConfig } from "@/lib/storage";
import { callAI } from "@/lib/ai-client";
import clsx from "clsx";

interface Props {
  current: ProviderConfig | null;
  onSave: (config: ProviderConfig) => void;
  onClose: () => void;
}

export default function ProviderSettings({ current, onSave, onClose }: Props) {
  const [provider, setProvider] = useState<AIProvider>(current?.provider ?? "gemini");
  const [apiKey, setApiKey] = useState(current?.apiKey ?? "");
  const [model, setModel] = useState(current?.model ?? "");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [testMsg, setTestMsg] = useState("");

  const meta = PROVIDER_META[provider];

  // When switching provider, reset key and model
  useEffect(() => {
    if (current && current.provider === provider) {
      setApiKey(current.apiKey);
      setModel(current.model ?? meta.defaultModel);
    } else {
      setApiKey("");
      setModel(meta.defaultModel);
    }
    setTestResult(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestMsg("");
    try {
      const cfg: ProviderConfig = { provider, apiKey: apiKey.trim(), model: model || meta.defaultModel };
      const reply = await callAI(cfg, [{ role: "user", content: 'Reply with exactly: "OK"' }], {
        maxTokens: 10,
      });
      if (reply.toLowerCase().includes("ok")) {
        setTestResult("ok");
        setTestMsg("连接成功！");
      } else {
        setTestResult("ok");
        setTestMsg(`连接成功，模型回复：${reply.slice(0, 40)}`);
      }
    } catch (e) {
      setTestResult("fail");
      setTestMsg(e instanceof Error ? e.message : "连接失败");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    const cfg: ProviderConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model || meta.defaultModel,
    };
    saveConfig(cfg);
    onSave(cfg);
    onClose();
  };

  const handleClear = () => {
    clearConfig();
    onSave(defaultConfig("gemini"));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              AI 提供商配置
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Key 仅保存在本地浏览器，不上传任何服务器
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Provider tabs */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide mb-2 block" style={{ color: "var(--text-tertiary)" }}>
              选择提供商
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDER_META) as AIProvider[]).map((p) => {
                const m = PROVIDER_META[p];
                return (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={clsx(
                      "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                      provider === p
                        ? "border-[var(--text)] bg-[var(--bg-secondary)]"
                        : "border-[var(--border)] hover:border-[var(--text-tertiary)]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                        {m.label}
                      </div>
                      {m.free && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block"
                          style={{ background: "#dcfce7", color: "#15803d", fontSize: 10 }}
                        >
                          有免费额度
                        </span>
                      )}
                    </div>
                    {provider === p && (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model picker */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide mb-2 block" style={{ color: "var(--text-tertiary)" }}>
              模型
            </label>
            <select
              value={model || meta.defaultModel}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              {meta.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                API Key
              </label>
              <a
                href={meta.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                获取 Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                placeholder={meta.placeholder}
                className="w-full text-sm rounded-lg px-3 py-2 pr-9"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              />
              <button
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-tertiary)" }}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
              style={{
                background: testResult === "ok" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${testResult === "ok" ? "#bbf7d0" : "#fecaca"}`,
                color: testResult === "ok" ? "#15803d" : "#dc2626",
              }}
            >
              {testResult === "ok" ? (
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              )}
              {testMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-4 gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={handleClear}
            className="text-xs px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            清除配置
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={!apiKey.trim() || testing}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              测试连接
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
