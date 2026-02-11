<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const userInitials = computed(() => {
  const nickname = authStore.user?.nickname
  if (!nickname) return '?'
  return [...nickname].slice(0, 2).join('').toUpperCase()
})

async function handleLogout() {
  try {
    await authStore.logout()
  } catch (e) {
    console.error('Logout request failed, clearing session client-side:', e)
  } finally {
    await router.push('/login')
  }
}

function navigateToUserManagement() {
  router.push('/admin/users')
}

function navigateToOddsEntry() {
  router.push('/admin/odds-entry')
}

function navigateToScoreEntry() {
  router.push('/admin/score-entry')
}
</script>

<template>
  <div class="view-container">
    <h1 class="page-title">{{ t('nav.more') }}</h1>

    <div class="more-layout">
      <!-- Profile Card -->
      <div class="content-card profile-card">
        <div class="avatar">{{ userInitials }}</div>
        <p class="nickname">{{ authStore.user?.nickname }}</p>
        <span class="role-badge" :class="{ 'is-admin': authStore.isAdmin }">
          {{ authStore.isAdmin ? t('users.admin') : t('users.player') }}
        </span>
      </div>

      <!-- Actions Card -->
      <div class="content-card actions-card">
        <template v-if="authStore.isAdmin">
          <div class="admin-section">
            <h2 class="section-title">{{ t('admin.section') }}</h2>
            <div class="admin-options">
              <Button
                :label="t('admin.userManagement')"
                severity="secondary"
                outlined
                @click="navigateToUserManagement"
              />

              <Button
                :label="t('admin.oddsEntry')"
                severity="secondary"
                outlined
                @click="navigateToOddsEntry"
              />

              <Button
                :label="t('admin.scoreEntry')"
                severity="secondary"
                outlined
                @click="navigateToScoreEntry"
              />
            </div>
          </div>
          <Divider />
        </template>

        <div class="sign-out-area">
          <Button :label="t('auth.signOut')" severity="danger" outlined @click="handleLogout" />
        </div>
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

.more-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Profile card */
.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--p-primary-400) 0%, var(--p-primary-600) 100%);
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nickname {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--p-text-color);
  margin: 0;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--p-surface-100);
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-badge.is-admin {
  background: var(--p-primary-50);
  color: var(--p-primary-600);
  border: 1px solid var(--p-primary-200);
}

/* Actions card */
.actions-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.admin-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--p-text-color);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--p-surface-100);
}

.admin-options {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* Full-width buttons on mobile */
.admin-options :deep(.p-button),
.sign-out-area :deep(.p-button) {
  width: 100%;
  justify-content: center;
}

.coming-soon {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  font-style: italic;
}

/* Tablet */
@media (min-width: 768px) {
  .page-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .content-card {
    padding: 1.5rem;
  }

  .more-layout {
    gap: 1.25rem;
  }

  .avatar {
    width: 80px;
    height: 80px;
    font-size: 1.75rem;
  }

  .nickname {
    font-size: 1.25rem;
  }

  /* Buttons auto-width on tablet+ */
  .admin-options :deep(.p-button),
  .sign-out-area :deep(.p-button) {
    width: auto;
    min-width: 200px;
  }
}

/* Desktop */
@media (min-width: 1200px) {
  .more-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .content-card {
    padding: 2rem;
  }

  .profile-card {
    gap: 1rem;
  }

  .avatar {
    width: 96px;
    height: 96px;
    font-size: 2rem;
  }

  .nickname {
    font-size: 1.375rem;
  }

  .section-title {
    font-size: 1.0625rem;
  }

  .actions-card {
    gap: 1.5rem;
  }

  .admin-options {
    gap: 0.75rem;
  }
}
</style>
