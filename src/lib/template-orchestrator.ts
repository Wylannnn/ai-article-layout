import { TemplateId, TemplateRenderInput } from "@/types";
import { ContentBlock } from "./content-blocks";
import { resolveArticleToken } from "./article-templates/design-tokens";
import { renderArticle } from "./article-templates";
import { analyzeArticleSemantics } from "./article-analysis";
// injectContentBlocks is NOT needed here — the template already renders all content blocks

export interface TemplateResult {
  html: string;
  semanticLayout: unknown;
  token: unknown;
}

export async function runTemplatePipeline(
  markdownText: string,
  contentBlocks: ContentBlock[],
  templateId: TemplateId,
  apiKey: string,
  provider: string,
  model?: string,
): Promise<TemplateResult> {
  const blocksForAI = contentBlocks.map((b) => ({
    id: b.id,
    sectionIndex: b.sectionIndex,
    rawText: b.rawText,
  }));

  const semantic = await analyzeArticleSemantics(
    markdownText,
    blocksForAI,
    apiKey,
    provider,
    model,
  );

  const token = resolveArticleToken(templateId);

  const input: TemplateRenderInput = {
    token,
    semantic,
    contentBlocks,
    metadata: {},
  };

  const html = renderArticle(templateId, input);

  return { html, semanticLayout: semantic, token };
}
