<script setup>
import { inject } from 'vue'

const props = defineProps({ section: { type: Object, required: true } })
const loadSample = inject('loadSample', null)

function onClick(item) {
  if (loadSample) loadSample(item.src)
}
</script>

<template>
  <section class="gallery-section">
    <h2 class="gallery-section__title">{{ section.title }}</h2>
    <p v-if="section.intro" class="gallery-section__intro">{{ section.intro }}</p>

    <TransitionGroup name="gallery" tag="div" class="gallery-section__grid" appear>
      <button
        v-for="(item, index) in section.items"
        :key="item.src"
        type="button"
        class="gallery-section__card"
        :style="{ '--i': index }"
        @click="onClick(item)"
      >
        <div class="gallery-section__thumb">
          <img :src="item.src" :alt="item.caption" loading="lazy" />
        </div>
        <div class="gallery-section__info">
          <span class="gallery-section__caption">{{ item.caption }}</span>
          <span v-if="item.hint" class="gallery-section__hint">{{ item.hint }}</span>
        </div>
        <span class="gallery-section__cta">Загрузить в демо →</span>
      </button>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.gallery-section__title { font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
.gallery-section__intro { font-size: 14px; color: var(--color-text-muted); margin-bottom: 16px; line-height: 1.5; }
.gallery-section__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.gallery-section__card { display: flex; flex-direction: column; text-align: left; padding: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; font-family: inherit; }
.gallery-section__card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--color-primary); }
.gallery-section__thumb { width: 100%; aspect-ratio: 4 / 3; background: var(--color-surface-alt); overflow: hidden; }
.gallery-section__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gallery-section__info { padding: 10px 12px 4px; display: flex; flex-direction: column; gap: 2px; }
.gallery-section__caption { font-size: 14px; font-weight: 600; color: var(--color-text); }
.gallery-section__hint { font-size: 12px; color: var(--color-text-muted); }
.gallery-section__cta { padding: 8px 12px 12px; font-size: 12px; font-weight: 600; color: var(--color-primary-dark); }
.gallery-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: calc(var(--i, 0) * 60ms); }
.gallery-enter-from { opacity: 0; transform: translateY(20px) scale(0.96); }
.gallery-leave-active { transition: opacity 0.3s ease; position: absolute; }
.gallery-leave-to { opacity: 0; }
.gallery-move { transition: transform 0.4s ease; }
</style>
