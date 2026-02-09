<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

// F1 fix: Use matchMedia to render only one nav, not both
const isDesktop = ref(false)
let mediaQuery: MediaQueryList | null = null

function onMediaChange(e: MediaQueryListEvent | MediaQueryList) {
  isDesktop.value = e.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 768px)')
  isDesktop.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
})
</script>

<template>
  <!-- Mobile: bottom bar -->
  <nav v-if="!isDesktop" class="bottom-nav">
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

  <!-- Desktop: side rail / sidebar -->
  <nav v-else class="side-nav">
    <div class="side-nav-items">
      <router-link
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="side-nav-tab"
        :class="{ active: isActive(tab.to) }"
      >
        <i :class="tab.icon"></i>
        <span>{{ t(tab.label) }}</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
/* ===== Bottom Navigation (Mobile) ===== */
.bottom-nav {
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

/* F12 fix: focus-visible states */
.nav-tab:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
  border-radius: 8px;
}

/* ===== Side Navigation (Desktop) ===== */
.side-nav {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 72px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  z-index: 100;
  padding: 1rem 0;
}

.side-nav-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding-top: 0.5rem;
}

.side-nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  text-decoration: none;
  color: #94a3b8;
  font-size: 0.625rem;
  gap: 0.25rem;
  transition: all 0.2s;
}

.side-nav-tab i {
  font-size: 1.25rem;
}

.side-nav-tab:hover {
  background: #f1f5f9;
  color: #64748b;
}

.side-nav-tab.active {
  color: #0d9488;
  background: rgba(13, 148, 136, 0.08);
}

/* F12 fix: focus-visible states */
.side-nav-tab:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
}

@media (min-width: 1200px) {
  .side-nav {
    width: 200px;
    padding: 1rem 0.75rem;
  }

  .side-nav-items {
    align-items: stretch;
    gap: 0.125rem;
  }

  .side-nav-tab {
    flex-direction: row;
    width: auto;
    height: 44px;
    padding: 0 0.875rem;
    font-size: 0.8125rem;
    font-weight: 500;
    gap: 0.75rem;
    border-radius: 10px;
    justify-content: flex-start;
  }
}
</style>
