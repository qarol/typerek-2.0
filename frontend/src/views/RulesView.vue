<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Divider from 'primevue/divider'

const { t } = useI18n()
</script>

<template>
  <div class="view-container">
    <h1 class="page-title">{{ t('rules.title') }}</h1>

    <div class="rules-card">
      <section class="section">
        <h2 class="section-title">{{ t('rules.betTypesTitle') }}</h2>
        <p class="section-desc">{{ t('rules.betTypesDesc') }}</p>
        <ul class="bet-list">
          <li>{{ t('rules.bet1') }}</li>
          <li>{{ t('rules.betX') }}</li>
          <li>{{ t('rules.bet2') }}</li>
          <li>{{ t('rules.bet1X') }}</li>
          <li>{{ t('rules.betX2') }}</li>
          <li>{{ t('rules.bet12') }}</li>
        </ul>
      </section>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('rules.scoringTitle') }}</h2>
        <p class="section-desc">{{ t('rules.scoringDesc') }}</p>
      </section>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('rules.lockTitle') }}</h2>
        <p class="section-desc">{{ t('rules.lockDesc') }}</p>
      </section>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('rules.compoundTitle') }}</h2>
        <p class="section-desc">{{ t('rules.compoundDesc') }}</p>
      </section>

      <Divider />

      <section class="section">
        <h2 class="section-title">{{ t('rules.missedTitle') }}</h2>
        <p class="section-desc">{{ t('rules.missedDesc') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
}

.page-title {
  margin: 0 0 1.25rem 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.rules-card {
  background: var(--p-surface-0);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--p-text-color);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--p-surface-100);
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

@media (min-width: 768px) {
  .page-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .rules-card {
    padding: 1.5rem;
  }
}

@media (min-width: 1200px) {
  .rules-card {
    padding: 2rem;
  }

  .section-title {
    font-size: 1.0625rem;
  }
}
</style>
