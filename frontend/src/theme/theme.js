/**
 * Ditya Birla Hybrid Theme Configuration
 * Light + Dark Mode | Balanced Spacing | Enterprise UI
 */

export const dibyaTheme = {
  colors: {
    // Primary Colors
    primary: {
      red: '#D71920',        // Capital Red
      maroon: '#7A1225',     // Corporate Maroon
    },
    // Secondary Colors
    secondary: {
      sand: '#F5E2C8',       // Warm Sand
      cream: '#FFF7F0',      // Cream
    },
    // Light Mode
    light: {
      background: '#FFF7F0',
      surface: '#F5E2C8',
      surfaceAlt: '#FBF7F2',
      text: '#1A1A1A',
      textSecondary: '#4A4A4A',
      textTertiary: '#8A8A8A',
      border: '#E5E7EB',
      divider: '#D1D5DB',
      shadow: 'rgba(0, 0, 0, 0.08)',
      hover: 'rgba(215, 25, 32, 0.05)',
      focus: 'rgba(215, 25, 32, 0.1)',
    },
    // Dark Mode
    dark: {
      background: '#0F0F0F',
      surface: '#1A1A1A',
      surfaceAlt: '#2D2D2D',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      textTertiary: '#B0B0B0',
      border: '#333333',
      divider: '#404040',
      shadow: 'rgba(0, 0, 0, 0.3)',
      hover: 'rgba(215, 25, 32, 0.15)',
      focus: 'rgba(215, 25, 32, 0.25)',
    },
    // Functional Colors
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  typography: {
    fontFamily: {
      primary: '"Segoe UI", "Helvetica Neue", sans-serif',
      code: '"Fira Code", monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '28px',
      '5xl': '32px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
};

export default dibyaTheme;
