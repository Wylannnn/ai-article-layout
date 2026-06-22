/**
 * Card deck orchestration.
 *
 * 1. Parse sections from ArticleAnalysis
 * 2. Split into card pages using pagination logic
 * 3. Pick template type based on ContentCardStyle
 * 4. Generate complete HTML for each card
 * 5. Return CardPage[]
 */

import { ArticleAnalysis, CardPlatformPreset, CardPage, ContentCardStyle, CardTheme } from "@/types";
import { parseSection, splitSection, SectionChunk } from "./card-paginate";
import {
  coverCardHTML, articleCardHTML, stepsCardHTML, dataCardHTML, endingCardHTML,
  CardTemplateProps,
} from "./card-templates";

const CATEGORY_LABELS: Record<string, string> = {
  tech: "科技", finance: "财经", travel: "旅行",
  tutorial: "教程", story: "故事", news: "新闻",
};

function estimateReadTime(text: string): string {
  const wpm = 300;
  const chars = text.length;
  const minutes = Math.max(1, Math.round(chars / wpm));
  return `约 ${minutes} 分钟阅读`;
}

function pickContentStyle(style: ContentCardStyle, sectionText: string): ContentCardStyle {
  if (style !== "auto") return style;
  // Auto-detect: if section has numbered items -> steps
  const hasSteps = /(\d+[.、．]\s*|Step\s+\d+)/i.test(sectionText.slice(0, 200));
  if (hasSteps) return "steps";
  // If has numbers/data -> data
  const hasData = /(\d+[%x×]|\d+\.\d+|\d{3,})/.test(sectionText);
  if (hasData) return "data";
  return "article";
}

function buildArticleParas(chunk: SectionChunk): string {
  return chunk.paragraphs.map((p) => `<p>${escapeHTML(p)}</p>`).join("\n");
}

function buildStats(chunk: SectionChunk): { value: string; label: string }[] {
  const stats: { value: string; label: string }[] = [];
  for (const p of chunk.paragraphs) {
    const match = p.match(/([\d.]+[%x×]?)\s*[—\-–]\s*(.+)/);
    if (match) {
      stats.push({ value: match[1], label: match[2] });
    }
    if (stats.length >= 4) break;
  }
  return stats;
}

function buildSteps(chunk: SectionChunk): { num: number; heading: string; desc: string }[] {
  return chunk.steps ?? [];
}

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function propsFromTheme(width: number, height: number, theme: CardTheme): CardTemplateProps {
  return {
    width, height,
    primary: theme.primary,
    secondary: theme.secondary,
    bg: theme.bg,
    title: theme.title,
    text: theme.text,
    subtle: theme.subtle,
  };
}

export function buildCardDeck(
  analysis: ArticleAnalysis,
  articleText: string,
  platform: CardPlatformPreset,
  theme: CardTheme,
  contentStyle: ContentCardStyle,
  accountHandle: string,
  endingSlogan: string,
): CardPage[] {
  const pages: CardPage[] = [];
  const { width, height } = platform;
  const p = propsFromTheme(width, height, theme);

  // 1. Cover card
  const readTime = estimateReadTime(articleText);
  const categoryLabel = CATEGORY_LABELS[analysis.category] || analysis.category;
  pages.push({
    type: "cover",
    label: "封面",
    html: coverCardHTML(p, {
      categoryLabel,
      title: analysis.title,
      summary: analysis.summary,
      readTime,
      author: accountHandle || "AI 排版工具",
      keywords: analysis.keywords,
    }),
  });

  // 2. Content cards
  let totalChunks = 0;
  const allChunks: { chunk: SectionChunk; sectionText: string }[] = [];

  for (let i = 0; i < analysis.sections.length; i++) {
    const section = analysis.sections[i];
    const parsed = parseSection(section.content);
    const chunks = splitSection(parsed, i,
      contentStyle === "data" ? 400 : 600,
      section.title
    );
    for (const c of chunks) {
      allChunks.push({ chunk: c, sectionText: section.content });
    }
  }

  totalChunks = allChunks.length;

  for (let ci = 0; ci < allChunks.length; ci++) {
    const { chunk, sectionText } = allChunks[ci];
    const style = pickContentStyle(contentStyle, sectionText);

    switch (style) {
      case "steps": {
        const steps = buildSteps(chunk);
        if (steps.length > 0) {
          pages.push({
            type: "content",
            label: `${chunk.title}`,
            html: stepsCardHTML(p, {
              sectionIndex: ci,
              totalSections: totalChunks,
              title: chunk.title,
              steps,
            }),
          });
          break;
        }
        // fallthrough to article if no steps
      }
      case "data": {
        const stats = buildStats(chunk);
        if (stats.length > 0) {
          pages.push({
            type: "content",
            label: `${chunk.title}`,
            html: dataCardHTML(p, {
              sectionIndex: ci,
              totalSections: totalChunks,
              title: chunk.title,
              stats,
              paragraphs: buildArticleParas(chunk),
            }),
          });
          break;
        }
        // fallthrough
      }
      default: {
        pages.push({
          type: "content",
          label: `${chunk.title}`,
          html: articleCardHTML(p, {
            sectionIndex: ci,
            totalSections: totalChunks,
            title: chunk.title,
            paragraphs: buildArticleParas(chunk),
            quote: chunk.quote,
          }),
        });
      }
    }
  }

  // 3. Ending card
  pages.push({
    type: "ending",
    label: "结尾引导",
    html: endingCardHTML(p, {
      handle: accountHandle || "AI 排版工具",
      slogan: endingSlogan || "分享知识与思考，欢迎关注",
    }),
  });

  return pages;
}
