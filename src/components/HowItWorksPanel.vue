<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { detectorHowItWorks } from '@/content/detector'
import { translatorHowItWorks } from '@/content/translator'
import { useProgressStore } from '@/stores/progress'

import TextSection from './sections/TextSection.vue'
import ListSection from './sections/ListSection.vue'
import ChipsSection from './sections/ChipsSection.vue'
import GallerySection from './sections/GallerySection.vue'
import ExamplesSection from './sections/ExamplesSection.vue'
import QuizSection from './sections/QuizSection.vue'

const route = useRoute()
const progress = useProgressStore()

const componentByType = {
  text: TextSection,
  list: ListSection,
  chips: ChipsSection,
  gallery: GallerySection,
  examples: ExamplesSection,
  quiz: QuizSection,
}

const sections = computed(() => {
  if (route.name === 'detector') return detectorHowItWorks
  if (route.name === 'translator') return translatorHowItWorks
  return []
})

onMounted(() => {
  if (route.name === 'detector' || route.name === 'translator') {
    progress.markVisited(route.name)
  }
})
</script>

<template>
  <article class="how-it-works">
    <TransitionGroup name="list" tag="div" class="how-it-works__sections" appear>
      <component
        v-for="(section, index) in sections"
        :key="section.id"
        :is="componentByType[section.type]"
        :section="section"
        :style="{ '--i': index }"
      />
    </TransitionGroup>
  </article>
</template>

<style scoped>
.how-it-works__sections { display: flex; flex-direction: column; gap: 2rem; max-width: 800px; }
.list-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: calc(var(--i, 0) * 100ms); }
.list-enter-from { opacity: 0; transform: translateY(20px); }
.list-leave-active { transition: opacity 0.3s ease; position: absolute; }
.list-leave-to { opacity: 0; }
.list-move { transition: transform 0.4s ease; }
</style>
