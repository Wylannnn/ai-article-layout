/**
 * Render card HTML to PNG using offscreen iframe + html-to-image.
 *
 * Reuses the same approach from exportPNG in page.tsx but simplified
 * for single-card rendering with no animation cleanup needed.
 */

export async function renderCardToDataUrl(html: string, width: number, height: number, pixelRatio: number = 2): Promise<string> {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.left = "-99999px";
  frame.style.top = "0";
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.border = "none";
  document.body.appendChild(frame);

  try {
    await new Promise<void>((resolve, reject) => {
      frame.onload = () => resolve();
      frame.onerror = () => reject(new Error("iframe load failed"));
      frame.srcdoc = html;
    });

    // Wait for fonts and layout settle
    const doc = frame.contentDocument!;
    await new Promise((r) => setTimeout(r, 300));
    if (doc.fonts?.ready) await doc.fonts.ready;
    await new Promise((r) => setTimeout(r, 150));

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(doc.body, {
      width,
      height,
      pixelRatio,
      cacheBust: true,
      backgroundColor: "#ffffff",
      style: { margin: "0", transform: "none" },
    });

    return dataUrl;
  } finally {
    document.body.removeChild(frame);
  }
}

/**
 * Render multiple cards and return data URLs.
 */
export async function renderCardDeck(
  pages: { id: string; label: string; html: string }[],
  width: number,
  height: number,
  onProgress?: (done: number, total: number) => void,
): Promise<{ id: string; label: string; dataUrl: string }[]> {
  const results: { id: string; label: string; dataUrl: string }[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const dataUrl = await renderCardToDataUrl(page.html, width, height);
    results.push({ id: page.id, label: page.label, dataUrl });
    onProgress?.(i + 1, pages.length);
  }

  return results;
}
