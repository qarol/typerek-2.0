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

  <!-- Desktop: sticky top bar -->
  <header v-else class="top-nav">
    <div class="top-nav-inner">
      <!-- Brand -->
      <div class="brand">
        <img src="/logo.png" alt="Typerek" class="brand-logo" />
        <span class="brand-name">Typerek</span>
      </div>

      <!-- Nav links -->
      <nav class="top-nav-links">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="top-nav-link"
          :class="{ active: isActive(tab.to) }"
        >
          <i :class="tab.icon"></i>
          <span>{{ t(tab.label) }}</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* ===== Bottom Navigation (Mobile) ===== */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
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

.nav-tab span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 72px;
}

.nav-tab.active {
  color: #0d9488;
}

.nav-tab:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
  border-radius: 8px;
}

/* ===== Top Navigation (Desktop) ===== */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.top-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.brand-name {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.25rem;
  color: #0f766e;
  letter-spacing: -0.02em;
}

.top-nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: 100%;
}

.top-nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding: 0 1rem;
  text-decoration: none;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.top-nav-link i {
  font-size: 1rem;
}

.top-nav-link:hover {
  color: #0d9488;
}

.top-nav-link.active {
  color: #0d9488;
  font-weight: 700;
  border-bottom-color: #0d9488;
}

.top-nav-link:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
  border-radius: 4px;
}
</style>
