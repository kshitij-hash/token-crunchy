/**
 * Authentication hook for Token Crunchies
 * Manages user authentication, registration, and profile state
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { apiClient, UserProfile } from '@/lib/api-client'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: UserProfile | null
  error: string | null
  isRegistering: boolean
}

export function useAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    isRegistering: false
  })

  // Configure API client when wallet connects
  useEffect(() => {
    if (isConnected && address && signMessageAsync) {
      const signWrapper = async (message: string) => {
        return await signMessageAsync({ message })
      }
      apiClient.setAuth(address, signWrapper)
    } else {
      apiClient.clearAuth()
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        error: null
      }))
    }
  }, [isConnected, address, signMessageAsync])

  // Load user profile when authenticated
  const loadProfile = useCallback(async () => {
    if (!isConnected || !address) return

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await apiClient.getProfile()
      
      if (response.success && response.data) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: response.data!.profile,
          isLoading: false,
          error: null
        }))
      } else {
        // User not registered yet
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: response.error === 'User not found. Please register first.' ? null : response.error || 'Failed to load profile'
        }))
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile'
      }))
    }
  }, [isConnected, address])

  // Register new user
  const register = useCallback(async (nickname: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConnected || !address) {
      return { success: false, error: 'Wallet not connected' }
    }

    setAuthState(prev => ({ ...prev, isRegistering: true, error: null }))

    try {
      const response = await apiClient.register(nickname)
      
      if (response.success && response.data) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: response.data!.user,
          isRegistering: false,
          error: null
        }))
        return { success: true }
      } else {
        setAuthState(prev => ({
          ...prev,
          isRegistering: false,
          error: response.error || 'Registration failed'
        }))
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setAuthState(prev => ({
        ...prev,
        isRegistering: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isConnected, address])

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (authState.isAuthenticated) {
      await loadProfile()
    }
  }, [authState.isAuthenticated, loadProfile])

  // Logout
  const logout = useCallback(() => {
    apiClient.clearAuth()
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      isRegistering: false
    })
  }, [])

  // Load profile when wallet connects
  useEffect(() => {
    if (isConnected && address && !authState.isLoading && !authState.isAuthenticated) {
      loadProfile()
    }
  }, [isConnected, address, authState.isLoading, authState.isAuthenticated, loadProfile])

  return {
    ...authState,
    register,
    refreshProfile,
    logout,
    walletAddress: address,
    isWalletConnected: isConnected
  }
}
