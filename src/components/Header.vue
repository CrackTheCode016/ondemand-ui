<script setup lang="ts">
import { watch } from 'vue'
import Connect from './Connect.vue'
import { useConnect } from '~/composables/useConnect'
import { useBalances } from '~/composables/useBalances'

const { selectedAccount } = useConnect()
const { educhainBalance, assetHubBalance, refresh } = useBalances(selectedAccount.value?.address || null)

// Update balances when account changes
watch(() => selectedAccount.value?.address, (newAddress) => {
  if (newAddress) {
    refresh()
  }
})
</script>

<template>
  <div class="navbar bg-black border-b border-[#333333]">
    <div class="container mx-auto flex items-center">
      <div class="navbar-start">
        <div class="flex items-center gap-2">
          <img src="/img/logo.png" alt="EduChain" class="w-8 h-8" />
          <span class="text-xl font-bold font-mono text-[#A8E000] tracking-wide uppercase">
            EduChain
          </span>
        </div>
      </div>
      
      <div class="navbar-center">
        <div class="text-xs font-mono text-[#A8E000]/60 uppercase tracking-wide">
          Control Panel
        </div>
      </div>
      
      <div class="navbar-end flex items-center gap-4">
        <!-- Balance Display -->
        <div v-if="selectedAccount" class="hidden lg:flex items-center gap-4 text-xs font-mono border border-[#333333] px-3 py-1">
          <div class="flex items-center gap-1">
            <span class="text-[#A8E000]/60">EDU:</span>
            <span class="text-[#A8E000] font-bold">{{ educhainBalance }}</span>
          </div>
          <div class="w-px h-4 bg-[#333333]"></div>
          <div class="flex items-center gap-1">
            <span class="text-[#A8E000]/60">PAS:</span>
            <span class="text-[#A8E000] font-bold">{{ assetHubBalance }}</span>
          </div>
        </div>
        
        <Connect />
      </div>
    </div>
  </div>
</template>
