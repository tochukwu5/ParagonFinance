/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        arc: {
          bg: '#0D1117',
          surface: '#0f1822',
          border: '#1e2530',
          cyan: '#00D4FF',
          'cyan-dim': '#0a2030',
          mint: '#00FFCC',
          green: '#22c55e',
          red: '#ef4444',
          amber: '#f59e0b',
          muted: '#8892a0',
        },
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(0,212,255,0.12), transparent)',
        'glow-bottom': 'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(0,80,255,0.1), transparent)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glowpulse 2s ease-in-out infinite',
        'fade-up': 'fadeup 0.6s ease forwards',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        glowpulse: { '0%,100%': { boxShadow: '0 0 12px rgba(0,212,255,0.3)' }, '50%': { boxShadow: '0 0 28px rgba(0,212,255,0.6)' } },
        fadeup: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};