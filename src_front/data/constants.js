// ─── WORLDWIDE SUPPORTED DESTINATIONS ────────────────────────────────
// SendArc supports global remittance — every continent represented
export const COUNTRIES = [

  // Americas
  { code: 'US', flag: '🇺🇸', name: 'United States', currency: 'USD', symbol: '$',   rate: 1,       region: 'Americas',     cashout: ['Bank Transfer (ACH)', 'PayPal', 'Cash App', 'Zelle'], status: 'live' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexico',       currency: 'MXN', symbol: '$',   rate: 17.15,   region: 'Americas',      cashout: ['Bitso', 'Mercado Pago', 'OXXO'],         status: 'live' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil',        currency: 'BRL', symbol: 'R$',  rate: 5.05,    region: 'Americas',      cashout: ['Mercado Bitcoin', 'Foxbit', 'Pix'],       status: 'live' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia',      currency: 'COP', symbol: '$',   rate: 3925,    region: 'Americas',      cashout: ['Buda', 'Decrypto', 'Bancolombia'],        status: 'live' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina',     currency: 'ARS', symbol: '$',   rate: 890,     region: 'Americas',      cashout: ['Ripio', 'Lemon', 'Buenbit'],              status: 'live' },

  // Africa
  { code: 'NG', flag: '🇳🇬', name: 'Nigeria',      currency: 'NGN', symbol: '₦',   rate: 1634.20, region: 'Africa',        cashout: ['Yellow Card', 'Mara', 'Binance P2P'],    status: 'live' },
  { code: 'GH', flag: '🇬🇭', name: 'Ghana',        currency: 'GHS', symbol: '₵',   rate: 15.20,   region: 'Africa',        cashout: ['Yellow Card', 'MTN MoMo', 'Mara'],       status: 'live' },
  { code: 'KE', flag: '🇰🇪', name: 'Kenya',        currency: 'KES', symbol: 'KSh', rate: 129.40,  region: 'Africa',        cashout: ['M-Pesa', 'Yellow Card', 'Mara'],         status: 'live' },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa', currency: 'ZAR', symbol: 'R',   rate: 18.40,   region: 'Africa',        cashout: ['Luno', 'VALR', 'Yellow Card'],            status: 'live' },
  { code: 'RW', flag: '🇷🇼', name: 'Rwanda',       currency: 'RWF', symbol: 'RWF', rate: 1310,    region: 'Africa',        cashout: ['MTN MoMo', 'Airtel Money'],               status: 'live' },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzania',     currency: 'TZS', symbol: 'TZS', rate: 2640,    region: 'Africa',        cashout: ['Vodacom M-Pesa', 'Airtel Money'],         status: 'live' },


  // Asia & Pacific
  { code: 'PH', flag: '🇵🇭', name: 'Philippines',  currency: 'PHP', symbol: '₱',   rate: 56.20,   region: 'Asia Pacific',  cashout: ['GCash', 'Maya', 'Coins.ph'],              status: 'live' },
  { code: 'IN', flag: '🇮🇳', name: 'India',         currency: 'INR', symbol: '₹',   rate: 83.40,   region: 'Asia Pacific',  cashout: ['WazirX', 'CoinDCX', 'UPI'],               status: 'live' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnam',       currency: 'VND', symbol: '₫',   rate: 24850,   region: 'Asia Pacific',  cashout: ['Remitano', 'VNDC', 'MoMo'],               status: 'live' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia',     currency: 'IDR', symbol: 'Rp',  rate: 15640,   region: 'Asia Pacific',  cashout: ['Tokocrypto', 'Indodax', 'GoPay'],         status: 'live' },

  // Europe
  { code: 'UA', flag: '🇺🇦', name: 'Ukraine',       currency: 'UAH', symbol: '₴',   rate: 37.20,   region: 'Europe',        cashout: ['Binance', 'WhiteBIT', 'Monobank'],        status: 'live' },
  { code: 'TR', flag: '🇹🇷', name: 'Turkey',        currency: 'TRY', symbol: '₺',   rate: 32.10,   region: 'Europe',        cashout: ['BtcTurk', 'Paribu', 'Bitexen'],           status: 'live' },

  // Middle East
  { code: 'PK', flag: '🇵🇰', name: 'Pakistan',      currency: 'PKR', symbol: '₨',   rate: 278.50,  region: 'Middle East',   cashout: ['Binance P2P', 'SadaPay', 'Easypaisa'],    status: 'live' },
  { code: 'EG', flag: '🇪🇬', name: 'Egypt',         currency: 'EGP', symbol: 'E£',  rate: 47.80,   region: 'Middle East',   cashout: ['Binance P2P', 'Coinbase', 'Vodafone Cash'],status: 'live' },

  // Coming soon
  { code: 'ET', flag: '🇪🇹', name: 'Ethiopia',      currency: 'ETB', symbol: 'ETB', rate: 0,       region: 'Africa',        cashout: [],                                         status: 'soon' },
  { code: 'SN', flag: '🇸🇳', name: 'Senegal',       currency: 'XOF', symbol: 'XOF', rate: 0,       region: 'Africa',        cashout: [],                                         status: 'soon' },
  { code: 'BD', flag: '🇧🇩', name: 'Bangladesh',    currency: 'BDT', symbol: '৳',   rate: 0,       region: 'Asia Pacific',  cashout: [],                                         status: 'soon' },
  { code: 'NP', flag: '🇳🇵', name: 'Nepal',         currency: 'NPR', symbol: '₨',   rate: 0,       region: 'Asia Pacific',  cashout: [],                                         status: 'soon' },
]

