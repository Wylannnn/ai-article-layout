/**
 * Card pagination — split article content across multiple card pages.
 *
 * Strategy:
 * 1. Each section becomes one or more content cards
 * 2. For article/steps/data template, measure content height vs available
 *    card content area using real DOM rendering
 * 3. If a section overflows, split by paragraph first, then by sentence
 *
 * The measurement functions require a hidden DOM element to render into.
 */

export interface SplitResult {
  /** Each item represents one card's worth of section data */
  items: SectionChunk[];
  totalCards: number;
}

export interface SectionChunk {
  sectionIndex: number;
  title: string;
  /** For article/data: HTML paragraphs to render */
  paragraphs: string[];
  /** For steps: step items */
  steps?: { num: number; heading: string; desc: string }[];
  /** Pull quote from the section */
  quote?: string;
  /** Whether this chunk is a continuation of the previous */
  isContinuation: boolean;
}

interface SectionData {
  paragraphs: string[];
  /** Extractable step-like sub-items */
  steps?: { heading: string; desc: string }[];
}

/**
 * Parse raw section text into paragraphs and detect step-like content.
 */
export function parseSection(text: string): SectionData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const paragraphs: string[] = [];
  const steps: { heading: string; desc: string }[] = [];

  for (const line of lines) {
    // Detect numbered steps: "1. xxx" or "Step 1: xxx"
    const stepMatch = line.match(/^(?:\d+[.、．]|Step\s+\d+[:\-])\s*(.*?)[：:]\s*(.*)/);
    if (stepMatch && stepMatch[2]) {
      steps.push({ heading: stepMatch[1], desc: stepMatch[2] });
    } else {
      paragraphs.push(line);
    }
  }

  return { paragraphs, steps: steps.length > 0 ? steps : undefined };
}

/**
 * Extract a likely quote from paragraphs (text in quotes, or starts with ").
 */
export function extractQuote(paragraphs: string[]): { quote?: string; remaining: string[] } {
  const idx = paragraphs.findIndex(
    (p) => p.startsWith("\"") || p.startsWith("「") || p.startsWith("'")
  );
  if (idx === -1) return { remaining: paragraphs };
  const quote = paragraphs[idx].replace(/^["「'""]|["」'"".]$/g, "");
  const remaining = [...paragraphs.slice(0, idx), ...paragraphs.slice(idx + 1)];
  return { quote, remaining };
}

/**
 * Estimate whether content fits within available height.
 * Uses a simple conservative estimate based on line count.
 *
 * @param textContent - plain text content to measure
 * @param lineHeightPx - approximate line height in px (default 26)
 * @param availableHeight - available content area height in px
 * @param paddingPx - vertical padding to reserve (default 24)
 */
export function estimateFit(
  textContent: string,
  lineHeightPx: number = 26,
  availableHeight: number = 600,
  paddingPx: number = 24
): boolean {
  // Rough: each CJK char + space is ~1em wide, divide by chars per line
  const charsPerLine = 28; // ~14px font in 540px card
  const lines = textContent
    .split("\n")
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  const needed = lines * lineHeightPx + paddingPx;
  return needed <= availableHeight;
}

/**
 * Split section content across cards in-place.
 * Uses heuristic estimation (DOM measurement is done at render time).
 */
export function splitSection(
  section: SectionData,
  sectionIndex: number,
  maxCharsPerCard: number = 600,
  title?: string
): SectionChunk[] {
  const chunks: SectionChunk[] = [];
  const { quote, remaining } = extractQuote(section.paragraphs);

  if (section.steps && section.steps.length > 0) {
    // Steps mode — split steps across cards
    const perCard = 4; // max 4 steps per card
    for (let i = 0; i < section.steps.length; i += perCard) {
      chunks.push({
        sectionIndex,
        title: title || `第 ${sectionIndex + 1} 节`,
        paragraphs: [],
        steps: section.steps.slice(i, i + perCard).map((s, si) => ({
          num: i + si + 1,
          heading: s.heading,
          desc: s.desc,
        })),
        quote: i === 0 ? quote : undefined,
        isContinuation: i > 0,
      });
    }
    // If no steps and only paragraphs, fall through
    if (chunks.length > 0) return chunks;
  }

  // Article/data mode — split by paragraphs
  let currentParas: string[] = [];
  let currentLen = 0;

  for (const p of remaining) {
    if (currentLen + p.length > maxCharsPerCard && currentParas.length > 0) {
      chunks.push({
        sectionIndex,
        title: title || `第 ${sectionIndex + 1} 节`,
        paragraphs: currentParas,
        quote: chunks.length === 0 ? quote : undefined,
        isContinuation: chunks.length > 0,
      });
      currentParas = [];
      currentLen = 0;
    }
    currentParas.push(p);
    currentLen += p.length;
  }

  if (currentParas.length > 0) {
    chunks.push({
      sectionIndex,
      title: title || `第 ${sectionIndex + 1} 节`,
      paragraphs: currentParas,
      quote: chunks.length === 0 ? quote : undefined,
      isContinuation: chunks.length > 0,
    });
  }

  return chunks;
}
