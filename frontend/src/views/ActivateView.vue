<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api/client'
import type { ApiResponse } from '@/api/types'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const token = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const nickname = ref('')
const tokenValid = ref(false)
const tokenChecking = ref(true)
const validationError = ref<string | null>(null)

const clientError = computed(() => {
  if (validationError.value) return validationError.value
  if (authStore.error) return t(`errors.${authStore.error}`, authStore.error)
  return null
})

onMounted(async () => {
  token.value = (route.query.token as string) || ''

  if (!token.value) {
    router.push('/login')
    return
  }

  try {
    const response = await api.get<ApiResponse<{ nickname: string }>>(
      `/users/verify_token?token=${encodeURIComponent(token.value)}`,
    )
    nickname.value = response.data.nickname
    tokenValid.value = true
  } catch {
    tokenValid.value = false
  } finally {
    tokenChecking.value = false
  }
})

function validateForm(): boolean {
  validationError.value = null

  if (password.value.length < 6) {
    validationError.value = t('activate.passwordTooShort')
    return false
  }

  if (password.value !== passwordConfirmation.value) {
    validationError.value = t('activate.passwordMismatch')
    return false
  }

  return true
}

async function handleActivate() {
  if (!validateForm()) return

  try {
    await authStore.activate(token.value, password.value, passwordConfirmation.value)
    router.push('/')
  } catch {
    // error is handled by store
  }
}
</script>

<template>
  <div class="activate-container">
    <div class="activate-card">
      <template v-if="tokenChecking">
        <p class="loading-text">{{ t('activate.activating') }}</p>
      </template>

      <template v-else-if="!tokenValid">
        <h1 class="activate-title">{{ t('activate.title') }}</h1>
        <p class="error-message">{{ t('errors.INVALID_TOKEN') }}</p>
      </template>

      <template v-else>
        <h1 class="activate-title">{{ t('activate.title') }}</h1>

        <p class="nickname-display">{{ nickname }}</p>

        <form class="activate-form" @submit.prevent="handleActivate">
          <div class="field">
            <label for="password">{{ t('activate.password') }}</label>
            <Password
              id="password"
              v-model="password"
              :placeholder="t('activate.password')"
              :feedback="false"
              toggle-mask
              autocomplete="new-password"
              fluid
            />
          </div>

          <div class="field">
            <label for="password-confirmation">{{ t('activate.passwordConfirmation') }}</label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              :placeholder="t('activate.passwordConfirmation')"
              :feedback="false"
              toggle-mask
              autocomplete="new-password"
              fluid
            />
          </div>

          <p v-if="clientError" class="error-message">
            {{ clientError }}
          </p>

          <Button
            type="submit"
            :label="authStore.loading ? t('activate.activating') : t('activate.submit')"
            :loading="authStore.loading"
            :disabled="authStore.loading || !password || !passwordConfirmation"
            fluid
          />
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.activate-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.activate-card {
  width: 100%;
  max-width: 400px;
}

.activate-title {
  text-align: center;
  color: var(--p-primary-color);
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.nickname-display {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.activate-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  font-size: 0.875rem;
}

.error-message {
  color: var(--p-red-500);
  font-size: 0.875rem;
  margin: 0;
  text-align: center;
}

.loading-text {
  text-align: center;
  color: var(--p-text-muted-color);
}
</style>
