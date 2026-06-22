/**
 * 浏览器本地存储 — 管理 API Key 配置
 * Key 存在 localStorage，不上传任何服务器
 */

import { AIProvider, ProviderConfig, PROVIDER_META } from "@/types";

const STORAGE_KEY = "ai-layout-provider-config";

export function saveConfig(config: ProviderConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function loadConfig(): ProviderConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProviderConfig;
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function defaultConfig(provider: AIProvider): ProviderConfig {
  return {
    provider,
    apiKey: "",
    model: PROVIDER_META[provider].defaultModel,
  };
}

