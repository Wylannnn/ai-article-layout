import { describe, it, expect } from "vitest";
import {
  splitContentIntoBlocks,
  checkSplitIntegrity,
  pickStyleHintSnippet,
  SectionMeta,
} from "../content-blocks";

describe("splitContentIntoBlocks", () => {
  it("splits by title anchors when titles are found in order", () => {
    const original =
      "第一步：捕捉核心创意。这里是第一步的详细内容，包含具体案例和数字举例。" +
      "第二步：分析结构性张力。这里是第二步的详细内容，包含愿景与现状的对比说明。" +
      "第三步：设计里程碑。这里是第三步的详细内容，包含里程碑划分的具体方法。";
    const sections: SectionMeta[] = [
      { title: "第一步：捕捉核心创意" },
      { title: "第二步：分析结构性张力" },
      { title: "第三步：设计里程碑" },
    ];
    const result = splitContentIntoBlocks(original, sections);
    expect(result.matchedByTitle).toBe(true);
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0].rawText).toContain("第一步的详细内容");
    expect(result.blocks[1].rawText).toContain("第二步的详细内容");
    expect(result.blocks[0].rawText).not.toContain("第二步");
    const integrity = checkSplitIntegrity(result);
    expect(integrity.charDiff).toBe(0);
  });

  it("falls back to equal split when titles are not found", () => {
    const original =
      "这是一段没有清晰章节标记的长文本。".repeat(20) +
      "这里讲第二部分内容，但是原文里完全没有写明确的小标题。".repeat(20);
    const sections: SectionMeta[] = [
      { title: "完全虚构的标题甲" },
      { title: "完全虚构的标题乙" },
    ];
    const result = splitContentIntoBlocks(original, sections);
    expect(result.matchedByTitle).toBe(false);
    expect(result.blocks).toHaveLength(2);
    const integrity = checkSplitIntegrity(result);
    expect(integrity.charDiff).toBeLessThanOrEqual(original.length * 0.01);
  });

  it("does not break sentences in equal-split fallback", () => {
    const original =
      "这是第一句话用来撑长度撑长度撑长度撑长度撑长度。" +
      "这是第二句话也用来撑长度撑长度撑长度撑长度撑长度。" +
      "这是第三句话同样用来撑长度撑长度撑长度撑长度撑长度。" +
      "这是第四句话最后用来撑长度撑长度撑长度撑长度撑长度。";
    const sections: SectionMeta[] = [
      { title: "无法匹配的标题A" },
      { title: "无法匹配的标题B" },
    ];
    const result = splitContentIntoBlocks(original, sections);
    const integrity = checkSplitIntegrity(result);
    expect(integrity.hasBrokenSentence).toBe(false);
    for (const b of result.blocks) {
      const lastChar = b.rawText.trimEnd().slice(-1);
      expect(["。", "！", "？", ".", "!", "?", "\n"]).toContain(lastChar);
    }
  });

  it("rejects non-monotonic title order", () => {
    const original = "先讲第三步的内容在这里出现。然后才讲第一步的内容在后面出现。";
    const sections: SectionMeta[] = [{ title: "第一步" }, { title: "第三步" }];
    const result = splitContentIntoBlocks(original, sections);
    // "第一步"只有3个字符，按规则<4也会失败；这里title长度不够已经会触发allFound=false
    expect(result.matchedByTitle).toBe(false);
  });

  it("rejects titles shorter than 4 characters", () => {
    const original = "这里第一步出现了一次。这里第一步又出现了一次。后续详细内容在此。";
    const sections: SectionMeta[] = [{ title: "第一步" }, { title: "后续详细内容" }];
    const result = splitContentIntoBlocks(original, sections);
    expect(result.matchedByTitle).toBe(false);
  });

  it("returns single block when sections array is empty", () => {
    const original = "这是一段没有任何章节结构的纯文本内容。";
    const result = splitContentIntoBlocks(original, []);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].rawText).toBe(original);
  });

  it("handles empty original text gracefully", () => {
    const result = splitContentIntoBlocks("", [{ title: "随便一个标题" }]);
    expect(result.blocks).toHaveLength(1);
  });

  it("escapes special regex characters in titles", () => {
    const original =
      "第一步（核心创意）的内容在这里。这是详细说明的部分。" +
      "第二步*重点标记*的内容在这里。这是另一段说明。";
    const sections: SectionMeta[] = [
      { title: "第一步（核心创意）" },
      { title: "第二步*重点标记*" },
    ];
    expect(() => splitContentIntoBlocks(original, sections)).not.toThrow();
    const result = splitContentIntoBlocks(original, sections);
    expect(result.matchedByTitle).toBe(true);
  });

  it("uses unicode codepoint counting correctly", () => {
    const original = "这段话里有emoji😀和🎉，用于测试codepoint计数是否准确。";
    const result = splitContentIntoBlocks(original, []);
    expect(result.originalCharCount).toBe(Array.from(original).length);
  });

  it("preserves full content in real-world sample", () => {
    const original = `第一步：将"念头"精炼为"核心创意"（定义愿景）

你现在有一个模糊但有力的念头。它需要被塑造成一个清晰的"创造项目"。

不要这样想："我要学会如何学习所有东西。"（太模糊，是方向，不是项目）

第二步：分析"结构性张力"（愿景与现状）

愿景：你已经在上一步定义了（例如，完成那份报告）。`;
    const sections: SectionMeta[] = [
      { title: '将"念头"精炼为"核心创意"' },
      { title: '分析"结构性张力"' },
    ];
    const result = splitContentIntoBlocks(original, sections);
    const integrity = checkSplitIntegrity(result);
    expect(result.blocks[0].rawText).toContain("不要这样想");
    expect(result.blocks[0].rawText).toContain("太模糊，是方向，不是项目");
    expect(integrity.charDiff).toBe(0);
  });
});

