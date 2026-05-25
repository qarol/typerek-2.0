<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'

const { t } = useI18n()
const route = useRoute()
const matchesStore = useMatchesStore()

const tournamentPct = computed(() => {
  if (!matchesStore.totalMatches) return 0
  return Math.round((matchesStore.scoredMatches / matchesStore.totalMatches) * 100)
})

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

  if (matchesStore.matches.length === 0) {
    matchesStore.fetchMatchesSilent()
  }
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
})
</script>

<template>
  <!-- Mobile: tournament progress strip above bottom nav -->
  <div
    v-if="!isDesktop && matchesStore.totalMatches > 0"
    class="mobile-progress-strip"
    aria-hidden="true"
  >
    <div class="mobile-progress-fill" :style="{ width: `${tournamentPct}%` }" />
  </div>

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

      <!-- Desktop: tournament progress pill -->
      <div v-if="matchesStore.totalMatches > 0" class="desktop-progress" aria-hidden="true">
        <span class="desktop-progress-label">{{ matchesStore.scoredMatches }}<span class="desktop-progress-total">/{{ matchesStore.totalMatches }}</span></span>
        <div class="desktop-progress-track">
          <div class="desktop-progress-fill" :style="{ width: `${tournamentPct}%` }" />
        </div>
      </div>
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

/* ===== Desktop Progress Pill ===== */
.desktop-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 1.5rem;
}

.desktop-progress-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #00685f;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.desktop-progress-total {
  font-weight: 500;
  color: #9ca3af;
}

.desktop-progress-track {
  width: 80px;
  height: 4px;
  background: #e8e8e8;
  border-radius: 99px;
  overflow: hidden;
}

.desktop-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00685f, #0d9488);
  transition: width 0.6s ease;
}

/* ===== Mobile Progress Strip ===== */
.mobile-progress-strip {
  position: fixed;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  left: 0;
  right: 0;
  height: 3px;
  background: #e8e8e8;
  z-index: 99;
}

.mobile-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00685f, #0d9488);
  border-radius: 0 99px 99px 0;
  transition: width 0.6s ease;
}
</style>
