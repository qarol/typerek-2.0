<script setup lang="ts">
import AppNavigation from './components/ui/AppNavigation.vue'
</script>

<template>
  <main class="app-content">
    <RouterView />
  </main>
  <AppNavigation />
</template>

<style scoped>
.app-content {
  padding-bottom: 56px;
}
</style>
