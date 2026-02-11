<script setup lang="ts">
import AppNavigation from './components/ui/AppNavigation.vue'
import { useAuthStore } from '@/stores/auth'
import Toast from 'primevue/toast'

const authStore = useAuthStore()
</script>

<template>
  <Toast />
  <main class="app-content" :class="{ 'has-nav': authStore.isAuthenticated }">
    <RouterView />
  </main>
  <AppNavigation v-if="authStore.isAuthenticated" />
</template>

<style scoped>
/* Mobile: bottom nav padding */
.app-content.has-nav {
  padding-bottom: 56px;
}

/* Desktop: side nav margin, no bottom padding */
@media (min-width: 768px) {
  .app-content.has-nav {
    padding-bottom: 0;
    margin-left: 72px;
  }
}

@media (min-width: 1200px) {
  .app-content.has-nav {
    margin-left: 200px;
  }
}
</style>
