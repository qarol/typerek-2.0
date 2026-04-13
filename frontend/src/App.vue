<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppNavigation from './components/ui/AppNavigation.vue'
import { useAuthStore } from '@/stores/auth'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useMatchPolling } from '@/composables/useMatchPolling'
import Toast from 'primevue/toast'

const authStore = useAuthStore()
const { locale, t } = useI18n()
const { isOnline } = useOnlineStatus()
const { startPolling, stopPolling } = useMatchPolling()

document.documentElement.lang = locale.value

watch(locale, (newLocale) => {
  document.documentElement.lang = newLocale
})

watch(
  () => authStore.isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      startPolling()
    } else {
      stopPolling()
    }
  },
  { immediate: true },
)
</script>

<template>
  <Toast />
  <main class="app-content" :class="{ 'has-nav': authStore.isAuthenticated }">
    <RouterView />
  </main>
  <div v-if="!isOnline" class="offline-banner" :class="{ 'has-nav': authStore.isAuthenticated }" role="alert">
    {{ t('offline.title') }}
  </div>
  <AppNavigation v-if="authStore.isAuthenticated" />
</template>

<style scoped>
/* Mobile: bottom nav padding (accounts for notch safe area) */
.app-content.has-nav {
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
}

/* Desktop: top nav padding, no bottom padding, no side margin */
@media (min-width: 768px) {
  .app-content.has-nav {
    padding-bottom: 0;
    padding-top: 64px;
    margin-left: 0;
  }
}

.offline-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ef4444;
  color: #ffffff;
  text-align: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 200;
}

.offline-banner.has-nav {
  bottom: calc(56px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .offline-banner.has-nav {
    bottom: 0;
  }
}

</style>
