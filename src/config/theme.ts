export const theme = {
  colors: {
    primary: '#111111',
    secondary: '#374151',
    background: '#ffffff',
    surface: '#FFFFFF',
    text: '#111111',
    textSecondary: '#4B5563',
    error: '#ef4444',
    success: '#111111',
    warning: '#F59E0B',
    border: '#D1D5DB',
    disabled: '#94a3b8',
  },
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};
