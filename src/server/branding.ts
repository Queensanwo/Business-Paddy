/** Business branding helpers (Phase 4b): presets, custom accents, contrast. */

export const THEMES = ['NAVY', 'SLATE', 'PLUM', 'TERRACOTTA'] as const;
export type ThemeName = (typeof THEMES)[number];

export const THEME_LABELS: Record<ThemeName, string> = {
  NAVY: 'Classic Navy',
  SLATE: 'Slate Blue and White',
  PLUM: 'Plum and Pearl',
  TERRACOTTA: 'Terracotta and Stone',
};

/** Curated accent suggestions (explicitly curated — not extracted from any logo). */
export const SUGGESTED_ACCENTS = [
  { hex: '#526BB1', label: 'Slate Blue' },
  { hex: '#7C3A63', label: 'Plum' },
  { hex: '#B4552D', label: 'Terracotta' },
];

export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(t);
  if (!m) return null;
  const h = m[1];
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `#${full.toUpperCase()}`;
}

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const f = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}

/** WCAG contrast of the accent against white button text. */
export function contrastOnWhite(hex: string): number {
  const l = luminance(hex);
  return 1.05 / (l + 0.05);
}

/** Accents must stay readable as white-text buttons (≥ 3:1). */
export function accentReadable(hex: string): boolean {
  return contrastOnWhite(hex) >= 3;
}
