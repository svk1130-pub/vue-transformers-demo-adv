import { defineStore } from 'pinia'

export const useDemoStore = defineStore('demo', {
  state: () => ({
    currentModel: null,
    globalError: null,
  }),
  actions: {
    setCurrentModel(model) { this.currentModel = model },
    clearCurrentModel() { this.currentModel = null },
    setGlobalError(message) { this.globalError = message },
    clearGlobalError() { this.globalError = null },
  },
})
