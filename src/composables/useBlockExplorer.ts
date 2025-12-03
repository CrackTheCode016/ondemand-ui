import { ref, onMounted, onUnmounted } from 'vue'
import sdk from '~/utils/sdk'

interface NetworkStats {
  currentBlock: number
  lastBlockTime: Date | null
  isConnected: boolean
  totalBlocks: number
}

export function useBlockExplorer() {
  const { api } = sdk('educhain')
  
  const isLoading = ref(true)
  const error = ref('')
  const networkStats = ref<NetworkStats>({
    currentBlock: 0,
    lastBlockTime: null,
    isConnected: false,
    totalBlocks: 0
  })

  let unsubscriber: any = null

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
  }

  const subscribeToNewBlocks = () => {
    try {
      unsubscriber = api.query.System.Number.watchValue('best').subscribe({
        next: (blockNumber) => {
          networkStats.value.currentBlock = blockNumber
          networkStats.value.lastBlockTime = new Date()
          networkStats.value.isConnected = true
          networkStats.value.totalBlocks++
        },
        error: (err) => {
          console.error('Block subscription error:', err)
          error.value = 'Connection lost'
          networkStats.value.isConnected = false
        }
      })
    } catch (err) {
      console.error('Subscription setup error:', err)
      error.value = 'Failed to connect to network'
    }
  }

  const initialize = async () => {
    try {
      isLoading.value = true
      error.value = ''

      // Get current block number
      const blockNumber = await api.query.System.Number.getValue()
      
      networkStats.value.currentBlock = blockNumber
      networkStats.value.lastBlockTime = new Date()
      networkStats.value.isConnected = true

      // Subscribe to new blocks
      subscribeToNewBlocks()
      
      isLoading.value = false
    } catch (err) {
      console.error('Block explorer initialization error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to connect to EduChain'
      networkStats.value.isConnected = false
      isLoading.value = false
    }
  }

  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    if (unsubscriber) {
      unsubscriber.unsubscribe()
    }
  })

  return {
    isLoading,
    error,
    networkStats,
    formatTime,
    refresh: initialize
  }
}