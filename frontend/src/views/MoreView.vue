<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function navigateToUserManagement() {
  router.push('/admin/users')
}
</script>

<template>
  <div class="view-container">
    <h1 class="page-title">{{ t('nav.more') }}</h1>

    <div class="content-card">
      <div class="more-content">
      <p class="user-info">{{ authStore.user?.nickname }}</p>

      <!-- Admin Section -->
      <template v-if="authStore.isAdmin">
        <Divider />

        <div class="admin-section">
          <h2 class="section-title">{{ t('admin.section') }}</h2>

          <div class="admin-options">
            <Button
              :label="t('admin.userManagement')"
              severity="secondary"
              outlined
              fluid
              @click="navigateToUserManagement"
            />

            <Button
              :label="t('admin.oddsEntry')"
              severity="secondary"
              outlined
              fluid
              disabled
            >
              <template #default>
                {{ t('admin.oddsEntry') }}
                <span class="coming-soon">{{ t('admin.comingSoon') }}</span>
              </template>
            </Button>

            <Button
              :label="t('admin.scoreEntry')"
              severity="secondary"
              outlined
              fluid
              disabled
            >
              <template #default>
                {{ t('admin.scoreEntry') }}
                <span class="coming-soon">{{ t('admin.comingSoon') }}</span>
              </template>
            </Button>
          </div>
        </div>

        <Divider />
      </template>

      <Button
        :label="t('auth.signOut')"
        severity="danger"
        outlined
        fluid
        @click="handleLogout"
      />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  margin: 0 0 1.25rem 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.more-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.user-info {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--p-text-color);
  margin: 0;
  padding: 1rem;
  background: linear-gradient(135deg, var(--p-primary-50) 0%, var(--p-primary-100) 100%);
  border-radius: 10px;
  border: 1px solid var(--p-primary-200);
  text-align: center;
}

.admin-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--p-text-color);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--p-surface-100);
}

.admin-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.coming-soon {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}

/* Desktop */
@media (min-width: 768px) {
  .page-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .content-card {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.125rem;
  }

  .user-info {
    font-size: 1.25rem;
    padding: 1.25rem;
  }

  .more-content {
    gap: 1.5rem;
  }
}
</style>
