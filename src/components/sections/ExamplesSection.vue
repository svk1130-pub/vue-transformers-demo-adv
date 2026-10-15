<script setup>
import { inject } from 'vue'

const props = defineProps({ section: { type: Object, required: true } })
const loadExample = inject('loadExample', null)

function onClick(item) {
  if (loadExample) loadExample(item.text)
}
</script>

<template>
  <section class="examples-section">
    <h2 class="examples-section__title">{{ section.title }}</h2>
    <p v-if="section.intro" class="examples-section__intro">{{ section.intro }}</p>

    <TransitionGroup name="examples" tag="div" class="examples-section__list" appear>
      <button
        v-for="(item, index) in section.items"
        :key="index"
        type="button"
        class="examples-section__card"
        :style="{ '--i': index }"
        @click="onClick(item)"
      >
        <span class="examples-section__mark" :class="'mark-' + item.mark">{{ item.mark }}</span>
        <span class="examples-section__text">{{ item.text }}</span>
        <span class="examples-section__cta">Перевести →</span>
      </button>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.examples-section__title { font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
.examples-section__intro { font-size: 14px; color: var(--color-text-muted); margin-bottom: 16px; line-height: 1.5; }
.examples-section__list { display: flex; flex-direction: column; gap: 12px; }
.examples-section__card { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; text-align: left; padding: 16px 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; font-family: inherit; }
.examples-section__card:hover { transform: translateY(-2px); border-color: var(--color-primary); box-shadow: var(--shadow-md); }
.examples-section__mark { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.mark-лирический { background: #e0e8f5; color: #3b82f6; }
.mark-ироничный { background: #f5e0eb; color: #c94579; }
.mark-пейзажный { background: #e0f5e8; color: #2c7a3d; }
.mark-диалог { background: #f5ede0; color: #a06a2c; }
.mark-философский { background: #ede0f5; color: #7a4cc9; }
.examples-section__text { font-size: 14px; line-height: 1.55; color: var(--color-text); white-space: pre-line; }
.examples-section__cta { font-size: 12px; font-weight: 600; color: var(--color-primary-dark); margin-top: 4px; }
.examples-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: calc(var(--i, 0) * 80ms); }
.examples-enter-from { opacity: 0; transform: translateX(20px); }
.examples-leave-active { transition: opacity 0.3s ease; position: absolute; }
.examples-leave-to { opacity: 0; }
.examples-move { transition: transform 0.4s ease; }
</style>
