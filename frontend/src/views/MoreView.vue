<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="view-container">
    <h1>{{ t('nav.more') }}</h1>

    <div class="more-content">
      <p class="user-info">{{ authStore.user?.nickname }}</p>

      <Button
        :label="t('auth.signOut')"
        severity="secondary"
        outlined
        fluid
        @click="handleLogout"
      />
    </div>
  </div>
</template>

<style scoped>
.more-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.user-info {
  font-size: 1rem;
  color: var(--p-text-muted-color);
  margin: 0;
}
</style>
