<script setup lang="ts">
import Footer from '~/components/Footer.vue'
import Header from '~/components/Header.vue'
import OnDemandOrder from '~/components/OnDemandOrder.vue'


</script>

<template>
  <div class="min-h-screen flex flex-col justify-between">
    <Header />
    <!-- OnDemand Order Form -->
    <main class="px-10 py-8 space-y-8 flex-1">
      <div class="w-full">
        <OnDemandOrder />
      </div>
    </main>

    <Footer />
  </div>
</template>
