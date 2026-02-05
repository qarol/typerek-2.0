<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

const tabs = [
  { label: 'nav.standings', icon: 'pi pi-trophy', to: '/' },
  { label: 'nav.matches', icon: 'pi pi-calendar', to: '/matches' },
  { label: 'nav.history', icon: 'pi pi-chart-bar', to: '/history' },
  { label: 'nav.more', icon: 'pi pi-cog', to: '/more' },
]

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <nav class="app-navigation">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="nav-tab"
      :class="{ active: isActive(tab.to) }"
    >
      <i :class="tab.icon"></i>
      <span>{{ t(tab.label) }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.app-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  z-index: 100;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  padding: 0.25rem 0.75rem;
  text-decoration: none;
  color: #94a3b8;
  font-size: 0.6875rem;
  gap: 0.125rem;
  transition: color 0.2s;
}

.nav-tab i {
  font-size: 1.25rem;
}

.nav-tab.active {
  color: #0d9488;
}
</style>
