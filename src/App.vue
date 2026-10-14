<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import AppSidebar from './components/AppSidebar.vue'

const themeStore = useThemeStore()

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
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }
.app-main { flex: 1; min-width: 0; padding: 32px 40px 64px; max-width: var(--content-max); }
.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease; }
.slide-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-leave-to { transform: translateX(-100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
