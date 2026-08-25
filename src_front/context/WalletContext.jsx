import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useArcTestnet } from '../hooks/useArcTestnet'

const WalletContext = createContext(null)

// This provider wraps useArcTestnet and exposes a unified wallet object
// so the rest of the app (Dashboard, Sidebar, etc) can just do useWallet()
export function WalletProvider({ children }) {
   const {
    account,
    balance,
    isConnected,
    isAutoConnecting,
    walletId,
    connect: arcConnect,
    disconnect: arcDisconnect,
  } = useArcTestnet()

  // Build the wallet object that the rest of the app expects
   const wallet = isConnected && account
    ? {
        address: account,
        shortAddress: account.slice(0, 6) + '...' + account.slice(-4),
        balance: parseFloat(balance).toFixed(2),
        network: 'Arc Testnet',
        // Was hardcoded — so a Rabby user's wallet object claimed MetaMask.
        provider: walletId || 'metamask',
      }
    : null

  const connect = useCallback(async (providerType) => {
    // Only MetaMask is supported right now
    // WalletConnect and Coinbase coming soon
    if (providerType !== 'metamask') {
      throw new Error('Only MetaMask is supported right now. WalletConnect and Coinbase coming soon.')
    }
    const result = await arcConnect()
    if (!result) throw new Error('MetaMask connection failed or was rejected.')
    return result
  }, [arcConnect])

  const disconnect = useCallback(async () => {
    await arcDisconnect()
  }, [arcDisconnect])

  return (
    <WalletContext.Provider value={{
      wallet,
      connect,
      disconnect,
      isConnected,
      isAutoConnecting,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}