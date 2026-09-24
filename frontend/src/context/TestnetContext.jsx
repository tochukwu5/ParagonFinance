import { createContext, useContext, useState, useCallback } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

const TestnetContext = createContext(null)

export function TestnetProvider({ children }) {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    totalGasPaid: 0,
    avgSettlementTime: 0,
    successRate: 100,
    uniqueRecipients: 0,
    lastActivity: null,
  })
  const [leaderboard, setLeaderboard] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [backendOnline, setBackendOnline] = useState(false)

  const loadTransactions = useCallback(async (walletAddress) => {
    if (!walletAddress) return
    setIsSyncing(true)
    try {
      const url = API_BASE + '/testnet/transactions/' + walletAddress.toLowerCase()
      console.log('Loading transactions from:', url)
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        console.log('Loaded from MongoDB:', data)
        setTransactions(data.transactions || [])
        if (data.stats) {
          setStats({
            totalTransactions: data.stats.totalTransactions || 0,
            totalVolume: data.stats.totalVolume || 0,
            totalGasPaid: data.stats.totalGasPaid || 0,
            avgSettlementTime: data.stats.avgSettlementTime || 0,
            successRate: data.stats.successRate ?? 100,
            uniqueRecipients: data.stats.uniqueRecipients || 0,
            lastActivity: data.stats.lastActivity || null,
          })
        }
        setBackendOnline(true)
      } else {
        console.warn('Backend returned:', res.status)
        setBackendOnline(false)
      }
    } catch (err) {
      console.warn('loadTransactions failed:', err.message)
      setBackendOnline(false)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const recordTransaction = useCallback(async (tx, walletAddress) => {
    // Build the full transaction object the backend expects
    // from and to must be present — backend returns 400 without them
    const newTx = {
      ...tx,
      id: 'TXN-ARC-' + Date.now(),
      // Ensure from/to are always set — fall back to walletAddress if missing
      from: (tx.from || walletAddress).toLowerCase(),
      to: (tx.to || tx.recipient || walletAddress).toLowerCase(),
      walletAddress: walletAddress.toLowerCase(),
      createdAt: new Date().toISOString(),
    }

    // Update local state immediately
    setTransactions(prev => [newTx, ...prev])
    setStats(prev => {
      const newTotal = prev.totalTransactions + 1
      const newVol = prev.totalVolume + (tx.amount || 0)
      const newGas = prev.totalGasPaid + parseFloat(tx.gasCost || 0)
      const newAvg = prev.avgSettlementTime
        ? (prev.avgSettlementTime + (tx.settlementTime || 0)) / 2
        : tx.settlementTime || 0
      return {
        totalTransactions: newTotal,
        totalVolume: newVol,
        totalGasPaid: newGas,
        avgSettlementTime: newAvg,
        successRate: tx.status === 'confirmed'
          ? Math.round(((prev.confirmedCount || 0) + 1) / newTotal * 100)
          : prev.successRate,
        uniqueRecipients: prev.uniqueRecipients,
        lastActivity: new Date().toISOString(),
      }
    })

    // Save to MongoDB
    try {
      const url = API_BASE + '/testnet/transactions'
      console.log('Saving transaction to:', url, newTx)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      })
      if (res.ok) {
        console.log('Transaction saved to MongoDB ✅')
        setBackendOnline(true)
        // Reload fresh stats from MongoDB
        await loadTransactions(walletAddress)
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('MongoDB save failed ❌ Status:', res.status, 'Error:', errData)
        console.error('Payload that failed:', JSON.stringify(newTx, null, 2))
        setBackendOnline(false)
      }
    } catch (err) {
      console.warn('Backend sync failed:', err.message)
      setBackendOnline(false)
    }

    return newTx
  }, [loadTransactions])

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + '/testnet/leaderboard')
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (err) {
      console.warn('Leaderboard failed:', err.message)
    }
  }, [])

  return (
    <TestnetContext.Provider value={{
      transactions,
      stats,
      leaderboard,
      isSyncing,
      backendOnline,
      recordTransaction,
      loadTransactions,
      loadLeaderboard,
    }}>
      {children}
    </TestnetContext.Provider>
  )
}

export const useTestnet = () => {
  const ctx = useContext(TestnetContext)
  if (!ctx) throw new Error('useTestnet must be inside TestnetProvider')
  return ctx
}