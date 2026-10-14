<script setup>
import { ref, computed, inject } from 'vue'
import { COCO_CLASSES } from '@/content/coco'

const props = defineProps({ section: { type: Object, required: true } })

const detectedClasses = inject('detectedClasses', ref([]))
const query = ref('')

const allItems = computed(() => {
  if (props.section.itemsSource === 'coco') return COCO_CLASSES
  return []
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allItems.value
  return allItems.value.filter(
    (item) => item.en.toLowerCase().includes(q) || item.ru.toLowerCase().includes(q),
  )
})

function isDetected(en) {
  return detectedClasses.value.includes(en)
}
</script>

<template>
  <section class="chips-section">
    <h2 class="chips-section__title">{{ section.title }}</h2>
    <p v-if="section.intro" class="chips-section__intro">{{ section.intro }}</p>

    <div class="chips-section__search">
      <input
        v-model="query"
        type="text"
        placeholder="Поиск класса: apple, банан, человек…"
        class="chips-section__input"
      />
      <span class="chips-section__count">{{ filtered.length }} / {{ allItems.length }}</span>
    </div>

    <TransitionGroup name="chips" tag="div" class="chips-section__grid">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="chips-section__chip"
        :class="{ found: isDetected(item.en) }"
      >
        <span class="chips-section__chip-en">{{ item.en }}</span>
        <span class="chips-section__chip-ru">{{ item.ru }}</span>
        <span v-if="isDetected(item.en)" class="chips-section__chip-dot" title="Найден на текущем изображении">✓</span>
      </div>
    </TransitionGroup>

    <p v-if="filtered.length === 0" class="chips-section__empty">
      Ничего не найдено. Попробуйте изменить запрос.
    </p>
  </section>
</template>

<style scoped>
.chips-section__title { font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
.chips-section__intro { font-size: 14px; color: var(--color-text-muted); margin-bottom: 16px; line-height: 1.5; }
.chips-section__search { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.chips-section__input { flex: 1; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: 14px; background: var(--color-surface); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.chips-section__input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.chips-section__count { font-size: 12px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.chips-section__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.chips-section__chip { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 999px; font-size: 13px; transition: background-color 0.2s ease, border-color 0.2s ease; }
.chips-section__chip.found { background: #d4edda; border-color: #6db979; }
.chips-section__chip-en { font-weight: 600; color: var(--color-text); }
.chips-section__chip-ru { color: var(--color-text-muted); font-size: 12px; }
.chips-section__chip-dot { margin-left: auto; color: #2c7a3d; font-weight: 700; }
.chips-section__empty { font-size: 14px; color: var(--color-text-muted); font-style: italic; padding: 16px 0; }
.chips-enter-active, .chips-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.chips-enter-from, .chips-leave-to { opacity: 0; transform: scale(0.9); }
.chips-leave-active { position: absolute; }
.chips-move { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
</style>
