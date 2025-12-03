<script setup lang="ts">
import Footer from '~/components/Footer.vue'
import Header from '~/components/Header.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-black">
    <Header />
    
    <!-- Main Content -->
    <main class="w-full px-4 py-8 space-y-8 flex-1">
      <router-view />
    </main>

    <Footer />
  </div>
</template>
