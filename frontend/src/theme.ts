import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0A0A0E',
  paper: '#121218',
  surface: '#1A1A24',
  surface2: '#222230',
  primary: '#D4AF37',
  primaryDim: 'rgba(212, 175, 55, 0.15)',
  primarySoft: 'rgba(212, 175, 55, 0.08)',
  secondary: '#8C92AC',
  accent: '#FFBF00',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A5',
  textDisabled: '#5A5A65',
  textInverse: '#000000',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  borderGold: 'rgba(212, 175, 55, 0.3)',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  fairnessHigh: '#4CAF50',
  fairnessMid: '#FFB300',
  fairnessLow: '#F44336',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 4, md: 8, lg: 16, xl: 24, pill: 9999 };

export const shadows = {
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ambient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const typography = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  bodyLg: { fontSize: 17, color: colors.textPrimary, lineHeight: 24 },
  body: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  bodyMuted: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  overline: { fontSize: 11, color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600' },
});

export const formatCurrency = (n: number): string => {
  if (!n && n !== 0) return '₹0';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

export const formatCurrencyFull = (n: number): string => {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
};

export const ASSET_CATEGORIES = [
  { key: 'property', label: 'Property', icon: 'home-outline' },
  { key: 'business', label: 'Business', icon: 'briefcase-outline' },
  { key: 'investment', label: 'Investment', icon: 'trending-up-outline' },
  { key: 'precious_metal', label: 'Precious Metals', icon: 'diamond-outline' },
  { key: 'other', label: 'Other', icon: 'cube-outline' },
] as const;

export const NEED_LEVELS = [
  { key: 'low', label: 'Low', color: colors.success },
  { key: 'medium', label: 'Medium', color: colors.warning },
  { key: 'high', label: 'High', color: colors.error },
] as const;
