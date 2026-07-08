import { ArticleCategory, CARD_THEMES_BY_CATEGORY, CARD_THEMES_EXTRAS, CardTheme, CardDesignToken } from "@/types";

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

/** Convert a legacy CardTheme into a CardDesignToken for the new template system */
export function themeToToken(theme: CardTheme): CardDesignToken {
  return {
    palette: {
      bg: theme.bg,
      surface: theme.subtle,
      title: theme.title,
      text: theme.text,
      subtle: theme.subtle,
      border: theme.subtle,
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.primary,
    },
    typography: {
      headingFamily: "Inter, -apple-system, sans-serif",
      bodyFamily: "Inter, -apple-system, sans-serif",
      headingWeight: 700,
      headingSize: 24,
      bodySize: 16,
      letterSpacing: "-0.01em",
      lineHeight: 1.6,
    },
    layout: {
      borderRadius: 20,
      cardPadding: 36,
      shadow: "0 4px 24px rgba(0,0,0,0.06)",
      topDecoration: "gradient",
      progressStyle: "number",
      coverStyle: "band-above",
    },
  };
}
