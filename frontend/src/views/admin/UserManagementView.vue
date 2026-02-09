<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const showInviteForm = ref(false)
const newNickname = ref('')
const submittingInvite = ref(false)

onMounted(async () => {
  try {
    await adminStore.fetchUsers()
  } catch (error) {
    // Error is stored in adminStore.error, display will show it
    toast.add({
      severity: 'error',
      summary: t(`errors.${adminStore.error || 'UNKNOWN_ERROR'}`),
      life: 4000,
    })
  }
})

function goBack() {
  router.push('/more')
}

function toggleInviteForm() {
  showInviteForm.value = !showInviteForm.value
  if (!showInviteForm.value) {
    newNickname.value = ''
    adminStore.clearInviteUrl()
    adminStore.clearError()
  }
}

async function handleCreateInvite() {
  if (!newNickname.value.trim()) return

  submittingInvite.value = true
  try {
    await adminStore.createInvite(newNickname.value.trim())
    toast.add({
      severity: 'success',
      summary: t('users.inviteCreated'),
      detail: t('users.copyLink'),
      life: 3000,
    })
  } catch (error) {
    // Error is stored in adminStore.error
  } finally {
    submittingInvite.value = false
  }
}

async function copyInviteLink() {
  if (!adminStore.inviteUrl) return

  try {
    await navigator.clipboard.writeText(adminStore.inviteUrl)
    toast.add({
      severity: 'success',
      summary: t('users.linkCopied'),
      life: 2000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('users.copyFailed'),
      life: 3000,
    })
  }
}

async function shareInviteLink() {
  if (!adminStore.inviteUrl) return

  try {
    await navigator.share({
      url: adminStore.inviteUrl,
      title: t('users.inviteNew'),
    })
  } catch (error) {
    // User cancelled share or share not available
  }
}

function requestRoleChange(userId: number, nickname: string, isCurrentlyAdmin: boolean) {
  if (userId === authStore.user?.id) {
    toast.add({
      severity: 'warn',
      summary: t('users.cannotRemoveSelf'),
      life: 3000,
    })
    return
  }

  const newRole = isCurrentlyAdmin ? t('users.player') : t('users.admin')
  confirm.require({
    header: t('users.changeRole'),
    message: t('users.confirmRoleChange', { nickname, role: newRole }),
    icon: 'pi pi-shield',
    rejectProps: {
      label: t('common.cancel'),
      severity: 'secondary',
      text: true,
    },
    acceptProps: {
      label: t('users.confirm'),
      severity: isCurrentlyAdmin ? 'warn' : 'primary',
    },
    accept: async () => {
      try {
        await adminStore.toggleAdmin(userId, !isCurrentlyAdmin)
      } catch (error) {
        if (adminStore.error === 'SELF_ROLE_CHANGE') {
          toast.add({
            severity: 'warn',
            summary: t('users.cannotRemoveSelf'),
            life: 3000,
          })
        } else {
          toast.add({
            severity: 'error',
            summary: t(`errors.${adminStore.error || 'UNKNOWN_ERROR'}`),
            life: 3000,
          })
        }
      }
    },
  })
}

function isCurrentUser(userId: number): boolean {
  return userId === authStore.user?.id
}

// Check if Web Share API is available
const canShare = ref(typeof navigator.share === 'function')
</script>

