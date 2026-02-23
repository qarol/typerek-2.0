import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import TyperekPreset from './theme-preset'
import en from './locales/en.json'
import pl from './locales/pl.json'
import { LOCALE_KEY, SUPPORTED_LOCALES } from './utils/locale'

const savedLocale = localStorage.getItem(LOCALE_KEY)
const browserLang = navigator.language.startsWith('pl') ? 'pl' : 'en'
const initialLocale = SUPPORTED_LOCALES.includes(savedLocale as 'en' | 'pl') ? (savedLocale as 'en' | 'pl') : browserLang

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: { en, pl },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: TyperekPreset,
    options: {
      darkModeSelector: '.light-mode-only',
      cssLayer: false,
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
