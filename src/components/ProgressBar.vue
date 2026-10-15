<script setup>
defineProps({ value: { type: Number, default: 0, validator: (v) => v >= 0 && v <= 100 } })
</script>

<template>
  <div class="progress">
    <div class="progress__track">
      <div class="progress__fill" :style="{ width: `${value}%` }"></div>
    </div>
    <span class="progress__label">{{ value }}%</span>
  </div>
</template>

<style scoped>
.progress { display: flex; align-items: center; gap: 12px; width: 100%; }
.progress__track { flex: 1; height: 8px; background: var(--color-surface-alt); border-radius: 999px; overflow: hidden; }
.progress__fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark)); border-radius: 999px; transition: width 0.3s ease; min-width: 0; }
.progress__label { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--color-text-muted); min-width: 36px; text-align: right; }
</style>
