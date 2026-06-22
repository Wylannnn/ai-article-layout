import { ArticleCategory, CARD_THEMES_BY_CATEGORY, CARD_THEMES_EXTRAS, CardTheme } from "@/types";

export function getCardTheme(themeId: string, category: ArticleCategory): CardTheme {
  if (themeId === "auto") {
    return CARD_THEMES_BY_CATEGORY[category];
  }
  const fromCategory = CARD_THEMES_BY_CATEGORY[themeId as ArticleCategory];
  if (fromCategory) return fromCategory;
  const fromExtra = CARD_THEMES_EXTRAS.find((t) => t.id === themeId);
  if (fromExtra) return fromExtra;
  return CARD_THEMES_BY_CATEGORY[category];
}

export function getThemeCSS(t: CardTheme): string {
  return `
    --card-primary: ${t.primary};
    --card-secondary: ${t.secondary};
    --card-bg: ${t.bg};
    --card-title: ${t.title};
    --card-text: ${t.text};
    --card-subtle: ${t.subtle};
  `;
}
