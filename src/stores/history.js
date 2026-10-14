import { defineStore } from 'pinia'

const STORAGE_KEY = 'vue-transformers-history'
const MAX_ITEMS = 5

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

export const useHistoryStore = defineStore('history', {
  state: () => ({ items: load() }),
  getters: {
    recent: (s) => s.items.slice(0, MAX_ITEMS),
    hasItems: (s) => s.items.length > 0,
  },
  actions: {
    add(item) {
      this.items = this.items.filter((i) => i.source !== item.source)
      this.items.unshift({ ...item, id: Date.now(), timestamp: new Date().toISOString() })
      this.items = this.items.slice(0, MAX_ITEMS)
      this.persist()
    },
    remove(id) {
      this.items = this.items.filter((i) => i.id !== id)
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    },
  },
})
