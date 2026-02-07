/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Teal (#0D7377)
        primary: {
          DEFAULT: '#0d7477',
          50: '#E6F4F4',
          100: '#CCF0F0',
          200: '#99E0E0',
          300: '#66D0D0',
          400: '#33C0C0',
          500: '#0d7477',
          600: '#0A5F62',
          700: '#074547',
          800: '#052E2F',
          900: '#021718',
          950: '#010C0D',
        },
        // Background Colors
        background: {
          light: '#f6f8f8',
          soft: '#F8FAFA',
          white: '#FFFFFF',
          dark: '#112121',
          'dark-card': '#1a2e2e',
          'teal-wash': '#F0F7F7',
          'sage-light': '#E8F1F2',
        },
        // Text Colors
        text: {
          primary: '#0e1a1b',
          secondary: '#64748b',
          muted: '#94a3b8',
          white: '#FFFFFF',
        },
        // Semantic Colors
        success: {
          DEFAULT: '#22c55e',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#22c55e',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#f59e0b',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#ef4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          DEFAULT: '#0d7477',
          50: '#E6F4F4',
          100: '#CCF0F0',
          200: '#99E0E0',
          300: '#66D0D0',
          400: '#33C0C0',
          500: '#0d7477',
          600: '#0A5F62',
          700: '#074547',
          800: '#052E2F',
          900: '#021718',
        },
        // Border Colors
        border: {
          light: '#E5E9EB',
          DEFAULT: '#e2e8f0',
          primary: 'rgba(13, 116, 119, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Tajawal', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        arabic: ['Tajawal', 'sans-serif'],
      },
      fontSize: {
        // Mobile-First Scale from design tokens
        'xs': ['0.625rem', { lineHeight: '1.5' }],      // 10px
        'sm': ['0.75rem', { lineHeight: '1.5' }],       // 12px
        'base': ['0.875rem', { lineHeight: '1.5' }],    // 14px
        'md': ['1rem', { lineHeight: '1.5' }],          // 16px
        'lg': ['1.125rem', { lineHeight: '1.4' }],      // 18px
        'xl': ['1.25rem', { lineHeight: '1.3' }],       // 20px
        '2xl': ['1.5rem', { lineHeight: '1.25' }],      // 24px
        '3xl': ['1.75rem', { lineHeight: '1.2' }],      // 28px
        '4xl': ['2rem', { lineHeight: '1.15' }],        // 32px
        // Display sizes with responsive clamp
        'display': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'heading-1': ['clamp(1.75rem, 4vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        'heading-2': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading-3': ['clamp(1.25rem, 2.5vw, 1.5rem)', { lineHeight: '1.3' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '900',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.625',
      },
      letterSpacing: {
        tight: '-0.015em',
        normal: '0',
        wide: '0.05em',
        wider: '0.1em',
        widest: '0.2em',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '18': '72px',
        '20': '80px',
      },
      borderRadius: {
        'sm': '0.5rem',     // 8px
        'md': '0.75rem',    // 12px
        'lg': '1rem',       // 16px
        'xl': '1.5rem',     // 24px
        '2xl': '2rem',      // 32px
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.1)',
        'xl': '0 20px 25px -5px rgba(0,0,0,0.1)',
        'primary': '0 4px 14px rgba(13,116,119,0.25)',
        'ios': '0 2px 12px rgba(0,0,0,0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
      maxWidth: {
        'mobile': '480px',
        'tablet': '768px',
        'desktop': '1200px',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    function({ addComponents }) {
      addComponents({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.glass-dark': {
          background: 'rgba(17, 33, 33, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    },
  ],
}
