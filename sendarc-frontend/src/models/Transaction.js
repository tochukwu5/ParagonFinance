import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  // Identity
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, lowercase: true, index: true },

  // On-chain data
  hash: { type: String, required: true },
  from: { type: String, required: true, lowercase: true },
  to: { type: String, required: true, lowercase: true },

  // Transfer details
  amount: { type: Number, required: true },
  gasCost: { type: String, default: '0.000000' },
  gasUsed: { type: Number, default: 0 },

  // Performance
  settlementTime: { type: Number, default: 0 }, // milliseconds
  blockNumber: { type: Number },
  timestamp: { type: String },

  // Status
  status: { type: String, enum: ['confirmed', 'pending', 'failed'], default: 'confirmed' },

  // Network
  network: { type: String, default: 'Arc Testnet' },
  chainId: { type: Number, default: 5042002 },

  // Optional
  memo: { type: String, default: '' },
  selfTransfer: { type: Boolean, default: false }, // sender == recipient

}, { timestamps: true })

// Index for fast lookups
transactionSchema.index({ walletAddress: 1, createdAt: -1 })
transactionSchema.index({ hash: 1 }, { unique: true, sparse: true })

export default mongoose.model('Transaction', transactionSchema)
