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
  needsAuthentication: boolean // New flag to indicate when user needs to authenticate
  needsRegistration: boolean // New flag to indicate when user needs to register
  userExists: boolean | null // Track if user exists in database
}

export function useAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    isRegistering: false,
    needsAuthentication: false,
    needsRegistration: false,
    userExists: null
  })

  // Check if user exists when wallet connects
  const checkUserExists = useCallback(async (walletAddress: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await apiClient.checkUser(walletAddress)
      
      if (response.success && response.data) {
        const { userExists } = response.data
        
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          userExists,
          needsRegistration: !userExists,
          needsAuthentication: userExists,
          error: null
        }))
        
        return { userExists }
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to check user status'
        }))
        return { userExists: false }
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check user status'
      }))
      return { userExists: false }
    }
  }, [])

  // Configure API client and check user when wallet connects
  useEffect(() => {
    if (isConnected && address && signMessageAsync) {
      const signWrapper = async (message: string) => {
        return await signMessageAsync({ message })
      }
      apiClient.setAuth(address, signWrapper)
      
      // Check if user exists immediately when wallet connects
      checkUserExists(address)
    } else {
      apiClient.clearAuth()
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        error: null,
        needsAuthentication: false,
        needsRegistration: false,
        userExists: null
      }))
    }
  }, [isConnected, address, signMessageAsync, checkUserExists])

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
          needsAuthentication: false,
          error: null
        }))
      } else {
        // User not registered yet
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: response.error || 'Failed to load profile'
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
          needsAuthentication: false,
          needsRegistration: false,
          userExists: true,
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
      isRegistering: false,
      needsAuthentication: false,
      needsRegistration: false,
      userExists: null
    })
  }, [])

  // Manual authentication function - user must explicitly call this
  const authenticate = useCallback(async () => {
    if (!isConnected || !address) {
      setAuthState(prev => ({ ...prev, error: 'Please connect your wallet first' }))
      return
    }
    
    try {
      // Simple authentication - no chain checks for fun app
      await loadProfile()
    } catch (error) {
      console.error('Authentication failed:', error)
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Authentication failed',
        isLoading: false
      }))
    }
  }, [isConnected, address, loadProfile])


  return {
    ...authState,
    register,
    authenticate,
    refreshProfile,
    logout,
    walletAddress: address,
    isWalletConnected: isConnected
  }
}
