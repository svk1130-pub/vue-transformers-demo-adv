<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'
import AppSidebar from './components/AppSidebar.vue'

const themeStore = useThemeStore()
const { icon } = storeToRefs(themeStore)

onMounted(() => {
  themeStore.apply()
})
</script>

<template>
  <div class="app-shell">
    <Transition name="slide" appear>
      <AppSidebar />
    </Transition>

    <main class="app-main">
      <!-- ★ Решение 14: кнопка темы в правом верхнем углу main, sticky -->
      <button
        class="theme-toggle"
        @click="themeStore.toggle"
        :title="themeStore.isDark ? 'Светлая тема' : 'Тёмная тема'"
      >
        <Transition name="fade" mode="out-in">
          <span :key="icon">{{ icon }}</span>
        </Transition>
      </button>

      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in" class="app-route-transition">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }
.app-main {
  flex: 1;
  min-width: 0;
  padding: 32px 40px 64px;
  max-width: var(--content-max);
  display: flex;
  flex-direction: column;
}

/* ★ Кнопка темы — в правом верхнем углу main, скроллится вместе со страницей */
.theme-toggle {
  align-self: flex-end;
  margin-bottom: 16px;
  z-index: 10;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 18px;
  box-shadow: var(--shadow-sm);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.theme-toggle:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-primary);
}

.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease; }
.slide-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-leave-to { transform: translateX(-100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ★ Отступ для контента под кнопкой темы (кнопка прижата вправо через align-self) */
.app-route-transition {
  margin-top: -64px;
}
</style>
