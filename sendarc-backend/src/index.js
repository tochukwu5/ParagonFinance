import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import testnetRoutes from './routes/testnet.js'
import adminRoutes from './routes/admin.js'
import statsRoutes from './routes/stats.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ─── Security middleware ───────────────────────────────────────────────
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json({ limit: '10kb' }))

// CORS — allow production + localhost for local dev always
const PRODUCTION_ORIGINS = [
  'https://sendarc1.vercel.app',
  'https://sendarc.xyz',
  'https://www.sendarc.xyz',
  'https://sendarc1-production.up.railway.app',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, mobile)
    if (!origin) return callback(null, true)

    // Always allow localhost on any port for local development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true)
    }

    if (PRODUCTION_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS: ' + origin))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  credentials: true,
}))

// Handle preflight for all routes
app.options('*', cors())

// Rate limiting — 100 requests per 15 min per IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests — please try again later' },
}))

// ─── Routes ───────────────────────────────────────────────────────────
app.use('/api/testnet', testnetRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/stats', statsRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SendArc API',
    network: 'Arc Testnet · Chain 5042002',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'SendArc Backend API',
    version: '1.0.0',
    description: 'Node.js + MongoDB API for SendArc testnet transaction recording',
    endpoints: {
      health: 'GET /health',
      registerWallet: 'POST /api/testnet/wallet/register',
      recordTransaction: 'POST /api/testnet/transactions',
      getTransactions: 'GET /api/testnet/transactions/:walletAddress',
      getStats: 'GET /api/testnet/stats/:walletAddress',
      leaderboard: 'GET /api/testnet/leaderboard',
      networkStats: 'GET /api/testnet/network-stats',
    },
    arcTestnet: {
      chainId: 5042002,
      rpc: 'https://rpc.testnet.arc.network',
      explorer: 'https://testnet.arcscan.app',
    }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route ' + req.originalUrl + ' not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── MongoDB connection ────────────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'sendarc',
    })
    console.log('✅ MongoDB Atlas connected — sendarc database')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

// ─── Start server ─────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
🚀 SendArc Backend running on port ${PORT}
🌐 Arc Testnet · Chain ID: 5042002
📊 MongoDB: connected
🔗 RPC: https://rpc.testnet.arc.network
    `)
  })
})

export default app