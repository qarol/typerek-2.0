<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const nickname = ref('')
const password = ref('')

async function handleLogin() {
  try {
    await authStore.login(nickname.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    // error is handled by store
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">{{ t('auth.loginTitle') }}</h1>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="nickname">{{ t('auth.nickname') }}</label>
          <InputText
            id="nickname"
            v-model="nickname"
            :placeholder="t('auth.nickname')"
            autocomplete="username"
            fluid
          />
        </div>

        <div class="field">
          <label for="password">{{ t('auth.password') }}</label>
          <Password
            id="password"
            v-model="password"
            :placeholder="t('auth.password')"
            :feedback="false"
            toggle-mask
            autocomplete="current-password"
            fluid
          />
        </div>

        <p v-if="authStore.error" class="error-message">
          {{ t(`errors.${authStore.error}`, t('auth.invalidCredentials')) }}
        </p>

        <Button
          type="submit"
          :label="authStore.loading ? t('auth.signingIn') : t('auth.signIn')"
          :loading="authStore.loading"
          :disabled="authStore.loading || !nickname || !password"
          fluid
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  color: var(--p-primary-color);
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.login-form {
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
</style>
