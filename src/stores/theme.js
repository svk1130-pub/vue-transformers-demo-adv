import { defineStore } from 'pinia'

const STORAGE_KEY = 'vue-transformers-theme'

const DARK_VARS = {
  '--color-bg': '#0d1117',
  '--color-surface': '#161b22',
  '--color-surface-alt': '#21262d',
  '--color-border': '#30363d',
  '--color-text': '#e6edf3',
  '--color-text-muted': '#8b949e',
  '--color-primary': '#42b883',
  '--color-primary-dark': '#529286',
  '--color-primary-soft': '#1f2a25',
  '--color-accent': '#3b82f6',
}

export const useThemeStore = defineStore('theme', {
  state: () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return { theme: saved || 'system' }
  },
  getters: {
    isDark: (s) => {
      if (s.theme === 'dark') return true
      if (s.theme === 'light') return false
      return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    },
    icon: (s) => s.isDark ? '☀️' : '🌙',
  },
  actions: {
    toggle() {
      this.theme = this.isDark ? 'light' : 'dark'
      this.persist()
      this.apply()
    },
    apply() {
      const root = document.documentElement
      if (this.isDark) {
        for (const [key, value] of Object.entries(DARK_VARS)) {
          root.style.setProperty(key, value)
        }
      } else {
        for (const key of Object.keys(DARK_VARS)) {
          root.style.removeProperty(key)
        }
      }
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, this.theme)
    },
  },
})
