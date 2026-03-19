/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Apple-style dark palette
        black: '#000000',
        surface: {
          DEFAULT: '#111111',
          elevated: '#1a1a1a',
          hover: '#222222',
        },
        // Keep navy aliases for backward compat (maps to surface)
        navy: {
          950: '#000000',
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#2a2a2a',
        },
        accent: '#2997ff',
        positive: '#30d158',
        warning: '#ff9f0a',
        danger: '#ff453a',
        apple: {
          blue: '#2997ff',
          green: '#30d158',
          orange: '#ff9f0a',
          red: '#ff453a',
          gray: '#86868b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'orb-float': 'orbFloat 8s ease-in-out infinite',
        'orb-float-alt': 'orbFloat 10s ease-in-out infinite reverse',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg': '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-blue': '0 0 40px rgba(41,151,255,0.15)',
        'glow-green': '0 0 40px rgba(48,209,88,0.15)',
        'card': '0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
