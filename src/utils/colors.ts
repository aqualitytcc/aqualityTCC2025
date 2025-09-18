// Water Monitoring System Design System - Blue aquatic theme
export const colors = {
  background: '#F7FBFF',
  foreground: '#1A2332',
  water: {
    primary: '#3B82F6',
    secondary: '#DBEAFE',
    accent: '#0EA5E9',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  card: '#FFFFFF',
  cardForeground: '#1A2332',
  cardHover: '#F7F7F7',
  primary: '#3B82F6',
  primaryForeground: '#FFFFFF',
  primaryMuted: '#DBEAFE',
  secondary: '#F1F5F9',
  secondaryForeground: '#1A2332',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  accent: '#0EA5E9',
  accentForeground: '#FFFFFF',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  border: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#3B82F6',
};

export const applyTheme = (mode: 'light') => {
  // Não faz nada, pois só temos o tema claro agora
};

export const gradients = {
  primary: ['#3B82F6', '#0EA5E9'],
  background: ['#DBEAFE', '#F7FBFF'],
  card: ['#FFFFFF', '#F7F7F7'],
} as const;

export const shadows = {
  card: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  cardHover: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 35,
    elevation: 12,
  },
  button: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;
