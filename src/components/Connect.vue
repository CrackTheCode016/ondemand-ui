<script setup lang="ts">
import { ref } from 'vue'
import { useConnect } from '~/composables/useConnect'
import { stripAddress } from '~/utils/formatters'

const connectModal = ref<HTMLDialogElement | null>(null)
const showOtherWallets = ref(false)

const {
  listAccounts,
  selectedAccount,
  connectedWallet,
  isConnecting,
  installedWallets,
  availableWallets,
  connect,
  selectAccount,
  disconnect,
} = useConnect()

function handleSelectAccount(account: typeof selectedAccount.value) {
  if (account) {
    selectAccount(account)
    connectModal.value?.close()
  }
}

function openConnectModal() {
  connectModal.value?.showModal()
}

function closeConnectModal() {
  connectModal.value?.close()
}

function toggleOtherWallets() {
  showOtherWallets.value = !showOtherWallets.value
}

function isWalletConnected(wallet: typeof connectedWallet.value) {
  return connectedWallet.value?.extensionName === wallet?.extensionName
}

function isAccountSelected(account: typeof selectedAccount.value) {
  return selectedAccount.value?.address === account?.address
}
</script>

<template>
  <!-- Connect/Disconnect Buttons -->
  <div class="flex items-center gap-2">
    <button
      class="border border-[#A8E000] text-[#A8E000] px-3 py-1 hover:bg-[#A8E000] hover:text-black font-mono text-xs font-bold uppercase transition-colors"
      @click="openConnectModal"
    >
      <div v-if="!selectedAccount" class="flex items-center gap-2">
        <span class="icon-[mdi--wallet] w-4 h-4" />
        <span>Connect</span>
      </div>
      <div v-else class="flex items-center gap-2">
        <span class="icon-[mdi--wallet] w-4 h-4" />
        <span class="hidden sm:block">{{ selectedAccount.name }}</span>
        <img
          :src="connectedWallet?.logo.src"
          :alt="connectedWallet?.logo.alt"
          class="w-4 h-4"
        >
      </div>
    </button>

    <!-- Disconnect Button (only shown when connected) -->
    <button
      v-if="selectedAccount"
      class="border border-[#ff0000] text-[#ff0000] px-3 py-1 hover:bg-[#ff0000] hover:text-black font-mono text-xs font-bold uppercase transition-colors"
      @click="disconnect"
    >
      <span class="icon-[mdi--logout] w-4 h-4" />
    </button>
  </div>

  <!-- Modal using HTML dialog element -->
  <dialog ref="connectModal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-2xl bg-[#0a0a0a] border-2 border-[#A8E000]">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-mono font-bold text-[#A8E000] uppercase tracking-wider">
          Connect Wallet
        </h2>
        <button class="border border-[#333333] p-1 text-[#A8E000] hover:border-[#A8E000] transition-colors" @click="closeConnectModal">
          <span class="icon-[mdi--close] w-5 h-5" />
        </button>
      </div>

      <!-- Account Selection -->
      <div v-if="listAccounts.length" class="mb-6">
        <h3 class="text-xs font-mono font-bold text-[#A8E000]/60 uppercase tracking-wider mb-3">
          Select Account
        </h3>
        <div class="space-y-2">
          <div
            v-for="account in listAccounts"
            :key="account.address"
            class="bg-black border cursor-pointer hover:border-[#A8E000] transition-colors p-3"
            :class="isAccountSelected(account) ? 'border-[#A8E000]' : 'border-[#333333]'"
            @click="handleSelectAccount(account)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-8 h-8 border border-[#333333] flex items-center justify-center mr-2">
                  <span class="icon-[mdi--account] text-[#A8E000]" />
                </div>
                <div>
                  <p class="text-sm font-mono font-bold text-[#A8E000]">
                    {{ account.name }}
                  </p>
                  <p class="text-xs font-mono text-[#A8E000]/60">
                    {{ stripAddress(account.address) }}
                  </p>
                </div>
              </div>
              <div v-if="isAccountSelected(account)">
                <div class="w-2 h-2 bg-[#A8E000] shadow-[0_0_10px_#A8E000]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Installed -->
      <div v-if="installedWallets.length" class="mb-6">
        <h3 class="text-xs font-mono font-bold text-[#A8E000]/60 uppercase tracking-wider mb-3">
          Installed
        </h3>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="wallet in installedWallets"
            :key="wallet.extensionName"
            class="bg-black border cursor-pointer hover:border-[#A8E000] transition-colors p-4"
            :class="isWalletConnected(wallet) ? 'border-[#A8E000]' : 'border-[#333333]'"
            @click="connect(wallet)"
          >
            <div class="flex flex-col items-center text-center gap-2">
              <div class="relative">
                <img
                  :src="wallet.logo.src"
                  :alt="wallet.logo.alt"
                  class="w-12 h-12"
                >
                <div v-if="isWalletConnected(wallet)" class="absolute -top-1 -right-1 w-4 h-4 bg-[#A8E000] flex items-center justify-center">
                  <span class="icon-[mdi--check] w-2 h-2 text-black" />
                </div>
              </div>
              <div class="text-xs font-mono font-bold text-[#A8E000]">
                {{ wallet.title }}
              </div>
              <button
                :disabled="isConnecting === wallet.extensionName"
                class="border px-3 py-1 w-full font-mono text-xs font-bold uppercase transition-colors"
                :class="isWalletConnected(wallet) ? 'border-[#A8E000] text-[#A8E000]' : 'border-[#333333] text-[#A8E000]/60 hover:border-[#A8E000] hover:text-[#A8E000]'"
              >
                <span v-if="isConnecting === wallet.extensionName" class="icon-[mdi--loading] animate-spin" />
                <span v-if="isWalletConnected(wallet)">Connected</span>
                <span v-else>{{ isConnecting === wallet.extensionName ? 'Connecting' : 'Connect' }}</span>
                <span v-if="!isWalletConnected(wallet)" class="icon-[mdi--chevron-right]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Wallets -->
      <div v-if="availableWallets.length">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-mono font-bold text-[#A8E000]/60 uppercase tracking-wider">
            Other wallets
          </h3>
          <button class="border border-[#333333] px-2 py-1 text-[#A8E000] hover:border-[#A8E000] font-mono text-xs font-bold uppercase transition-colors" @click="toggleOtherWallets">
            {{ showOtherWallets ? 'Hide' : 'Show' }}
            <span :class="showOtherWallets ? 'icon-[mdi--chevron-up]' : 'icon-[mdi--chevron-down]'" />
          </button>
        </div>
        <div v-if="showOtherWallets" class="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="wallet in availableWallets"
            :key="wallet.extensionName"
            class="bg-black border border-[#333333] hover:border-[#A8E000] transition-colors p-4"
          >
            <div class="flex flex-col items-center text-center gap-2">
              <img
                :src="wallet.logo.src"
                :alt="wallet.logo.alt"
                class="w-12 h-12 opacity-60"
              >
              <div class="text-xs font-mono font-bold text-[#A8E000]">
                {{ wallet.title }}
              </div>
              <a
                :href="wallet.installUrl"
                target="_blank"
                class="border border-[#A8E000] px-3 py-1 w-full text-[#A8E000] hover:bg-[#A8E000] hover:text-black font-mono text-xs font-bold uppercase transition-colors inline-flex items-center justify-center gap-1"
              >
                <span>Download</span>
                <span class="icon-[mdi--download]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/80">
      <button>close</button>
    </form>
  </dialog>
</template>
