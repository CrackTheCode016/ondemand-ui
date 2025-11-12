<template>
  <div>
    <!-- Info Banner -->
    <OnDemandInfo />
    
    <!-- Main Layout -->
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Development Mode Panel -->
      <div class="lg:col-span-1">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 h-fit">
          <div class="flex items-center mb-2">
            <input
              id="usePrivateKey"
              v-model="usePrivateKey"
              type="checkbox"
              class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              @change="onPrivateKeyToggle"
            >
            <label for="usePrivateKey" class="ml-2 text-sm font-medium text-amber-800">
              🚧 Development Mode
            </label>
          </div>
          
          <p v-if="usePrivateKey" class="text-xs text-amber-600 mb-3">
            Transactions will be signed directly with the provided mnemonic, bypassing wallet prompts.
          </p>

          <div v-if="usePrivateKey" class="space-y-3">
            <textarea
              v-model="privateKeyMnemonic"
              rows="2"
              class="w-full px-3 py-2 border border-amber-300 rounded text-sm"
              placeholder="Enter mnemonic (12-24 words)..."
            ></textarea>
            
            <div class="flex gap-2">
              <button
                @click="setupDevAccount"
                :disabled="!privateKeyMnemonic.trim()"
                class="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50"
              >
                Set Context
              </button>
            </div>

            <div v-if="devAccount" class="text-xs text-amber-700 bg-amber-100 p-2 rounded">
              Context: {{ devAccount.address }}
            </div>
          </div>
        </div>
      </div>

      <!-- Order Form Panel -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-md p-6">
          <form @submit.prevent="submitOrder" class="space-y-6">
        <!-- Order Configuration -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="paraId" class="block text-sm font-medium text-gray-700 mb-1">
              Para ID
            </label>
            <input
              id="paraId"
              v-model="paraId"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1000"
              required
            >
          </div>

          <div>
            <label for="maxAmount" class="block text-sm font-medium text-gray-700 mb-1">
              Max Amount (PAS)
            </label>
            <input
              id="maxAmount"
              v-model="maxAmount"
              type="number"
              step="0.001"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10.0"
              required
            >
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="keepAlive"
            v-model="keepAlive"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          >
          <label for="keepAlive" class="ml-2 text-sm text-gray-700">
            Keep account alive
          </label>
        </div>

        <!-- Auto-Ordering -->
        <div class="border-t pt-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Auto-Ordering</h3>
            <input
              v-model="intervalSeconds"
              type="number"
              min="5"
              max="3600"
              :disabled="isAutoMode || orderOnFinalization"
              class="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
              title="Interval in seconds"
            >
          </div>

          <!-- Ordering Mode Toggle -->
          <div class="flex items-center gap-4 text-sm">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="orderOnFinalization"
                :value="false"
                type="radio"
                :disabled="isAutoMode"
                class="mr-1"
                name="orderingMode"
              >
              <span :class="{ 'text-gray-400': isAutoMode }">Interval Mode</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="orderOnFinalization"
                :value="true"
                type="radio"
                :disabled="isAutoMode"
                class="mr-1"
                name="orderingMode"
              >
              <span :class="{ 'text-gray-400': isAutoMode }">On Finalization</span>
            </label>
          </div>

          <div v-if="isAutoMode" class="bg-green-50 border border-green-200 rounded p-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-green-800">
                {{ orderOnFinalization ? 'Auto (on finalization)' : `Auto (${intervalSeconds}s)` }} • {{ orderCount }} orders 
                <span v-if="lastOrderTime" class="text-green-600">
                  • Last: {{ formatTime(lastOrderTime) }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="(!selectedAccount && !devAccount?.signer) || isProcessing || isAutoMode"
            class="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ isProcessing ? 'Processing...' : 'Place Order' }}
          </button>

          <button
            type="button"
            @click="toggleAutoOrdering"
            :disabled="(!selectedAccount && !devAccount?.signer) || !paraId || !maxAmount"
            class="flex-1 py-2 px-4 rounded disabled:bg-gray-400"
            :class="isAutoMode 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-green-600 text-white hover:bg-green-700'"
          >
            {{ isAutoMode ? 'Stop Auto' : 'Start Auto' }}
          </button>
        </div>
      </form>

      <!-- Results -->
      <div v-if="result || txHash" class="mt-6 space-y-3">
        <div v-if="txHash" class="text-sm">
          <a
            :href="explorerDetail('pas', txHash)"
            target="_blank"
            class="text-blue-600 hover:text-blue-800 ml-2 break-all"
          >
            View on SubScan: {{ txHash.substring(0, 20) }}...
          </a>
        </div>
        
        <div v-if="result" :class="getResultClass()" class="text-sm p-3 rounded">
          {{ result }}
        </div>
      </div>
        </div>
      </div>
    </div>

    <!-- Account Status -->
    <div v-if="selectedAccount || devAccount" class="mt-6 text-xs text-gray-500 text-center">
      <span v-if="devAccount?.signer && usePrivateKey" class="text-amber-600">
        🚧 Dev Mode: {{ stripAddress(devAccount.address) }}
      </span>
      <span v-else-if="selectedAccount">
        Connected: {{ stripAddress(selectedAccount.address) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OnDemandInfo from './OnDemandInfo.vue'
import { useOnDemandOrder } from '~/composables/useOnDemandOrder'
import { useConnect } from '~/composables/useConnect'
import { stripAddress, explorerDetail } from '~/utils/formatters'

const { selectedAccount } = useConnect()
const { 
  placeOrder, 
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

function formatTime(timestamp: Date) {
  return timestamp.toLocaleTimeString()
}

function getResultClass() {
  if (result.value?.includes('successful')) return 'bg-green-100 border-green-300 text-green-800'
  if (result.value?.includes('Error:')) return 'bg-red-100 border-red-300 text-red-800'
  return 'bg-blue-100 border-blue-300 text-blue-800'
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

</script>