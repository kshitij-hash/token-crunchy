#!/usr/bin/env tsx

import { validateWeb3Config, isWeb3Configured, getTreasuryAddress } from '../lib/web3/monad-provider'
import { getTreasuryBalance, checkSufficientBalance } from '../lib/web3/treasury-wallet'

async function diagnoseWeb3Setup() {
  console.log('🔍 Diagnosing Web3 configuration...')
  
  // Check environment variables
  console.log('\n📋 Environment Variables:')
  console.log(`MONAD_RPC_URL: ${process.env.MONAD_RPC_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`TREASURY_PRIVATE_KEY: ${process.env.TREASURY_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`TOKEN_CONTRACT_ADDRESS: ${process.env.TOKEN_CONTRACT_ADDRESS ? '✅ Set' : '❌ Missing'}`)
  
  if (process.env.TOKEN_CONTRACT_ADDRESS) {
    console.log(`Token Contract: ${process.env.TOKEN_CONTRACT_ADDRESS}`)
  }
  
  // Validate configuration
  const validation = validateWeb3Config()
  console.log('\n🔧 Configuration Validation:')
  if (validation.isValid) {
    console.log('✅ All configuration is valid')
  } else {
    console.log('❌ Configuration issues found:')
    validation.errors.forEach(error => console.log(`   - ${error}`))
  }
  
  // Check if Web3 is configured
  const isConfigured = isWeb3Configured()
  console.log(`\n🌐 Web3 Configured: ${isConfigured ? '✅' : '❌'}`)
  
  // Get treasury address
  const treasuryAddress = getTreasuryAddress()
  console.log(`\n💰 Treasury Address: ${treasuryAddress || '❌ Not available'}`)
  
  if (!isConfigured) {
    console.log('\n❌ Web3 is not properly configured. Cannot proceed with balance checks.')
    return
  }
  
  try {
    // Check treasury balance
    console.log('\n💳 Checking treasury balance...')
    const balance = await getTreasuryBalance()
    console.log(`Native Balance (MON): ${balance.nativeBalanceFormatted}`)
    console.log(`Token Balance: ${balance.tokenBalanceFormatted}`)
    
    // Check if sufficient balance for a test transfer
    const testAmount = '100' // 100 tokens
    const hasSufficientBalance = await checkSufficientBalance(testAmount)
    console.log(`\n🧪 Sufficient balance for ${testAmount} tokens: ${hasSufficientBalance ? '✅' : '❌'}`)
    
    if (!hasSufficientBalance) {
      console.log('❌ Treasury does not have sufficient token balance for transfers')
      console.log('   This could be why database updates are not happening after scans')
    }
    
    // Check gas balance
    const minGasBalance = parseFloat(process.env.TREASURY_MIN_BALANCE || '0.1')
    const currentNativeBalance = parseFloat(balance.nativeBalanceFormatted)
    
    if (currentNativeBalance < minGasBalance) {
      console.log(`❌ Insufficient gas balance. Current: ${currentNativeBalance} MON, Required: ${minGasBalance} MON`)
    } else {
      console.log(`✅ Sufficient gas balance: ${currentNativeBalance} MON`)
    }
    
  } catch (error) {
    console.error('❌ Error checking treasury balance:', error)
    console.log('   This indicates a problem with the Web3 setup or network connection')
  }
  
  console.log('\n📝 Diagnosis Summary:')
  console.log('If transfers are failing and database is not updating:')
  console.log('1. Check that all environment variables are set correctly')
  console.log('2. Ensure treasury wallet has sufficient token balance')
  console.log('3. Ensure treasury wallet has sufficient MON for gas')
  console.log('4. Check network connectivity to Monad testnet')
  console.log('5. Verify token contract address is correct')
}

// Run diagnosis if this file is executed directly
if (require.main === module) {
  diagnoseWeb3Setup()
    .catch(console.error)
}

export { diagnoseWeb3Setup }
