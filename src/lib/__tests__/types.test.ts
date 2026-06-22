import { describe, it, expect } from "vitest";
import { PROVIDER_META } from "@/types";
import type { AIProvider, ProviderConfig } from "@/types";

const ALL_PROVIDERS: AIProvider[] = ["anthropic", "openai", "gemini", "deepseek"];

describe("PROVIDER_META", () => {
  it("has entries for all 4 providers", () => {
    for (const p of ALL_PROVIDERS) {
      expect(PROVIDER_META[p]).toBeDefined();
    }
  });

  it("each provider has a non-empty label and docsUrl", () => {
    for (const p of ALL_PROVIDERS) {
      expect(PROVIDER_META[p].label.length).toBeGreaterThan(0);
      expect(PROVIDER_META[p].docsUrl).toMatch(/^https?:\/\//);
    }
  });

  it("each provider has at least one model with non-empty id and label", () => {
    for (const p of ALL_PROVIDERS) {
      const models = PROVIDER_META[p].models;
      expect(models.length).toBeGreaterThanOrEqual(1);
      for (const m of models) {
        expect(m.id.length).toBeGreaterThan(0);
        expect(m.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("each provider's defaultModel appears in its models list", () => {
    for (const p of ALL_PROVIDERS) {
      const { defaultModel, models } = PROVIDER_META[p];
      expect(models.some((m) => m.id === defaultModel)).toBe(true);
    }
  });

  it("only gemini has free: true", () => {
    expect(PROVIDER_META.gemini.free).toBe(true);
    expect(PROVIDER_META.anthropic.free).toBe(false);
    expect(PROVIDER_META.openai.free).toBe(false);
    expect(PROVIDER_META.deepseek.free).toBe(false);
  });

  it("each provider has a unique defaultModel", () => {
    const models = ALL_PROVIDERS.map((p) => PROVIDER_META[p].defaultModel);
    expect(new Set(models).size).toBe(models.length);
  });

  it("ProviderConfig type is structurally valid", () => {
    const cfg: ProviderConfig = {
      provider: "openai",
      apiKey: "sk-test",
    };
    expect(cfg.provider).toBe("openai");
    expect(cfg.model).toBeUndefined();
    cfg.model = "gpt-4o";
    expect(cfg.model).toBe("gpt-4o");
  });
});
