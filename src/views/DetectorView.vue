<script setup>
import { provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import DemoPage from '@/components/DemoPage.vue'
import DetectorPanel from '@/components/panels/DetectorPanel.vue'

const router = useRouter()

const detectedClasses = ref([])
const pendingSample = ref(null)

provide('detectedClasses', detectedClasses)
provide('pendingSample', pendingSample)

provide('loadSample', (src) => {
  pendingSample.value = src
  router.replace({ query: { tab: 'demo' } })
})
</script>

<template>
  <DemoPage :demo-component="DetectorPanel" />
</template>
