<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Divider from 'primevue/divider'

const router = useRouter()
const { t } = useI18n()

const ONBOARDING_KEY = 'typerek-onboarding-seen'

onMounted(() => {
  if (localStorage.getItem(ONBOARDING_KEY)) {
    router.replace('/')
  }
})

function dismiss() {
  localStorage.setItem(ONBOARDING_KEY, 'true')
  router.push('/')
}
</script>

<template>
  <div class="onboarding-container">
    <div class="onboarding-card">
      <h1 class="page-title">{{ t('onboarding.title') }}</h1>
      <p class="subtitle">{{ t('onboarding.subtitle') }}</p>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('onboarding.betTypesTitle') }}</h2>
        <p class="section-desc">{{ t('onboarding.betTypesDesc') }}</p>
        <ul class="bet-list">
          <li>{{ t('onboarding.bet1') }}</li>
          <li>{{ t('onboarding.betX') }}</li>
          <li>{{ t('onboarding.bet2') }}</li>
          <li>{{ t('onboarding.bet1X') }}</li>
          <li>{{ t('onboarding.betX2') }}</li>
          <li>{{ t('onboarding.bet12') }}</li>
        </ul>
      </section>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('onboarding.scoringTitle') }}</h2>
        <p class="section-desc">{{ t('onboarding.scoringDesc') }}</p>
      </section>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('onboarding.lockTitle') }}</h2>
        <p class="section-desc">{{ t('onboarding.lockDesc') }}</p>
      </section>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('onboarding.missedTitle') }}</h2>
        <p class="section-desc">{{ t('onboarding.missedDesc') }}</p>
      </section>

      <div class="actions">
        <Button
          :label="t('onboarding.gotIt')"
          icon="pi pi-check"
          @click="dismiss"
        />
        <Button
          :label="t('onboarding.skip')"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="dismiss"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
}

.onboarding-card {
  width: 100%;
  max-width: 640px;
  background: var(--p-surface-0);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.page-title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.subtitle {
  margin: 0.25rem 0 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--p-text-color);
}

.section-desc {
  margin: 0;
  color: var(--p-text-color);
  line-height: 1.5;
}

.bet-list {
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--p-text-color);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.actions :deep(.p-button) {
  width: 100%;
  justify-content: center;
}

@media (min-width: 768px) {
  .onboarding-card {
    padding: 2rem;
  }

  .actions {
    flex-direction: row;
    justify-content: center;
  }

  .actions :deep(.p-button) {
    width: auto;
    min-width: 140px;
  }
}
</style>
