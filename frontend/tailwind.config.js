import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
      'arc-mainnet': {
    id: 5042,
    chainIdHex: '0x13b2',
    name: 'Arc',
    appKitChain: 'Arc',
    symbol: 'USDC',
    rpcUrl: 'https://rpc.mainnet.arc.io',
    rpcUrls: [
      'https://rpc.mainnet.arc.io',
      'https://rpc.blockdaemon.mainnet.arc.io',
      'https://rpc.drpc.mainnet.arc.io',
      'https://rpc.quicknode.mainnet.arc.io',
    ],
    explorerUrl: 'https://explorer.arc.io',
    // USDC is the same predeploy on both networks. EURC is not.
    usdcAddress: '0x3600000000000000000000000000000000000000',
    eurcAddress: '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1',
    usycAddress: '0x8a5D989Bbb96929F689B0200f435f53dA42bF490',
    cctpDomain: 26,
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
    isMainnet: true,
    live: true,
    note: 'Arc mainnet · real funds',
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