describe("pickStyleHintSnippet", () => {
  it("extracts first paragraph from each block within char limit", () => {
    const blocks = [
      { id: "block_1", sectionIndex: 1, rawText: "这是第一章的引言段落，用来描述背景和问题。\n\n这是第一章的第二段，应该不会被提取到。" },
      { id: "block_2", sectionIndex: 2, rawText: "第二章从这里开始，进一步深入核心内容。\n\n后续补充说明。" },
    ];
    const snippet = pickStyleHintSnippet(blocks, 500);
    expect(snippet).toContain("引言段落");
    expect(snippet).toContain("深入核心内容");
    expect(snippet).not.toContain("不会被提取到");
    expect(snippet).not.toContain("后续补充说明");
  });

  it("truncates to maxChars limit", () => {
    const blocks = [
      { id: "block_1", sectionIndex: 1, rawText: "第一段很长的内容在这里不断重复。".repeat(20) },
    ];
    const snippet = pickStyleHintSnippet(blocks, 50);
    expect(snippet.length).toBeLessThanOrEqual(60);
  });

  it("returns empty string for empty blocks", () => {
    expect(pickStyleHintSnippet([])).toBe("");
  });

  it("skips empty text blocks", () => {
    const blocks = [
      { id: "block_1", sectionIndex: 1, rawText: "   " },
      { id: "block_2", sectionIndex: 2, rawText: "实际有内容的段落在这里。" },
    ];
    const snippet = pickStyleHintSnippet(blocks, 500);
    expect(snippet).toContain("实际有内容的段落");
  });

  it("returns first meaningful paragraph even if very short", () => {
    const blocks = [
      { id: "block_1", sectionIndex: 1, rawText: "短句。" },
    ];
    const snippet = pickStyleHintSnippet(blocks, 500);
    expect(snippet).toContain("短句");
  });

  it("skips prefix before first double-newline", () => {
    const blocks = [
      { id: "block_1", sectionIndex: 1, rawText: "前置小字\n\n这是真正的第一段正文内容。" },
    ];
    const snippet = pickStyleHintSnippet(blocks, 500);
    expect(snippet).not.toContain("前置小字");
    expect(snippet).toContain("真正的第一段");
  });
});
