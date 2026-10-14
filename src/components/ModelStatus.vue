<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'idle', validator: (v) => ['idle', 'loading', 'ready', 'error'].includes(v) },
})

const meta = computed(() => {
  switch (props.status) {
    case 'loading': return { color: 'var(--color-warning)', text: 'Загрузка модели…', dot: true }
    case 'ready':   return { color: 'var(--color-success)', text: 'Модель готова', dot: false }
    case 'error':   return { color: 'var(--color-danger)',  text: 'Ошибка загрузки', dot: false }
    default:        return { color: 'var(--color-text-muted)', text: 'Модель не загружена', dot: false }
  }
})
</script>

<template>
  <div class="model-status" :style="{ '--status-color': meta.color }">
    <span class="model-status__dot" :class="{ pulse: meta.dot }"></span>
    <Transition name="fade" mode="out-in">
      <span :key="meta.text" class="model-status__text">{{ meta.text }}</span>
    </Transition>
  </div>
</template>

<style scoped>
.model-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--status-color); }
.model-status__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--status-color); flex-shrink: 0; }
.model-status__dot.pulse { animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.75); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
