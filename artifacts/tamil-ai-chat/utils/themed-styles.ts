import { StyleSheet } from 'react-native';
import themeTokens from '../constants/colors';

const C = themeTokens.dark;
const tokenColorValues = new Set(
  Object.values(C)
    .filter((value): value is string => typeof value === 'string')
    .map(value => value.toLowerCase().replace(/\s+/g, '')),
);

const legacyColorTokens: Record<string, string> = {
  '#fff': C.textPrimary,
  '#ffffff': C.textPrimary,
  '#000': C.bgDeep,
  '#000000': C.bgDeep,
  '#111': C.bgPrimary,
  '#222': C.bgTertiary,
  '#333': C.bgTertiary,
  '#444': C.buttonSecondary,
  '#555': C.textMuted,
  '#666': C.textTertiary,
  '#777': C.textMuted,
  '#888': C.textMuted,
  '#999': C.textMuted,
  '#aaa': C.textTertiary,
  '#ccc': C.textSecondary,
  '#ddd': C.border,
  '#eee': C.borderSubtle,
  '#1a1a1a': C.bgTertiary,
  '#1a1a2e': C.bgPrimary,
  '#1a1a4a': C.card,
  '#1a2340': C.bgSecondary,
  '#1e1e1e': C.bgPrimary,
  '#2a1a1a': C.card,
  '#16213e': C.card,
  '#2a2a2a': C.cardSecondary,
  '#2a2a4a': C.cardElevated,
  '#2d2b55': C.cardElevated,
  '#3a2414': C.card,
  '#0d1117': C.bgPrimary,
  '#0f0f1a': C.bgPrimary,
  '#0f172a': C.bgPrimary,
  '#0d1b2a': C.panelDark,
  '#0d2137': C.panelDark,
  '#0a2540': C.panelDark,
  '#064e3b': C.panelDark,
  '#10243d': C.panelDark,
  '#111827': C.card,
  '#111e2e': C.card,
  '#1f2937': C.cardSecondary,
  '#374151': C.cardElevated,
  '#1e3a5f': C.cyanBorder,
  '#20233a': C.card,
  '#e5e7eb': C.textSecondary,
  '#e2e8f0': C.textPrimary,
  '#e9d5ff': C.goldLight,
  '#c4b5fd': C.goldLight,
  '#f0f0f0': C.borderSubtle,
  '#f3f3f3': C.card,
  '#f5f5f5': C.textPrimary,
  '#f6c453': C.goldBright,
  '#fecaca': C.error,
  '#7f1d1d': C.error,
  '#4a1d96': C.goldDark,
  '#5e35b1': C.goldDark,
  '#6c63ff': C.goldPrimary,
  '#7c3aed': C.cyanPrimary,
  '#e67e22': C.goldPrimary,
  '#e8821a': C.goldPrimary,
  '#b56b2a': C.goldBorder,
  '#ffd700': C.goldBright,
  '#ff6b35': C.goldPrimary,
  '#ff9800': C.warning,
  '#1565c0': C.cyanDark,
  '#4a90d9': C.cyanPrimary,
  '#60a5fa': C.cyanPrimary,
  '#58a6ff': C.cyanBright,
  '#93c5fd': C.cyanLight,
  '#3498db': C.cyanPrimary,
  '#0d6e7a': C.cyanDark,
  '#245a91': C.cyanBorder,
  '#e91e63': C.goldPrimary,
  '#e91e8c': C.goldPrimary,
  '#9c27b0': C.goldDark,
  '#8e6bbe': C.goldDark,
  '#9b59b6': C.goldDark,
  '#8e44ad': C.goldDark,
  '#d81b60': C.goldPrimary,
  '#c0392b': C.error,
  '#c62828': C.error,
  '#b71c1c': C.error,
  '#27ae60': C.success,
  '#00c853': C.success,
  '#10b981': C.success,
  '#25d366': C.success,
  '#1b5e20': C.success,
  '#075e54': C.cyanDark,
  '#00897b': C.cyanPrimary,
  '#128c7e': C.cyanPrimary,
  '#86efac': C.success,
  '#7cffb2': C.success,
  '#6b7280': C.textMuted,
  '#64748b': C.textTertiary,
  '#94a3b8': C.textTertiary,
  '#9ca3af': C.textTertiary,
  '#f87171': C.error,
  '#ffd7a0': C.goldLight,
  'rgba(0,0,0,0.4)': C.overlay,
  'rgba(0,0,0,0.5)': C.overlay,
  'rgba(0,0,0,0.55)': C.overlay,
  'rgba(0,0,0,0.6)': C.overlay,
  'rgba(0,0,0,0.75)': C.overlay,
  'rgba(0,0,0,0.76)': C.overlay,
  'rgba(0,0,0,0.85)': C.overlay,
  'rgba(0,0,0,0.95)': C.overlay,
  'rgba(21,101,192,0.35)': C.cyanSoft,
  'rgba(21,101,192,0.45)': C.cyanGlow,
  'rgba(255,255,255,0.1)': C.borderSubtle,
  'rgba(255,255,255,0.3)': C.border,
  'rgba(255,255,255,0.35)': C.border,
  'rgba(255,255,255,0.6)': C.glassCyanBorder,
  'rgba(255,255,255,0.7)': C.textSecondary,
};

function mapLegacyColorValues(value: unknown): unknown {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().replace(/\s+/g, '');
    const mapped = legacyColorTokens[normalized];
    if (mapped) return mapped;
    if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$|^rgba?\(/.test(normalized) && !tokenColorValues.has(normalized)) {
      throw new Error(`Unmapped color "${value}" in a themed StyleSheet; use a shared color token.`);
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(mapLegacyColorValues);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, mapLegacyColorValues(nested)]),
    );
  }
  return value;
}

/** Migrate existing screen StyleSheets to the shared palette without changing layout. */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(styles: T): T {
  return StyleSheet.create(mapLegacyColorValues(styles) as T);
}
