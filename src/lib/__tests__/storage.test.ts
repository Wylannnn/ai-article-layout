import { describe, it, expect, beforeEach } from "vitest";
import { saveConfig, loadConfig, clearConfig, defaultConfig } from "../storage";
import { ProviderConfig } from "@/types";

const testConfig: ProviderConfig = {
  provider: "gemini",
  apiKey: "test-key-12345",
  model: "gemini-2.5-flash",
};

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("saveConfig / loadConfig", () => {
    it("saves and loads a config", () => {
      saveConfig(testConfig);
      const loaded = loadConfig();
      expect(loaded).toEqual(testConfig);
    });

    it("returns null when no config saved", () => {
      expect(loadConfig()).toBeNull();
    });

    it("preserves all fields after round-trip", () => {
      saveConfig(testConfig);
      const loaded = loadConfig()!;
      expect(loaded.provider).toBe("gemini");
      expect(loaded.apiKey).toBe("test-key-12345");
      expect(loaded.model).toBe("gemini-2.5-flash");
    });

    it("handles config without optional model", () => {
      const cfg: ProviderConfig = { provider: "openai", apiKey: "sk-test" };
      saveConfig(cfg);
      expect(loadConfig()).toEqual(cfg);
    });
  });

  describe("clearConfig", () => {
    it("removes saved config", () => {
      saveConfig(testConfig);
      clearConfig();
      expect(loadConfig()).toBeNull();
    });

    it("is idempotent (no-op when nothing saved)", () => {
      expect(() => clearConfig()).not.toThrow();
      expect(loadConfig()).toBeNull();
    });
  });

  describe("defaultConfig", () => {
    it("returns config with default model for each provider", () => {
      expect(defaultConfig("gemini").model).toBe("gemini-2.5-flash");
      expect(defaultConfig("anthropic").model).toBe("claude-sonnet-4-6");
      expect(defaultConfig("openai").model).toBe("gpt-4o-mini");
      expect(defaultConfig("deepseek").model).toBe("deepseek-chat");
    });

    it("returns empty apiKey", () => {
      expect(defaultConfig("gemini").apiKey).toBe("");
    });
  });

  describe("loadConfig error handling", () => {
    it("returns null on malformed JSON", () => {
      localStorage.setItem("ai-layout-provider-config", "not-json{{{");
      expect(loadConfig()).toBeNull();
    });
  });
});
