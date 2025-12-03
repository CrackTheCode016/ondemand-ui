<template>
  <div class="w-full max-w-[1400px] mx-auto px-4 space-y-4">
    <!-- Consolidated Header -->
    <div class="bg-black border-2 border-[#A8E000] p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/img/logo.png" alt="EduChain" class="w-10 h-10" />
          <div>
            <h1 class="text-2xl font-bold text-[#A8E000] uppercase tracking-tight">
              EduChain Control Panel
            </h1>
            <p class="text-[#A8E000]/60 font-mono text-xs mt-1">
              Para 4883
            </p>
          </div>
        </div>
        
        <!-- Network Status Inline -->
        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-3 text-xs font-mono">
            <div class="text-center">
              <div class="text-[#A8E000]/60 uppercase mb-1">Block</div>
              <div class="text-[#A8E000] font-bold">
                {{ networkStats.currentBlock ? `#${networkStats.currentBlock.toLocaleString()}` : '—' }}
              </div>
            </div>
            <div class="w-px h-8 bg-[#333333]"></div>
            <div class="text-center">
              <div class="text-[#A8E000]/60 uppercase mb-1">Received</div>
              <div class="text-[#A8E000] font-bold">{{ networkStats.totalBlocks }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div :class="[
              'w-2 h-2',
              networkStats.isConnected ? 'bg-[#A8E000] shadow-[0_0_10px_#A8E000]' : 'bg-[#ff0000]'
            ]" />
            <span class="text-xs font-mono text-[#A8E000]/80 uppercase">
              {{ networkStats.isConnected ? 'Online' : 'Offline' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Explorer Link -->
      <div class="mt-3 pt-3 border-t border-[#333333]">
        <a 
          href="https://dev.papi.how" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-[#A8E000]/60 hover:text-[#A8E000] font-mono text-xs transition-colors"
        >
          <span class="icon-[mdi--open-in-new] w-3 h-3" />
          Full Explorer: dev.papi.how
        </a>
      </div>
    </div>

    <!-- Main Grid: OnDemand & Transfers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- OnDemand Orders -->
      <div class="space-y-3">
        <div class="border border-[#333333] bg-[#0a0a0a] p-4">
          <h2 class="font-bold font-mono text-[#A8E000] uppercase tracking-wide flex items-center gap-2 mb-4">
            <span class="icon-[mdi--lightning-bolt] w-5 h-5" />
            OnDemand Orders
          </h2>
          
          <form @submit.prevent="submitOrder" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-mono font-bold text-[#A8E000]/80 mb-2 uppercase">Para ID</label>
                <input
                  v-model="paraId"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 border border-[#333333] bg-black text-[#A8E000] font-mono text-sm focus:border-[#A8E000] focus:outline-none"
                  placeholder="1000"
                  required
                >
              </div>
              <div>
                <label class="block text-xs font-mono font-bold text-[#A8E000]/80 mb-2 uppercase">Amount (PAS)</label>
                <input
                  v-model="maxAmount"
                  type="number"
                  step="0.001"
                  min="0"
                  class="w-full px-3 py-2 border border-[#333333] bg-black text-[#A8E000] font-mono text-sm focus:border-[#A8E000] focus:outline-none"
                  placeholder="10.0"
                  required
                >
              </div>
            </div>

            <div class="flex items-center">
              <input
                id="keepAlive"
                v-model="keepAlive"
                type="checkbox"
                class="h-4 w-4 accent-[#A8E000]"
              >
              <label for="keepAlive" class="ml-2 text-xs font-mono text-[#A8E000]/80">Keep account alive</label>
            </div>

            <div class="border-t border-[#333333] pt-4 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-mono font-bold text-[#A8E000] uppercase">Auto-Order</h3>
                <input
                  v-model="intervalSeconds"
                  type="number"
                  min="5"
                  max="3600"
                  :disabled="isAutoMode || orderOnFinalization"
                  class="w-16 px-2 py-1 text-xs border border-[#333333] bg-black text-[#A8E000] font-mono focus:border-[#A8E000] focus:outline-none disabled:opacity-50"
                  title="Interval in seconds"
                >
              </div>

              <div class="flex items-center gap-3 text-xs font-mono">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="orderOnFinalization"
                    :value="false"
                    type="radio"
                    :disabled="isAutoMode"
                    class="mr-1 accent-[#A8E000]"
                    name="orderingMode"
                  >
                  <span :class="isAutoMode ? 'text-[#A8E000]/40' : 'text-[#A8E000]/80'">Interval</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="orderOnFinalization"
                    :value="true"
                    type="radio"
                    :disabled="isAutoMode"
                    class="mr-1 accent-[#A8E000]"
                    name="orderingMode"
                  >
                  <span :class="isAutoMode ? 'text-[#A8E000]/40' : 'text-[#A8E000]/80'">On Finalization</span>
                </label>
              </div>

              <div v-if="isAutoMode" class="bg-black border border-[#A8E000] p-2">
                <div class="text-xs font-mono text-[#A8E000]">
                  {{ orderOnFinalization ? 'Auto (finalization)' : `Auto (${intervalSeconds}s)` }} • {{ orderCount }} orders
                  <span v-if="lastOrderTime" class="text-[#A8E000]/60"> • {{ formatTime(lastOrderTime) }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                type="submit"
                :disabled="(!selectedAccount && !devAccount?.signer) || isProcessing || isAutoMode"
                class="flex-1 py-2 px-3 border border-[#A8E000] text-[#A8E000] hover:bg-[#A8E000] hover:text-black font-mono text-xs font-bold uppercase transition-colors disabled:opacity-50"
              >
                {{ isProcessing ? 'Processing...' : 'Order' }}
              </button>
              <button
                type="button"
                @click="toggleAutoOrdering"
                :disabled="(!selectedAccount && !devAccount?.signer) || !paraId || !maxAmount"
                :class="isAutoMode ? 'border-[#ff0000] text-[#ff0000] hover:bg-[#ff0000]' : 'border-[#A8E000] text-[#A8E000] hover:bg-[#A8E000]'"
                class="flex-1 py-2 px-3 border hover:text-black font-mono text-xs font-bold uppercase transition-colors disabled:opacity-50"
              >
                {{ isAutoMode ? 'Stop' : 'Auto' }}
              </button>
            </div>

            <div v-if="orderResult || orderTxHash" class="space-y-2">
              <div v-if="orderTxHash" class="text-xs font-mono">
                <a :href="explorerDetail('pas', orderTxHash)" target="_blank" class="text-[#A8E000] hover:text-[#A8E000]/80 underline break-all">
                  SubScan: {{ orderTxHash.substring(0, 20) }}...
                </a>
              </div>
              <div v-if="orderResult" :class="getOrderResultClass()" class="text-xs font-mono p-2 border">
                {{ orderResult }}
              </div>
            </div>
          </form>
        </div>

        <!-- Dev Mode -->
        <div class="border border-[#ffff00] bg-[#0a0a0a] p-3">
          <div class="flex items-center mb-2">
            <input
              id="usePrivateKey"
              v-model="usePrivateKey"
              type="checkbox"
              class="h-4 w-4 accent-[#ffff00]"
              @change="onPrivateKeyToggle"
            >
            <label for="usePrivateKey" class="ml-2 text-xs font-mono font-bold text-[#ffff00] uppercase">⚠ Dev Mode</label>
          </div>
          
          <div v-if="usePrivateKey" class="space-y-2">
            <textarea
              v-model="privateKeyMnemonic"
              rows="2"
              class="w-full px-2 py-1 border border-[#333333] bg-black text-[#A8E000] font-mono text-xs focus:border-[#ffff00] focus:outline-none"
              placeholder="Enter mnemonic..."
            />
            <button
              @click="setupDevAccount"
              :disabled="!privateKeyMnemonic.trim()"
              class="border border-[#ffff00] px-3 py-1 text-[#ffff00] hover:bg-[#ffff00] hover:text-black font-mono text-xs font-bold uppercase transition-colors disabled:opacity-50"
            >
              Set Context
            </button>
            <div v-if="devAccount" class="text-xs font-mono text-[#ffff00] bg-black border border-[#333333] p-2 break-all">
              {{ devAccount.address }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reserve Transfers -->
      <div class="border border-[#333333] bg-[#0a0a0a] p-4">
        <h2 class="font-bold font-mono text-[#A8E000] uppercase tracking-wide flex items-center gap-2 mb-4">
          <span class="icon-[mdi--swap-horizontal] w-5 h-5" />
          Reserve Transfers
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-mono font-bold text-[#A8E000]/80 mb-2 uppercase">Direction</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center p-2 border cursor-pointer transition-colors" 
                     :class="transferDirection === 'parachainToAssetHub' ? 'border-[#A8E000] bg-black' : 'border-[#333333] hover:border-[#A8E000]/50'">
                <input
                  v-model="transferDirection"
                  type="radio"
                  value="parachainToAssetHub"
                  class="mr-2 accent-[#A8E000]"
                >
                <div class="text-xs font-mono font-bold text-[#A8E000]">EDU → AH</div>
              </label>
              <label class="flex items-center p-2 border cursor-pointer transition-colors"
                     :class="transferDirection === 'assetHubToParachain' ? 'border-[#A8E000] bg-black' : 'border-[#333333] hover:border-[#A8E000]/50'">
                <input
                  v-model="transferDirection"
                  type="radio"
                  value="assetHubToParachain"
                  class="mr-2 accent-[#A8E000]"
                >
                <div class="text-xs font-mono font-bold text-[#A8E000]">AH → EDU</div>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-mono font-bold text-[#A8E000]/80 mb-2 uppercase">Amount (PAS)</label>
            <input
              v-model.number="transferAmount"
              type="number"
              min="0.1"
              step="0.1"
              class="w-full px-3 py-2 border border-[#333333] bg-black text-[#A8E000] font-mono text-sm focus:border-[#A8E000] focus:outline-none"
              placeholder="10.5"
            >
          </div>

          <div>
            <label class="block text-xs font-mono font-bold text-[#A8E000]/80 mb-2 uppercase">Beneficiary</label>
            <input
              v-model="beneficiaryAddress"
              type="text"
              class="w-full px-3 py-2 border border-[#333333] bg-black text-[#A8E000] font-mono text-xs focus:border-[#A8E000] focus:outline-none"
              placeholder="5GrwvaEF..."
            >
          </div>

          <button
            @click="handleTransfer"
            :disabled="isTransferProcessing || !isTransferFormValid"
            class="w-full py-2 px-3 border border-[#A8E000] text-[#A8E000] hover:bg-[#A8E000] hover:text-black disabled:opacity-50 font-mono text-xs font-bold uppercase transition-colors"
          >
            <span v-if="isTransferProcessing">Processing...</span>
            <span v-else>{{ transferButtonText }}</span>
          </button>

          <div v-if="transferResult" class="border border-[#333333] bg-black p-3">
            <h4 class="text-xs font-mono font-bold text-[#A8E000] mb-2 uppercase">Status</h4>
            <p class="text-xs font-mono text-[#A8E000]/80 whitespace-pre-line">{{ transferResult }}</p>
            <div v-if="transferTxHash" class="mt-2 text-xs font-mono text-[#A8E000]/60 break-all">
              Hash: {{ transferTxHash }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBlockExplorer } from '~/composables/useBlockExplorer'
import { useOnDemandOrder } from '~/composables/useOnDemandOrder'
import { useReserveTransfer } from '~/composables/useReserveTransfer'
import { useConnect } from '~/composables/useConnect'
import { explorerDetail } from '~/utils/formatters'

// Network Status
const {
  networkStats,
  formatTime
} = useBlockExplorer()

// OnDemand
const { selectedAccount } = useConnect()
const { 
  placeOrder, 
  isProcessing, 
  result: orderResult, 
  txHash: orderTxHash,
  isAutoMode,
  orderCount,
  lastOrderTime,
  intervalSeconds,
  orderOnFinalization,
  usePrivateKey,
  privateKeyMnemonic,
  devAccount,
  startAutoOrdering,
  stopAutoOrdering,
  setupPrivateKeySigning,
  toggleSigningMode
} = useOnDemandOrder()

const paraId = ref<number>()
const maxAmount = ref<number>()
const keepAlive = ref(true)

async function submitOrder() {
  if (!paraId.value || !maxAmount.value) return
  await placeOrder(paraId.value, maxAmount.value, keepAlive.value)
}

async function toggleAutoOrdering() {
  if (isAutoMode.value) {
    stopAutoOrdering()
  } else {
    if (!paraId.value || !maxAmount.value) return
    await startAutoOrdering(paraId.value, maxAmount.value, keepAlive.value)
  }
}

function getOrderResultClass() {
  if (orderResult.value?.includes('successful')) return 'bg-black border-[#A8E000] text-[#A8E000]'
  if (orderResult.value?.includes('Error:')) return 'bg-black border-[#ff0000] text-[#ff0000]'
  return 'bg-black border-[#A8E000] text-[#A8E000]'
}

function onPrivateKeyToggle() {
  toggleSigningMode()
}

function setupDevAccount() {
  if (!privateKeyMnemonic.value.trim()) return
  try {
    setupPrivateKeySigning(privateKeyMnemonic.value)
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

// Reserve Transfers
const {
  isProcessing: isTransferProcessing,
  result: transferResult,
  txHash: transferTxHash,
  fromParachainToAssetHub,
  fromAssetHubToParachain,
} = useReserveTransfer()

const transferDirection = ref<'parachainToAssetHub' | 'assetHubToParachain'>('parachainToAssetHub')
const transferAmount = ref<number>(1)
const beneficiaryAddress = ref('')

const isTransferFormValid = computed(() => {
  return transferAmount.value > 0 && beneficiaryAddress.value.trim() !== ''
})

const transferButtonText = computed(() => {
  return transferDirection.value === 'parachainToAssetHub' ? 'Transfer to AssetHub' : 'Transfer to EduChain'
})

async function handleTransfer() {
  if (!isTransferFormValid.value) return
  if (transferDirection.value === 'parachainToAssetHub') {
    await fromParachainToAssetHub(transferAmount.value, beneficiaryAddress.value)
  } else {
    await fromAssetHubToParachain(transferAmount.value, beneficiaryAddress.value)
  }
}
</script>
