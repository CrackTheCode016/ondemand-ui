<template>
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-blue-800">
          What is OnDemand Coretime?
        </h3>
        <div class="mt-2 text-sm text-blue-700">
          <p>OnDemand coretime allows parachains to purchase individual blocks of execution time on Polkadot without needing a full core. This is useful for:</p>
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>Testing parachain functionality without committing to a core</li>
            <li>Occasional / conditional transaction processing</li>
            <li>Cost-effective block production</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for this informational component
</script>