<template>
  <div class="view-container">
    <Toast />
    <ConfirmDialog />

    <div class="page-header">
      <Button
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        rounded
        @click="goBack"
        :aria-label="t('common.back')"
        class="back-button"
      />
      <h1>{{ t('users.title') }}</h1>
    </div>

    <div class="content-card">
      <!-- Invite Form Section -->
      <div class="invite-section">
        <Button
          v-if="!showInviteForm"
          :label="t('users.inviteNew')"
          icon="pi pi-plus"
          severity="primary"
          @click="toggleInviteForm"
        />

        <div v-else class="invite-form">
          <div class="form-header">
            <h2>{{ t('users.inviteNew') }}</h2>
            <Button
              icon="pi pi-times"
              severity="secondary"
              text
              @click="toggleInviteForm"
            />
          </div>

          <div class="form-input">
            <InputText
              v-model="newNickname"
              :placeholder="t('users.nickname')"
              fluid
              @keyup.enter="handleCreateInvite"
            />
          </div>

          <Button
            :label="t('users.createInvite')"
            :loading="submittingInvite"
            :disabled="!newNickname.trim()"
            @click="handleCreateInvite"
          />

          <!-- Invite URL Display -->
          <div v-if="adminStore.inviteUrl" class="invite-url-box">
            <p class="invite-url">{{ adminStore.inviteUrl }}</p>
            <div class="invite-actions">
              <Button
                :label="t('users.copyLink')"
                icon="pi pi-copy"
                severity="secondary"
                @click="copyInviteLink"
              />
              <Button
                v-if="canShare"
                :label="t('users.share')"
                icon="pi pi-share-alt"
                severity="secondary"
                @click="shareInviteLink"
              />
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="adminStore.error" class="error-message">
            {{ t(`errors.${adminStore.error}`) }}
          </div>
        </div>
      </div>

      <!-- User List -->
      <div class="user-list">
        <div
          v-for="user in adminStore.users"
          :key="user.id"
          class="user-row"
        >
          <div class="user-info">
            <span class="user-nickname">{{ user.nickname }}</span>
            <Tag
              :value="user.activated ? t('users.active') : t('users.pending')"
              :severity="user.activated ? 'success' : 'warn'"
              :icon="user.activated ? 'pi pi-check' : 'pi pi-clock'"
            />
          </div>

          <button
            class="role-chip"
            :class="{ 'role-admin': user.admin, 'role-self': isCurrentUser(user.id) }"
            :disabled="isCurrentUser(user.id)"
            @click="requestRoleChange(user.id, user.nickname, user.admin)"
            :aria-label="t('users.toggleAdmin')"
          >
            <i :class="user.admin ? 'pi pi-shield' : 'pi pi-user'" />
            <span>{{ user.admin ? t('users.admin') : t('users.player') }}</span>
          </button>
        </div>

        <div v-if="adminStore.users.length === 0 && !adminStore.loading" class="empty-state">
          <p>{{ t('users.noUsers') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.back-button {
  flex-shrink: 0;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.invite-section {
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--p-surface-100);
}

.invite-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  background: var(--p-surface-50);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.form-input {
  width: 100%;
}

.invite-url-box {
  padding: 1rem;
  border: 1px solid var(--p-primary-color);
  border-radius: 8px;
  background: var(--p-primary-50);
}

.invite-url {
  word-break: break-all;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 0.8125rem;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
  color: var(--p-text-color);
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.invite-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.error-message {
  padding: 0.75rem;
  background: var(--p-red-50);
  color: var(--p-red-700);
  border-radius: 6px;
  font-size: 0.8125rem;
  border-left: 3px solid var(--p-red-500);
}

/* ===== User List ===== */
.user-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--p-surface-100);
}

.user-row:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.user-nickname {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--p-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Role chip: replaces ToggleSwitch with intentional tap + confirmation */
.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.625rem;
  border-radius: 6px;
  border: 1px solid var(--p-surface-200);
  background: var(--p-surface-50);
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  font-family: inherit;
}

.role-chip i {
  font-size: 0.75rem;
}

.role-chip:hover:not(:disabled) {
  border-color: var(--p-primary-color);
  color: var(--p-primary-color);
  background: var(--p-primary-50);
}

.role-chip:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

.role-chip.role-admin {
  border-color: var(--p-primary-200);
  background: var(--p-primary-50);
  color: var(--p-primary-700);
}

.role-chip.role-admin:hover:not(:disabled) {
  border-color: var(--p-orange-300);
  color: var(--p-orange-700);
  background: var(--p-orange-50);
}

.role-chip.role-self {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

/* ===== Tablet and Desktop ===== */
@media (min-width: 768px) {
  .page-header h1 {
    font-size: 1.5rem;
  }

  .content-card {
    padding: 1.5rem;
  }

  .invite-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
  }

  /* F8 fix: keep subtle separators on desktop */
  .user-row {
    padding: 0.625rem 0.5rem;
    border-radius: 6px;
    margin: 0 -0.5rem;
  }

  .user-row:hover {
    background: var(--p-surface-50);
  }

  .user-nickname {
    font-size: 0.9375rem;
  }

  .role-chip {
    font-size: 0.8125rem;
    padding: 0.375rem 0.75rem;
  }
}
</style>
