import { describe, it, expect } from "vitest";
import { parseSection, extractQuote, estimateFit, splitSection } from "../card-paginate";

describe("parseSection", () => {
  it("splits lines into paragraphs", () => {
    const result = parseSection("第一段内容。\n\n第二段内容。\n第三段内容。");
    expect(result.paragraphs).toHaveLength(3);
    expect(result.steps).toBeUndefined();
  });

  it("detects numbered steps", () => {
    const result = parseSection(
      "1. 准备工作：确保已安装 Node.js。\n2. 安装依赖：运行 npm install。"
    );
    expect(result.steps).toHaveLength(2);
    expect(result.steps![0]).toEqual({ heading: "准备工作", desc: "确保已安装 Node.js。" });
    expect(result.steps![1]).toEqual({ heading: "安装依赖", desc: "运行 npm install。" });
  });

  it("handles mixed paragraphs and steps", () => {
    const result = parseSection("这是一段介绍。\n1. 第一步：做这个。\n2. 第二步：做那个。");
    expect(result.paragraphs).toHaveLength(1);
    expect(result.steps).toHaveLength(2);
  });
});

describe("extractQuote", () => {
  it("finds a quoted string", () => {
    const { quote, remaining } = extractQuote([
      "第一段。",
      "\"AI 不会取代程序员\"",
      "第三段。",
    ]);
    expect(quote).toBe("AI 不会取代程序员");
    expect(remaining).toHaveLength(2);
  });

  it("handles CJK quotes", () => {
    const { quote } = extractQuote(["「这是引言」", "正文内容。"]);
    expect(quote).toBe("这是引言");
  });

  it("returns nothing if no quote found", () => {
    const { quote, remaining } = extractQuote(["普通段落。", "另一个段落。"]);
    expect(quote).toBeUndefined();
    expect(remaining).toHaveLength(2);
  });
});

describe("estimateFit", () => {
  it("estimates short text fits", () => {
    expect(estimateFit("短文本。", 26, 600)).toBe(true);
  });

  it("estimates long text overflows", () => {
    const longText = "字。".repeat(5000);
    expect(estimateFit(longText, 26, 600)).toBe(false);
  });
});

describe("splitSection", () => {
  it("splits steps across multiple cards", () => {
    const section = {
      title: "测试章节",
      paragraphs: [],
      steps: [
        { heading: "第一步", desc: "做 A" },
        { heading: "第二步", desc: "做 B" },
        { heading: "第三步", desc: "做 C" },
        { heading: "第四步", desc: "做 D" },
        { heading: "第五步", desc: "做 E" },
      ],
    };
    const chunks = splitSection(section, 0);
    expect(chunks.length).toBe(2);
    expect(chunks[0].steps).toHaveLength(4);
    expect(chunks[1].steps).toHaveLength(1);
    expect(chunks[1].isContinuation).toBe(true);
  });

  it("splits long paragraphs", () => {
    const section = {
      title: "长文章节",
      paragraphs: [
        "短段落。",
        "A".repeat(500) + "。",
        "B".repeat(400) + "。",
        "短结尾。",
      ],
    };
    const chunks = splitSection(section, 0, 400);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].paragraphs.length).toBeGreaterThan(0);
  });

  it("returns one chunk for short paragraphs", () => {
    const section = {
      title: "短章节",
      paragraphs: ["短段落一。", "短段落二。"],
    };
    const chunks = splitSection(section, 0);
    expect(chunks).toHaveLength(1);
  });
});
