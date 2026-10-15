<script setup>
import DemoCard from '@/components/DemoCard.vue'
import { useProgressStore } from '@/stores/progress'
import { techStackFull } from '@/data/techStack'
import { ref } from 'vue'

const progress = useProgressStore()

const demos = ref([
  {
    icon: '◎',
    title: 'Детектор объектов',
    description: 'Загрузите изображение и нейросеть найдёт объекты на нём. Рисуем bounding box-ы прямо на canvas и показываем подписи классов с уверенностью модели.',
    to: '/detector',
  },
  {
    icon: '⇄',
    title: 'Переводчик',
    description: 'Перевод между русским и английским с автоопределением направления. Текст разбивается на предложения и переводится инкрементально — результат появляется по одному предложению за раз.',
    to: '/translator',
  },
])

function resetProgress() {
  if (confirm('Сбросить весь прогресс изучения?')) {
    progress.reset()
  }
}
</script>

<template>
  <section class="home">
    <header class="home__header">
      <h1>Демо нейросетей в браузере</h1>
      <p class="home__lead">
        Учебный SPA на Vue 3, демонстрирующий Composition API, Router, Pinia и
        Transition-анимации на «вау-задачах» из машинного обучения. Модели
        работают прямо в браузере через transformers.js — без сервера.
      </p>
    </header>

    <section class="home__progress">
      <div class="home__progress-bar">
        <div class="home__progress-fill" :style="{ width: progress.percent + '%' }"></div>
      </div>
      <div class="home__progress-info">
        <p class="home__progress-text">
          Изучено: <strong>{{ progress.visitedCount }}</strong> из {{ progress.total }}
          <Transition name="fade">
            <span v-if="progress.isComplete" class="home__progress-done"> — всё пройдено! 🎉</span>
          </Transition>
        </p>
        <Transition name="fade">
          <button
            v-if="progress.visitedCount > 0"
            class="home__progress-reset"
            @click="resetProgress"
          >
            Сбросить прогресс
          </button>
        </Transition>
      </div>
    </section>

    <TransitionGroup tag="div" name="list" class="home__grid" appear>
      <DemoCard
        v-for="(demo, index) in demos"
        :key="demo.to"
        :icon="demo.icon"
        :title="demo.title"
        :description="demo.description"
        :to="demo.to"
        :style="{ '--i': index }"
      />
    </TransitionGroup>

    <section class="home__tech">
      <h2>Технологии Vue 3</h2>
      <div class="home__tech-grid">
        <div
          v-for="group in techStackFull"
          :key="group.category"
          class="home__tech-group"
        >
          <h3 class="home__tech-cat">{{ group.category }}</h3>
          <ul class="home__tech-list">
            <li v-for="item in group.items" :key="item.name">
              <code>{{ item.name }}</code>
              <span class="home__tech-detail">{{ item.detail }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.home__header { margin-bottom: 24px; }
.home__header h1 { font-size: 32px; margin-bottom: 12px; }
.home__lead { font-size: 16px; color: var(--color-text-muted); max-width: 720px; }
.home__progress { padding: 20px 24px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: 32px; }
.home__progress-bar { width: 100%; height: 10px; background: var(--color-surface-alt); border-radius: 999px; overflow: hidden; margin-bottom: 12px; }
.home__progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark)); border-radius: 999px; transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.home__progress-info { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.home__progress-text { font-size: 14px; color: var(--color-text-muted); }
.home__progress-text strong { color: var(--color-text); }
.home__progress-done { color: var(--color-primary-dark); font-weight: 600; }
.home__progress-reset { padding: 6px 14px; background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-muted); font-size: 13px; cursor: pointer; transition: border-color 0.2s ease, color 0.2s ease; }
.home__progress-reset:hover { border-color: var(--color-danger); color: var(--color-danger); }
.home__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-bottom: 48px; }
.home__tech { padding: 24px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.home__tech h2 { font-size: 18px; margin-bottom: 16px; }
.home__tech-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
.home__tech-group { display: flex; flex-direction: column; }
.home__tech-cat { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary-dark); margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--color-border); }
.home__tech-list { display: flex; flex-direction: column; gap: 6px; }
.home__tech-list li { list-style: none; display: flex; flex-direction: column; gap: 2px; }
.home__tech-list code { font-family: var(--font-mono); font-size: 12px; background: var(--color-surface-alt); padding: 1px 6px; border-radius: 4px; align-self: flex-start; color: var(--color-text); }
.home__tech-detail { font-size: 12px; color: var(--color-text-muted); line-height: 1.4; }
.list-enter-active { transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: calc(var(--i, 0) * 120ms); }
.list-enter-from { opacity: 0; transform: translateY(24px) scale(0.96); }
.list-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; position: absolute; }
.list-leave-to { opacity: 0; transform: scale(0.96); }
.list-move { transition: transform 0.4s ease; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
