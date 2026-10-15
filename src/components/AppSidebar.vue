<script setup>
import { useDemoStore } from '@/stores/demoStore'
import { useProgressStore } from '@/stores/progress'
import { storeToRefs } from 'pinia'
import { techStackShort } from '@/data/techStack'

const demoStore = useDemoStore()
const progress = useProgressStore()
const { currentModel } = storeToRefs(demoStore)

const navItems = [
  { to: '/', label: 'Хаб', icon: '◆', page: null },
  { to: '/detector', label: 'Детектор объектов', icon: '◎', page: 'detector' },
  { to: '/translator', label: 'Переводчик', icon: '⇄', page: 'translator' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <span class="sidebar__logo">V</span>
      <div class="sidebar__title">
        <strong>Vue 3 + transformers.js</strong>
        <small>учебное демо</small>
      </div>
    </div>

    <nav class="sidebar__nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__link"
      >
        <span class="sidebar__icon">{{ item.icon }}</span>
        <span class="sidebar__label">{{ item.label }}</span>
        <Transition name="fade">
          <span
            v-if="item.page && progress.isVisited(item.page)"
            class="sidebar__check"
            title="Страница изучена"
          >✓</span>
        </Transition>
      </RouterLink>
    </nav>

    <Transition name="fade">
      <div v-if="currentModel" class="sidebar__model-info">
        <div class="sidebar__model-label">Активная модель</div>
        <code class="sidebar__model-name">{{ currentModel.name }}</code>
      </div>
    </Transition>

    <div class="sidebar__footer">
      <span>{{ techStackShort.join(' · ') }}</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar { width: var(--sidebar-width); flex-shrink: 0; background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; padding: 24px 16px; gap: 24px; position: sticky; top: 0; height: 100vh; }
.sidebar__brand { display: flex; align-items: center; gap: 12px; padding: 0 8px; }
.sidebar__logo { width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--color-primary); color: #fff; font-size: 22px; font-weight: 700; display: grid; place-items: center; flex-shrink: 0; }
.sidebar__title { display: flex; flex-direction: column; line-height: 1.2; }
.sidebar__title strong { font-size: 14px; color: var(--color-text); }
.sidebar__title small { font-size: 11px; color: var(--color-text-muted); }
.sidebar__nav { display: flex; flex-direction: column; gap: 4px; }
.sidebar__link { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); color: var(--color-text-muted); font-size: 14px; font-weight: 500; transition: background-color 0.2s ease, color 0.2s ease; }
.sidebar__link:hover { background: var(--color-surface-alt); color: var(--color-text); text-decoration: none; }
.sidebar__link.router-link-active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
.sidebar__link.router-link-active .sidebar__icon { color: var(--color-primary); }
.sidebar__icon { font-size: 16px; width: 20px; text-align: center; }
.sidebar__label { flex: 1; }
.sidebar__check { color: var(--color-primary); font-weight: 700; font-size: 14px; }
.sidebar__model-info { margin-top: auto; padding: 12px; background: var(--color-surface-alt); border-radius: var(--radius-md); }
.sidebar__model-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 4px; }
.sidebar__model-name { font-size: 12px; word-break: break-all; color: var(--color-text); }
.sidebar__footer { font-size: 11px; color: var(--color-text-muted); text-align: center; padding-top: 12px; border-top: 1px solid var(--color-border); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
