<script setup>
import { provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import DemoPage from '@/components/DemoPage.vue'
import TranslatorPanel from '@/components/panels/TranslatorPanel.vue'

const router = useRouter()

const pendingText = ref(null)

provide('pendingText', pendingText)

provide('loadExample', (text) => {
  pendingText.value = text
  router.replace({ query: { tab: 'demo' } })
})
</script>

<template>
  <DemoPage :demo-component="TranslatorPanel" />
</template>
