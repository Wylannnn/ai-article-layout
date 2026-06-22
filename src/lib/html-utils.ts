/**
 * 清理AI输出中可能混入的Markdown代码块标记。
 * 即使system prompt明确要求"只输出HTML代码"，部分模型仍会习惯性地
 * 用 ```html ... ``` 包裹输出，必须在代码层面兜底清理。
 */
export function cleanHTMLOutput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^\s*```(?:html|HTML)?\s*\n?/, "");
  s = s.replace(/\n?\s*```\s*$/, "");
  return s.trim();
}

/**
 * 从AI返回的文本中提取JSON对象。
 * 部分模型会在JSON前后附加对话文本（如"好的，这里是分析结果："），
 * 此函数定位第一个 { 和最后一个 } 并提取中间内容。
 */
export function extractJSON(raw: string): string {
  const cleaned = raw.replace(/```json|```/g, "").trim();

  // 尝试多个 { 起点，找到最大的平衡 JSON 对象
  // 避免模型在 JSON 前后附加文字导致 first-{/last-} 策略误判
  let best = "";
  let pos = 0;
  while (true) {
    const start = cleaned.indexOf("{", pos);
    if (start === -1) break;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\" && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { const candidate = cleaned.slice(start, i + 1); if (candidate.length > best.length) best = candidate; pos = start + 1; break; } }
    }
    if (depth !== 0) break;
  }
  return best;
}

export function insertImagesIntoHTML(
  html: string,
  images: { dataUrl: string; sectionIndex: number /* 0=封面图, >=1=对应位置 */ }[]
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  for (const img of images) {
    let container: Element | null = null;

    if (img.sectionIndex === 0) {
      // 封面图：插入到第一个 data-section 容器之前（文章顶部）
      const firstSection = doc.querySelector("[data-section]");
      if (firstSection) {
        container = firstSection.parentElement;
        // 在第一个 section 之前插入
        const figure = buildFigure(doc, img.dataUrl);
        firstSection.parentElement?.insertBefore(figure, firstSection);
      }
      continue;
    }

    container = doc.querySelector(`[data-section="${img.sectionIndex}"]`);
    if (!container) continue;

    const figure = buildFigure(doc, img.dataUrl);
    container.appendChild(figure);
  }

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

function buildFigure(doc: Document, dataUrl: string): HTMLElement {
  const figure = doc.createElement("figure");
  figure.style.cssText = "margin:24px 0;";
  const el = doc.createElement("img");
  el.src = dataUrl;
  el.style.cssText =
    "width:100%;max-width:100%;border-radius:12px;display:block;box-shadow:0 2px 12px rgba(0,0,0,0.08);";
  el.alt = "";
  figure.appendChild(el);
  return figure;
}
