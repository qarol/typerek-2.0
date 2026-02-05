<script setup lang="ts">
import AppNavigation from './components/ui/AppNavigation.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <main class="app-content" :class="{ 'no-nav': !authStore.isAuthenticated }">
    <RouterView />
  </main>
  <AppNavigation v-if="authStore.isAuthenticated" />
</template>

<style scoped>
.app-content {
  padding-bottom: 56px;
}

.app-content.no-nav {
  padding-bottom: 0;
}
</style>
