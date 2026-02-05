import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ActivateView from '../views/ActivateView.vue'
import LeaderboardView from '../views/LeaderboardView.vue'
import { useAuthStore } from '@/stores/auth'

let sessionChecked = false

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/activate',
      name: 'activate',
      component: ActivateView,
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'standings',
      component: LeaderboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/matches',
      name: 'matches',
      component: () => import('../views/MatchesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/more',
      name: 'more',
      component: () => import('../views/MoreView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!sessionChecked) {
    try {
      await authStore.checkSession()
    } catch {
      // If checkSession fails, continue with navigation
      // User will be redirected to login if route requires auth
    } finally {
      sessionChecked = true
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (!to.meta.requiresAuth && authStore.isAuthenticated && to.name === 'login') {
    return { path: '/' }
  }
})

export default router
