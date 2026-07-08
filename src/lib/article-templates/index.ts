import { TemplateId, TemplateRenderInput } from "@/types";
import { editorialHTML } from "./editorial";
import { tutorialMinimalHTML } from "./tutorial-minimal";

type RenderFn = (input: TemplateRenderInput) => string;

const TEMPLATE_REGISTRY: Record<TemplateId, RenderFn> = {
  editorial: editorialHTML,
  "tutorial-minimal": tutorialMinimalHTML,
};

export function renderArticle(templateId: TemplateId, input: TemplateRenderInput): string {
  const render = TEMPLATE_REGISTRY[templateId];
  if (!render) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  return render(input);
}

export function getAvailableTemplates(): TemplateId[] {
  return Object.keys(TEMPLATE_REGISTRY) as TemplateId[];
}
