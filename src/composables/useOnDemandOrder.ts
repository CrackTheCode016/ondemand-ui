import type { PolkadotSigner } from 'polkadot-api'
import { ref } from 'vue'
import { polkadotSigner } from '~/utils/sdk-interface'
import { useConnect } from './useConnect'
import sdk from '~/utils/sdk'
import { getAccountFromMnemonic, isValidMnemonic } from '../utils/private-key-signer'

export function useOnDemandOrder() {
  const { selectedAccount } = useConnect()

  const isProcessing = ref(false)
  const result = ref('')
  const txHash = ref('')
  const isAutoMode = ref(false)
  const intervalId = ref<NodeJS.Timeout | null>(null)
  const orderCount = ref(0)
  const lastOrderTime = ref<Date | null>(null)
  const intervalSeconds = ref(30)
  
  // Auto-ordering mode
  const orderOnFinalization = ref(false) // true = order on finalization, false = order on interval
  
  // Private key signing mode for development
  const usePrivateKey = ref(false)
  const privateKeyMnemonic = ref('')
  const devAccount = ref<{ mnemonic: string; address: string; signer?: any } | null>(null)

  const setupPrivateKeySigning = (mnemonic: string) => {
    try {
      if (!isValidMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase. Must be 12-24 words.')
      }
      
      const account = getAccountFromMnemonic(mnemonic)
      console.log('Dev account address:', account.address)
      devAccount.value = account
      privateKeyMnemonic.value = mnemonic
      usePrivateKey.value = true
      
      result.value = `Development account configured: ${account.address.substring(0, 10)}...`
      return account
    } catch (error) {
      result.value = `Error setting up private key: ${error instanceof Error ? error.message : 'Unknown error'}`
      throw error
    }
  }

  const toggleSigningMode = () => {
    // v-model already handles the toggle, we just need to update state
    if (!usePrivateKey.value) {
      devAccount.value = null
      privateKeyMnemonic.value = ''
      result.value = 'Switched to wallet signing mode'
    } else {
      result.value = 'Switched to development signing mode'
    }
  }

  const placeOrder = async (paraId: number, maxAmount: number, keepAlive = true, isAuto = false) => {
    if (!isAuto) {
      isProcessing.value = true
      result.value = ''
      txHash.value = ''
    }

    try {
      let signer: any
      let addressToUse: string
      
      if (usePrivateKey.value && devAccount.value?.signer) {
        // Use development mode signer (bypasses wallet)
        signer = devAccount.value.signer
        addressToUse = devAccount.value.address
        
        if (!isAuto) {
          result.value = `🚧 DEV MODE: Signing with private key for Para ${paraId} (${maxAmount} PAS, ${keepAlive ? 'keep alive' : 'allow death'})`
        }
      } else {
        // Use wallet signer
        signer = await polkadotSigner()
        if (!signer || !selectedAccount.value) {
          result.value = usePrivateKey.value 
            ? '🚧 DEV MODE: No development signer configured. Set up mnemonic first.'
            : 'No wallet connected'
          if (!isAuto) {
            isProcessing.value = false
          }
          return
        }
        
        addressToUse = selectedAccount.value.address
        if (!isAuto) {
          result.value = `Placing order for Para ${paraId} with ${maxAmount} PAS (${keepAlive ? 'keep alive' : 'allow death'})`
        }
      }

      createOnDemandOrder(paraId, maxAmount, keepAlive, addressToUse, signer, {
        onTxHash: (hash) => {
          txHash.value = hash
          if (isAuto) {
            orderCount.value++
            lastOrderTime.value = new Date()
          }
        },
        onFinalized: () => {
          const prefix = usePrivateKey.value ? '🚧 DEV: ' : ''
          const message = isAuto 
            ? `${prefix}Auto order #${orderCount.value} completed (${new Date().toLocaleTimeString()})`
            : `${prefix}OnDemand order placed successfully!`
          result.value = message
          if (!isAuto) {
            isProcessing.value = false
          }
          
          // If auto-ordering on finalization, place next order immediately
          if (isAuto && orderOnFinalization.value && isAutoMode.value) {
            setTimeout(() => {
              placeOrder(paraId, maxAmount, keepAlive, true)
            }, 1000) // Small delay to show the completion message
          }
        },
        onError: (error) => {
          result.value = `Error: ${error}`
          if (!isAuto) {
            isProcessing.value = false
          }
          if (isAuto) {
            stopAutoOrdering()
          }
        },
      })
    }
    catch (err) {
      result.value = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      if (!isAuto) {
        isProcessing.value = false
      }
      if (isAuto) {
        stopAutoOrdering()
      }
    }
  }

  const startAutoOrdering = (paraId: number, maxAmount: number, keepAlive = true) => {
    if (intervalId.value) {
      stopAutoOrdering()
    }

    isAutoMode.value = true
    orderCount.value = 0
    
    if (orderOnFinalization.value) {
      result.value = `Auto-ordering started (on finalization)`
      // Place first order immediately - subsequent orders will be triggered on finalization
      placeOrder(paraId, maxAmount, keepAlive, true)
    } else {
      result.value = `Auto-ordering started (every ${intervalSeconds.value}s)`
      // Place first order immediately
      placeOrder(paraId, maxAmount, keepAlive, true)
      // Set up interval for subsequent orders
      intervalId.value = setInterval(() => {
        placeOrder(paraId, maxAmount, keepAlive, true)
      }, intervalSeconds.value * 1000)
    }
  }

  const stopAutoOrdering = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
    isAutoMode.value = false
    result.value = `Auto-ordering stopped. Total orders placed: ${orderCount.value}`
  }



  return {
    isProcessing,
    result,
    txHash,
    isAutoMode,
    orderCount,
    lastOrderTime,
    intervalSeconds,
    orderOnFinalization,
    usePrivateKey,
    privateKeyMnemonic,
    devAccount,
    placeOrder,
    startAutoOrdering,
    stopAutoOrdering,
    setupPrivateKeySigning,
    toggleSigningMode,
  }
}

export function createOnDemandOrder(
  paraId: number,
  maxAmountTokens: number,
  keepAlive: boolean,
  address = '',
  signer: PolkadotSigner,
  callbacks: {
    onTxHash: (hash: string) => void
    onFinalized: () => void
    onError: (error: string) => void
  },
) {
  const { api } = sdk('pas') // Use Paseo chain

  // Convert tokens to smallest unit (assuming 12 decimals for PAS)
  const maxAmount = BigInt(Math.floor(maxAmountTokens * 10 ** 12))

  // Choose the appropriate extrinsic based on keepAlive flag
  const tx = keepAlive
    ? api.tx.OnDemand.place_order_keep_alive({ max_amount: maxAmount, para_id: paraId })
    : api.tx.OnDemand.place_order_allow_death({ max_amount: maxAmount, para_id: paraId })

  const unsub = tx.signSubmitAndWatch(signer).subscribe({
    next: (event) => {
      if (event.type === 'txBestBlocksState' && event.found) {
        callbacks.onTxHash(event.txHash)
      }

      if (event.type === 'finalized') {
        callbacks.onFinalized()
        unsub.unsubscribe()
      }
    },
    error: (err) => {
      unsub.unsubscribe()
      console.error(err, address)
      callbacks.onError(err.message || 'Unknown error')
    },
  })
}