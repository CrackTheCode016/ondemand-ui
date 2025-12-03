import { ref, onMounted, onUnmounted } from 'vue'
import sdk from '~/utils/sdk'

export function useBalances(address: string | null) {
  const educhainBalance = ref<string>('0')
  const assetHubBalance = ref<string>('0')
  const isLoading = ref(false)

  let educhainUnsub: any = null
  let assetHubUnsub: any = null

  const formatBalance = (balance: bigint, decimals: number = 10): string => {
    const value = Number(balance) / Math.pow(10, decimals)
    return value.toFixed(2)
  }

  const subscribeToBalances = async () => {
    if (!address) {
      educhainBalance.value = '0'
      assetHubBalance.value = '0'
      return
    }

    isLoading.value = true

    try {
      // Subscribe to EduChain balance
      const { api: educhainApi } = sdk('educhain')
      educhainUnsub = educhainApi.query.System.Account.watchValue(address).subscribe({
        next: (account) => {
          educhainBalance.value = formatBalance(account.data.free)
        },
        error: (err) => {
          console.error('EduChain balance subscription error:', err)
          educhainBalance.value = '0'
        }
      })

      // Subscribe to AssetHub balance
      const { api: assetHubApi } = sdk('pas_asset_hub')
      assetHubUnsub = assetHubApi.query.System.Account.watchValue(address).subscribe({
        next: (account) => {
          assetHubBalance.value = formatBalance(account.data.free)
        },
        error: (err) => {
          console.error('AssetHub balance subscription error:', err)
          assetHubBalance.value = '0'
        }
      })
    } catch (err) {
      console.error('Failed to subscribe to balances:', err)
    } finally {
      isLoading.value = false
    }
  }

  const unsubscribe = () => {
    if (educhainUnsub) {
      educhainUnsub.unsubscribe()
      educhainUnsub = null
    }
    if (assetHubUnsub) {
      assetHubUnsub.unsubscribe()
      assetHubUnsub = null
    }
  }

  onMounted(() => {
    subscribeToBalances()
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return {
    educhainBalance,
    assetHubBalance,
    isLoading,
    refresh: subscribeToBalances
  }
}
