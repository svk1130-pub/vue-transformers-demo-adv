<script setup>
defineProps({
  icon: { type: String, default: '◆' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  to: { type: String, required: true },
})
</script>

<template>
  <RouterLink :to="to" class="demo-card">
    <div class="demo-card__icon">{{ icon }}</div>
    <h3 class="demo-card__title">{{ title }}</h3>
    <p class="demo-card__desc">{{ description }}</p>
    <span class="demo-card__cta">Открыть →</span>
  </RouterLink>
</template>

<style scoped>
.demo-card { display: flex; flex-direction: column; gap: 10px; padding: 28px 24px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease, border-color 0.25s ease; color: inherit; }
.demo-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-primary); text-decoration: none; }
.demo-card__icon { width: 56px; height: 56px; border-radius: var(--radius-md); background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: 28px; display: grid; place-items: center; }
.demo-card__title { font-size: 20px; margin-top: 4px; }
.demo-card__desc { color: var(--color-text-muted); font-size: 14px; flex: 1; }
.demo-card__cta { font-size: 14px; font-weight: 600; color: var(--color-primary-dark); margin-top: 8px; }
</style>