export const REGIONS = ['All', 'Americas', 'Africa', 'Asia Pacific', 'Europe', 'Middle East']

export const CHAINS = [
  { id: 'arc',      name: 'Arc Testnet',       badge: 'Recommended', fee: '$0.003',  time: '< 1s' },
  { id: 'eth',      name: 'Ethereum Sepolia',  badge: null,          fee: '~$0.50',  time: '~20s (via CCTP)' },
  { id: 'base',     name: 'Base Sepolia',      badge: null,          fee: '~$0.01',  time: '~5s (via CCTP)' },
  { id: 'arb',      name: 'Arbitrum Sepolia',  badge: null,          fee: '~$0.05',  time: '~8s (via CCTP)' },
]

export const MOCK_TRANSACTIONS = [
  { id: 'TXN-ARC-00847', to: '0x8f2a...4e91', country: { flag: '🇺🇸', name: 'United States' }, sent: 100,  received: '₦163,420', currency: 'NGN', fee: '$0.003', status: 'confirmed', time: '2m ago',    network: 'Arc Testnet', hash: '0x7d4f2a8b3c91e5f6a0d2...' },
  { id: 'TXN-ARC-00846', to: '0x2c9d...7f31', country: { flag: '🇬🇧', name: 'United Kingdom' }, sent: 250,  received: '₱14,050',  currency: 'PHP', fee: '$0.003', status: 'confirmed', time: '1hr ago',   network: 'Arc Testnet', hash: '0x3a1c9d2f8e4b7a6...' },
  { id: 'TXN-ARC-00845', to: '0x5b4e...1a20', country: { flag: '🇲🇽', name: 'Mexico' },         sent: 50,   received: '$857',     currency: 'MXN', fee: '$0.003', status: 'confirmed', time: '3hr ago',   network: 'Arc Testnet', hash: '0x9b2e4f1a7c3d8...' },
  { id: 'TXN-ARC-00844', to: '0x9a1f...3d88', country: { flag: '🇵🇭', name: 'Philippines' },    sent: 500,  received: '₱28,100',  currency: 'PHP', fee: '$0.003', status: 'confirmed', time: 'Yesterday', network: 'Arc Testnet', hash: '0x4d6a1e8f2c7b...' },
  { id: 'TXN-ARC-00843', to: '0x3e7c...9b42', country: { flag: '🇮🇳', name: 'India' },          sent: 200,  received: '₹16,680',  currency: 'INR', fee: '$0.003', status: 'pending',   time: 'Yesterday', network: 'Arc Testnet', hash: '0x2f8c4a9e1d5b...' },
]

export const WALLET_OPTIONS = [
  { id: 'metamask',     name: 'MetaMask',        color: '#e8821a', desc: 'Most popular browser wallet' },
  { id: 'walletconnect',name: 'WalletConnect',   color: '#1b6ef3', desc: 'Connect any mobile wallet' },
  { id: 'coinbase',     name: 'Coinbase Wallet', color: '#0052ff', desc: 'Easy onboarding for beginners' },
]

export const COMPETITORS = [
  { name: 'ParagonFinance (Arc Network)', fee: '$0.003', time: 'Under 1 second',      badge: 'best' },
  { name: 'Western Union',         fee: '~$5.00', time: '1–5 business days',   badge: 'bad' },
  { name: 'Bank Wire',             fee: '~$25.00',time: '2–5 business days',   badge: 'bad' },
  { name: 'PayPal',                fee: '~$4.99', time: '3–5 days to withdraw',badge: 'bad' },
]