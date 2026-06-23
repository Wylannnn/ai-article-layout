// lib/content-blocks.ts
// ──────────────────────────────────────────────────────────────
// 内容切分模块：把原文按章节切分成"内容块"，每块带唯一 id。
//
// 设计原则（方案A的核心）：
// - 这一步只做"定位边界"，绝不做任何转写、清洗、概括。
// - rawText 必须是原文的逐字子串。任何字符级差异都是 bug。
// - 切分失败时有明确的降级路径，绝不能因为切分失败而退回
//   "把原文整段塞给模型"的旧方案（那正是问题根源）。
// ──────────────────────────────────────────────────────────────

export interface ContentBlock {
  id: string; // 形如 "block_1", "block_2"... 与 sectionIndex 一一对应
  sectionIndex: number; // 从 1 开始，对应 ArticleAnalysis.sections 的第几节
  rawText: string; // 原文的逐字子串，不允许任何转写
}

export interface SplitResult {
  blocks: ContentBlock[];
  /** 切分是否成功定位到了真实章节边界；false 表示走了均分兜底 */
  matchedByTitle: boolean;
  /** 原文总字符数（unicode codepoint 计数） */
  originalCharCount: number;
  /** 所有 block.rawText 拼接后的字符数，理论上应等于 originalCharCount */
  blocksCharCount: number;
}

// ── 工具函数 ──────────────────────────────────────────────

/** 按 unicode codepoint 计数 */
function codepointLength(s: string): number {
  return Array.from(s).length;
}

/**
 * 句子边界探测：返回所有"可以安全切分"的位置。
 * 中英文混合场景下的句末标志：。！？.!? 后面，以及换行符。
 */
function findSentenceBoundaries(text: string): number[] {
  const boundaries: number[] = [0];
  const sentenceEndRe = /[。！？.!?\n]/g;
  let match: RegExpExecArray | null;
  while ((match = sentenceEndRe.exec(text)) !== null) {
    boundaries.push(match.index + 1);
  }
  if (boundaries[boundaries.length - 1] !== text.length) {
    boundaries.push(text.length);
  }
  return boundaries;
}

/** 在 boundaries 中找到最接近 target 的边界 */
function nearestBoundary(boundaries: number[], target: number): number {
  let best = boundaries[0];
  let bestDist = Math.abs(target - best);
  for (const b of boundaries) {
    const dist = Math.abs(target - b);
    if (dist < bestDist) {
      best = b;
      bestDist = dist;
    }
  }
  return best;
}

/** 转义正则特殊字符 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── 主切分函数 ──────────────────────────────────────────────

export interface SectionMeta {
  title: string;
}

/**
 * 把原文按 sections 切分成内容块。
 *
 * 策略优先级：
 * 1. 按标题定位锚点（要求标题至少 4 个字符，避免短标题误匹配）
 * 2. 锚点单调递增且数量一致 → 按锚点切分
 * 3. 否则降级为按字数均分 + 句子边界对齐
 * 4. sections 为空或原文极短 → 整篇作为一个 block
 */
export function splitContentIntoBlocks(
  originalText: string,
  sections: SectionMeta[]
): SplitResult {
  const originalCharCount = codepointLength(originalText);

  if (sections.length === 0 || originalText.trim().length === 0) {
    const block: ContentBlock = {
      id: "block_1",
      sectionIndex: 1,
      rawText: originalText,
    };
    return {
      blocks: [block],
      matchedByTitle: false,
      originalCharCount,
      blocksCharCount: codepointLength(block.rawText),
    };
  }

  // ── 策略1：尝试按标题定位锚点 ──────────────────────────
  const anchors: number[] = [];
  let allFound = true;
  for (const section of sections) {
    const title = section.title?.trim() ?? "";
    if (title.length < 4) {
      allFound = false;
      break;
    }
    const re = new RegExp(escapeRegExp(title));
    const match = re.exec(originalText);
    if (!match) {
      allFound = false;
      break;
    }
    anchors.push(match.index);
  }

  // 锚点必须严格单调递增
  const isMonotonic = anchors.every((pos, i) => i === 0 || pos > anchors[i - 1]);

  if (allFound && isMonotonic && anchors.length === sections.length) {
    const blocks: ContentBlock[] = [];
    for (let i = 0; i < anchors.length; i++) {
      // 第一个 block 从原文开头（0）算起，不丢失标题前面的内容
      const start = i === 0 ? 0 : anchors[i];
      const end = i + 1 < anchors.length ? anchors[i + 1] : originalText.length;
      blocks.push({
        id: `block_${i + 1}`,
        sectionIndex: i + 1,
        rawText: originalText.slice(start, end),
      });
    }
    const blocksCharCount = blocks.reduce((sum, b) => sum + codepointLength(b.rawText), 0);
    return { blocks, matchedByTitle: true, originalCharCount, blocksCharCount };
  }

  // ── 策略2：均分兜底 ────────────────────────────────────
  const boundaries = findSentenceBoundaries(originalText);
  const n = sections.length;
  const idealStep = originalText.length / n;
  const cutPoints: number[] = [0];
  for (let i = 1; i < n; i++) {
    const target = Math.round(idealStep * i);
    cutPoints.push(nearestBoundary(boundaries, target));
  }
  cutPoints.push(originalText.length);

  const dedupedCuts: number[] = [cutPoints[0]];
  for (let i = 1; i < cutPoints.length; i++) {
    dedupedCuts.push(Math.max(cutPoints[i], dedupedCuts[i - 1]));
  }

  const blocks: ContentBlock[] = [];
  for (let i = 0; i < n; i++) {
    const start = dedupedCuts[i];
    const end = dedupedCuts[i + 1];
    blocks.push({
      id: `block_${i + 1}`,
      sectionIndex: i + 1,
      rawText: originalText.slice(start, end),
    });
  }

  const blocksCharCount = blocks.reduce((sum, b) => sum + codepointLength(b.rawText), 0);
  return { blocks, matchedByTitle: false, originalCharCount, blocksCharCount };
}

// ── 完整性自检 ──────────────────────────────────────────────

export interface IntegrityCheckResult {
  ok: boolean;
  charDiff: number;
  hasBrokenSentence: boolean;
}

export function checkSplitIntegrity(
  result: SplitResult,
  maxCharDiffRatio = 0.01
): IntegrityCheckResult {
  const charDiff = Math.abs(result.originalCharCount - result.blocksCharCount);
  const diffRatio = result.originalCharCount === 0 ? 0 : charDiff / result.originalCharCount;
  const charOk = diffRatio <= maxCharDiffRatio;

  let hasBrokenSentence = false;
  const sentenceEndChars = new Set(["。", "！", "？", ".", "!", "?", "\n"]);
  for (let i = 0; i < result.blocks.length - 1; i++) {
    const cur = result.blocks[i].rawText;
    const lastChar = cur.trimEnd().slice(-1);
    if (cur.length > 0 && !sentenceEndChars.has(lastChar)) {
      hasBrokenSentence = true;
      break;
    }
  }

  return { ok: charOk && !hasBrokenSentence, charDiff, hasBrokenSentence };
}
