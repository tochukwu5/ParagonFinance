# SendArc Backend

Node.js + MongoDB API for recording Arc Testnet transactions.

## Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB Atlas (mongoose)
- **Deployment:** Railway / Render (free tier)

## Arc Testnet Config
| Property | Value |
|----------|-------|
| Chain ID | 5042002 |
| RPC | https://rpc.testnet.arc.network |
| USDC Contract | 0x3600000000000000000000000000000000000000 |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com |

## Setup

```bash
cd sendarc-backend
npm install
cp .env.example .env
# Fill in your MONGODB_URI from MongoDB Atlas
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Server health check |
| POST | /api/testnet/transactions | Record a new transaction |
| GET | /api/testnet/transactions/:wallet | Get wallet transactions + stats |
| GET | /api/testnet/stats/:wallet | Get stats only |
| GET | /api/testnet/leaderboard | Global leaderboard |
| GET | /api/testnet/network-stats | Network-wide analytics |

## POST /api/testnet/transactions

```json
{
  "id": "TXN-ARC-1234567890",
  "hash": "0x7d4f2a8b...",
  "from": "0x3f4a...",
  "to": "0x8f2a...",
  "amount": 10.5,
  "gasCost": "0.000315",
  "gasUsed": 21000,
  "settlementTime": 780,
  "blockNumber": 1847293,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "status": "confirmed",
  "network": "Arc Testnet",
  "chainId": 5042002,
  "memo": "Test transfer",
  "walletAddress": "0x3f4a..."
}
```

## MongoDB Atlas Setup

1. Go to cloud.mongodb.com
2. Create a free M0 cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for Railway/Render)
5. Copy connection string to .env as MONGODB_URI

## Deploy to Railway (Free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
# MONGODB_URI, FRONTEND_URL, NODE_ENV=production
```

## Deploy to Render (Free)

1. Push backend to GitHub
2. Go to render.com → New Web Service
3. Connect your repo
4. Set Root Directory to `sendarc-backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables
