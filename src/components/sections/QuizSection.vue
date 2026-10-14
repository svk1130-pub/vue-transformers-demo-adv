<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProgressStore } from '@/stores/progress'

const props = defineProps({ section: { type: Object, required: true } })

const route = useRoute()
const progress = useProgressStore()

const answers = ref(props.section.body.map(() => null))
const submitted = ref(false)

const allCorrect = computed(() =>
  props.section.body.every((q, i) => answers.value[i] === q.correct),
)
const correctCount = computed(() =>
  props.section.body.filter((q, i) => answers.value[i] === q.correct).length,
)
const canSubmit = computed(() => answers.value.every((a) => a !== null))

function submit() {
  if (!canSubmit.value) return
  submitted.value = true
  if (allCorrect.value) {
    progress.markQuizPassed(route.name)
  }
}

function reset() {
  answers.value = props.section.body.map(() => null)
  submitted.value = false
}
</script>

<template>
  <section class="quiz-section">
    <h2 class="quiz-section__title">{{ section.title }}</h2>
    <p v-if="section.intro" class="quiz-section__intro">{{ section.intro }}</p>

    <TransitionGroup name="quiz" tag="div" class="quiz-section__questions">
      <div
        v-for="(q, qi) in section.body"
        :key="qi"
        class="quiz-section__question"
      >
        <p class="quiz-section__q-text">
          <span class="quiz-section__q-num">{{ qi + 1 }}.</span>
          {{ q.q }}
        </p>
        <div class="quiz-section__options">
          <label
            v-for="(opt, oi) in q.options"
            :key="oi"
            class="quiz-section__option"
            :class="{
              correct: submitted && oi === q.correct,
              wrong:   submitted && answers[qi] === oi && oi !== q.correct,
              selected: !submitted && answers[qi] === oi,
            }"
          >
            <input
              type="radio"
              :value="oi"
              v-model="answers[qi]"
              :disabled="submitted"
              class="quiz-section__radio"
            />
            <span class="quiz-section__opt-text">{{ opt }}</span>
          </label>
        </div>
        <Transition name="fade">
          <p v-if="submitted" class="quiz-section__explanation">
            <strong>Объяснение:</strong> {{ q.explanation }}
          </p>
        </Transition>
      </div>
    </TransitionGroup>

    <div class="quiz-section__actions">
      <button
        v-if="!submitted"
        class="quiz-section__btn"
        :disabled="!canSubmit"
        @click="submit"
      >
        Проверить
      </button>
      <template v-else>
        <Transition name="fade">
          <p class="quiz-section__result" :class="{ all: allCorrect }">
            Правильно: {{ correctCount }} из {{ section.body.length }}
            <span v-if="allCorrect"> — всё верно! 🎉</span>
          </p>
        </Transition>
        <button class="quiz-section__btn quiz-section__btn--ghost" @click="reset">
          Пройти заново
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.quiz-section__title { font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
.quiz-section__intro { font-size: 14px; color: var(--color-text-muted); margin-bottom: 16px; }
.quiz-section__questions { display: flex; flex-direction: column; gap: 20px; }
.quiz-section__question { padding: 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.quiz-section__q-text { font-size: 15px; font-weight: 500; color: var(--color-text); margin-bottom: 12px; }
.quiz-section__q-num { color: var(--color-primary-dark); font-weight: 700; margin-right: 4px; }
.quiz-section__options { display: flex; flex-direction: column; gap: 8px; }
.quiz-section__option { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; transition: background-color 0.2s ease, border-color 0.2s ease; }
.quiz-section__option:hover { background: var(--color-surface-alt); }
.quiz-section__option.selected { border-color: var(--color-primary); background: var(--color-primary-soft); }
.quiz-section__option.correct { background: #d4edda; border-color: #6db979; }
.quiz-section__option.wrong { background: #f8d7da; border-color: #e5a5ac; }
.quiz-section__radio { margin: 0; accent-color: var(--color-primary); }
.quiz-section__opt-text { font-size: 14px; color: var(--color-text); }
.quiz-section__explanation { margin-top: 12px; padding: 12px; background: var(--color-surface-alt); border-radius: var(--radius-sm); font-size: 13px; line-height: 1.5; color: var(--color-text-muted); }
.quiz-section__actions { margin-top: 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.quiz-section__btn { padding: 10px 22px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.2s ease, transform 0.15s ease; }
.quiz-section__btn:hover:not(:disabled) { background: var(--color-primary-dark); transform: translateY(-1px); }
.quiz-section__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.quiz-section__btn--ghost { background: var(--color-surface-alt); color: var(--color-text); border: 1px solid var(--color-border); }
.quiz-section__btn--ghost:hover { background: var(--color-surface); border-color: var(--color-primary); }
.quiz-section__result { font-size: 15px; font-weight: 600; color: var(--color-text); }
.quiz-section__result.all { color: var(--color-primary-dark); }
.quiz-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: calc(var(--i, 0) * 60ms); }
.quiz-enter-from { opacity: 0; transform: translateY(16px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
