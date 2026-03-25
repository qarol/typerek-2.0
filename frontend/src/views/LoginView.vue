<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const nickname = ref('')
const password = ref('')
const showPassword = ref(false)

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
  <div class="page">
    <div class="bg-blob bg-blob--tl" aria-hidden="true"></div>
    <div class="bg-blob bg-blob--br" aria-hidden="true"></div>

    <main class="card-wrapper">
      <div class="card">
        <!-- Brand -->
        <div class="brand-section">
          <img src="/logo.png" alt="Typerek" class="logo-img" />
          <h1 class="brand-name">Typerek</h1>
        </div>

        <form class="form" @submit.prevent="handleLogin">
          <!-- Nickname -->
          <div class="field">
            <label class="field-label" for="nickname">{{ t('auth.nickname') }}</label>
            <div class="input-group">
              <span class="material-symbols-outlined input-icon" aria-hidden="true">person</span>
              <input
                id="nickname"
                v-model="nickname"
                type="text"
                class="input"
                :placeholder="t('auth.nickname')"
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="field">
            <label class="field-label" for="password">{{ t('auth.password') }}</label>
            <div class="input-group">
              <span class="material-symbols-outlined input-icon" aria-hidden="true">lock</span>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input input--with-toggle"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-btn"
                :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="authStore.error" class="error-row" role="alert">
            <span class="material-symbols-outlined error-icon" aria-hidden="true">error</span>
            <p class="error-text">{{ t(`errors.${authStore.error}`, t('auth.invalidCredentials')) }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="submit-btn"
            :disabled="authStore.loading || !nickname || !password"
          >
            {{ authStore.loading ? t('auth.signingIn') : t('auth.signIn') }}
            <span v-if="!authStore.loading" class="material-symbols-outlined" aria-hidden="true">login</span>
          </button>
        </form>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* ── Page ── */
.page {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: #f9f9f9;
  overflow: hidden;
}

.bg-blob {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(80px);
}
.bg-blob--tl {
  top: -5rem;
  left: -5rem;
  width: 24rem;
  height: 24rem;
  background: rgba(0, 104, 95, 0.05);
}
.bg-blob--br {
  bottom: -5rem;
  right: -5rem;
  width: 20rem;
  height: 20rem;
  background: rgba(130, 81, 0, 0.04);
}

/* ── Card ── */
.card-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
}

.card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 2rem;
  padding: 2.5rem 1.75rem;
  box-shadow: 0 24px 48px -12px rgba(0, 40, 37, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (min-width: 480px) {
  .card {
    padding: 3rem;
    border-radius: 2.5rem;
  }
}

/* ── Brand section ── */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.logo-img {
  width: 5rem;
  height: 5rem;
  border-radius: 9999px;
  object-fit: cover;
  margin-bottom: 0.875rem;
}

.brand-name {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.75rem;
  letter-spacing: -0.04em;
  color: #00685f;
  margin-bottom: 0.25rem;
}

/* ── Form ── */
.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #3d4947;
  margin-left: 0.25rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.875rem;
  font-size: 1.25rem;
  color: #6d7a77;
  pointer-events: none;
  transition: color 0.15s;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.input-group:focus-within .input-icon {
  color: #00685f;
}

.input {
  width: 100%;
  padding: 0.875rem 0.875rem 0.875rem 2.75rem;
  background: #e8e8e8;
  border: none;
  border-radius: 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #1a1c1c;
  outline: none;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}

.input::placeholder {
  color: rgba(109, 122, 119, 0.6);
}

.input:focus {
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(0, 104, 95, 0.2);
}

.input--with-toggle {
  padding-right: 3rem;
}

.toggle-btn {
  position: absolute;
  right: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #6d7a77;
  display: flex;
  align-items: center;
  transition: color 0.15s;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.toggle-btn:hover {
  color: #00685f;
}

/* ── Error ── */
.error-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.25rem;
  color: #ba1a1a;
}

.error-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.error-text {
  font-size: 0.8125rem;
  font-weight: 500;
}

/* ── Submit button ── */
.submit-btn {
  margin-top: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #00685f 0%, #008378 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.75rem;
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 8px 16px rgba(0, 104, 95, 0.2);
  transition:
    box-shadow 0.2s,
    opacity 0.2s,
    transform 0.1s;
}

.submit-btn .material-symbols-outlined {
  font-size: 1.25rem;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 12px 24px rgba(0, 104, 95, 0.3);
  opacity: 0.95;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

</style>
