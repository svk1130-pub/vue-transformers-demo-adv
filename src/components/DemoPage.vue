<script setup>
import { computed, markRaw, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  demoComponent: { type: Object, required: true },
})

const route = useRoute()
const router = useRouter()

const HowItWorksPanel = defineAsyncComponent(() => import('./HowItWorksPanel.vue'))

const tabs = {
  demo: markRaw(props.demoComponent),
  how: markRaw(HowItWorksPanel),
}

const active = computed(() => (route.query.tab === 'how' ? 'how' : 'demo'))

function switchTab(key) {
  router.replace({ query: key === 'demo' ? {} : { tab: key } })
}
</script>

<template>
  <div class="demo-page">
    <div class="demo-page__tabs">
      <button
        type="button"
        class="demo-page__tab"
        :class="{ active: active === 'demo' }"
        @click="switchTab('demo')"
      >
        Демо
      </button>
      <button
        type="button"
        class="demo-page__tab"
        :class="{ active: active === 'how' }"
        @click="switchTab('how')"
      >
        Как это работает
      </button>
    </div>

    <div class="demo-page__content">
      <Transition name="fade">
        <KeepAlive>
          <component :is="tabs[active]" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.demo-page__tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 24px; }
.demo-page__tab { padding: 10px 18px; background: transparent; border: none; border-bottom: 2px solid transparent; font-size: 14px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; transition: color 0.2s ease, border-color 0.2s ease; margin-bottom: -1px; }
.demo-page__tab:hover { color: var(--color-text); }
.demo-page__tab.active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
.demo-page__content { position: relative; }
.demo-page__content > :deep(*) { position: absolute; top: 0; left: 0; right: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
