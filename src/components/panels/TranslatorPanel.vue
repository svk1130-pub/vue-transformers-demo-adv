<script setup>
/**
 * TranslatorPanel.vue — демо-логика переводчика.
 * Содержит ВСЕ 12 решений из HOWTODO.md (где относятся к переводчику):
 *   3.  Кнопка «Очистить»
 *   4.  Кнопка «Копировать» + toast через <Teleport>
 *   6.  SVG-кольцо для счётчика символов
 *   7.  История переводов в Pinia
 *   9.  Кнопка «Озвучить перевод» (speechSynthesis)
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, inject, nextTick } from 'vue'
import { usePipeline } from '@/composables/usePipeline'
import { useDemoStore } from '@/stores/demoStore'
import { useHistoryStore } from '@/stores/history'
import ModelStatus from '@/components/ModelStatus.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'

const MAX_CHARS = 500

const MODELS = {
  ru_en: { task: 'translation', model: 'Xenova/opus-mt-ru-en', label: 'RU → EN' },
  en_ru: { task: 'translation', model: 'Xenova/opus-mt-en-ru', label: 'EN → RU' },
}

const demoStore = useDemoStore()
const historyStore = useHistoryStore()

const ruEn = usePipeline(MODELS.ru_en.task, MODELS.ru_en.model, { dtype: 'q8' })
const enRu = usePipeline(MODELS.en_ru.task, MODELS.en_ru.model, { dtype: 'q8' })

const pendingText = inject('pendingText', ref(null))

// --- Состояние ---
const inputText = ref('')
const direction = ref('auto')
const manualOverride = ref(false)
const translating = ref(false)
const translatedSentences = ref([])
const pageError = ref(null)

// --- Автоопределение ---
function detectDirection(text) {
  if (/[а-яёА-ЯЁ]/.test(text)) return 'ru_en'
  return 'en_ru'
}

const effectiveDirection = computed(() => {
  if (manualOverride.value) return direction.value
  return detectDirection(inputText.value)
})

const currentPipeline = computed(() =>
  effectiveDirection.value === 'ru_en' ? ruEn : enRu,
)

const directionLabel = computed(() => MODELS[effectiveDirection.value].label)

const status = computed(() => {
  const p = currentPipeline.value
  if (p.error.value) return 'error'
  if (p.loading.value) return 'loading'
  if (p.instance.value) return 'ready'
  return 'idle'
})

const currentProgress = computed(() => currentPipeline.value.progress.value)
const currentLoading = computed(() => currentPipeline.value.loading.value)
const currentError = computed(() => currentPipeline.value.error.value)

const charCount = computed(() => inputText.value.length)
const charCountClass = computed(() => {
  if (charCount.value > MAX_CHARS) return 'over'
  if (charCount.value > MAX_CHARS * 0.9) return 'warn'
  return ''
})

// === Решение 6: SVG-кольцо ===
const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const ringPercent = computed(() => Math.min(charCount.value / MAX_CHARS, 1))
const ringDashoffset = computed(() =>
  RING_CIRCUMFERENCE * (1 - ringPercent.value),
)
const ringColor = computed(() => {
  if (charCount.value > MAX_CHARS) return 'var(--color-danger)'
  if (charCount.value > MAX_CHARS * 0.9) return 'var(--color-warning)'
  return 'var(--color-primary)'
})

// === Решение 4: копирование ===
const fullTranslation = computed(() =>
  translatedSentences.value.map((s) => s.target).join(' '),
)
const showToast = ref(false)
const copiedIcon = ref(false)
let toastTimer = null
let iconTimer = null

async function copy() {
  if (!fullTranslation.value) return
  try {
    await navigator.clipboard.writeText(fullTranslation.value)
    copiedIcon.value = true
    clearTimeout(iconTimer)
    iconTimer = setTimeout(() => { copiedIcon.value = false }, 1500)
    showToast.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { showToast.value = false }, 2000)
  } catch (e) {
    console.error('Clipboard error:', e)
  }
}

// === Решение 9: озвучка ===
const speechSupported = 'speechSynthesis' in window
const isSpeaking = ref(false)

function speak() {
  if (!speechSupported || !fullTranslation.value) return
  if (isSpeaking.value) {
    speechSynthesis.cancel()
    isSpeaking.value = false
    return
  }
  const utter = new SpeechSynthesisUtterance(fullTranslation.value)
  utter.lang = effectiveDirection.value === 'ru_en' ? 'en-US' : 'ru-RU'
  utter.rate = 1.0
  utter.onend = () => { isSpeaking.value = false }
  utter.onerror = () => { isSpeaking.value = false }
  speechSynthesis.speak(utter)
  isSpeaking.value = true
}

// === Решение 3: Очистить ===
const hasContent = computed(() =>
  inputText.value.trim() !== '' || translatedSentences.value.length > 0,
)

function clear() {
  if (inputText.value.length > 100) {
    if (!confirm('Очистить поля? Введённый текст будет потерян.')) return
  }
  inputText.value = ''
  translatedSentences.value = []
  manualOverride.value = false
}

// --- Swap ---
function swapDirection() {
  manualOverride.value = true
  direction.value = effectiveDirection.value === 'ru_en' ? 'en_ru' : 'ru_en'
  if (inputText.value.trim()) {
    translate()
  }
}

// --- Разбиение на предложения ---
function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// --- Перевод ---
async function translate() {
  const text = inputText.value.trim()
  if (!text) {
    translatedSentences.value = []
    return
  }
  if (charCount.value > MAX_CHARS) return

  const pipe = currentPipeline.value
  if (!pipe.instance.value) await pipe.load()
  if (!pipe.instance.value) return

  translating.value = true
  pageError.value = null
  translatedSentences.value = []

  try {
    const sentences = splitIntoSentences(text)
    for (const sentence of sentences) {
      const output = await pipe.instance.value(sentence)
      let target
      if (Array.isArray(output)) {
        target = output[0]?.translation_text ?? output[0] ?? ''
      } else if (typeof output === 'string') {
        target = output
      } else {
        target = output.translation_text ?? ''
      }
      translatedSentences.value.push({ source: sentence, target })
    }
    // === Решение 7: сохраняем в историю ===
    historyStore.add({
      source: inputText.value,
      target: translatedSentences.value.map((s) => s.target).join(' '),
      direction: effectiveDirection.value,
    })
  } catch (e) {
    console.error(e)
    pageError.value = 'Произошла ошибка при обработке. Попробуйте ещё раз.'
  } finally {
    translating.value = false
  }
}

// === Решение 7: история ===
function restoreFromHistory(item) {
  inputText.value = item.source
  manualOverride.value = item.direction !== 'auto'
  direction.value = item.direction
}

function clearHistory() {
  if (confirm('Очистить историю переводов?')) {
    historyStore.clear()
  }
}

// --- Жизненный цикл ---
onMounted(async () => {
  demoStore.setCurrentModel({
    task: MODELS.ru_en.task,
    name: MODELS.ru_en.model,
  })
  await Promise.all([ruEn.load(), enRu.load()])
})

watch(effectiveDirection, (dir) => {
  demoStore.setCurrentModel({ task: MODELS[dir].task, name: MODELS[dir].model })
})

onBeforeUnmount(() => {
  demoStore.clearCurrentModel()
  clearTimeout(toastTimer)
  clearTimeout(iconTimer)
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
})

watch(inputText, (val) => {
  if (!val.trim()) {
    translatedSentences.value = []
  }
})

watch(pendingText, async (text) => {
  if (text) {
    inputText.value = text
    manualOverride.value = false
    translatedSentences.value = []
    pendingText.value = null
    await nextTick()
    translate()
  }
})
</script>

<template>
  <div class="translator">
    <header class="translator__header">
      <h1>Переводчик</h1>
      <p class="translator__lead">
        Перевод между русским и английским прямо в браузере. Текст
        разбивается на предложения и переводится инкрементально.
      </p>
    </header>

    <ErrorBanner
      v-if="currentError"
      :message="'Не удалось загрузить модель. Проверьте подключение к интернету или наличие файлов в public/ (запустите npm run setup).'"
      @dismiss="() => {}"
    />
    <ErrorBanner v-if="pageError" :message="pageError" @dismiss="pageError = null" />

    <div class="translator__status-bar">
      <ModelStatus :status="status" />
      <Transition name="fade">
        <div v-if="currentLoading" class="translator__progress">
          <ProgressBar :value="currentProgress" />
        </div>
      </Transition>
    </div>

    <div class="translator__controls">
      <div class="translator__dir">
        <span class="translator__dir-chip">{{ directionLabel }}</span>
        <span v-if="!manualOverride" class="translator__dir-hint">(авто)</span>
        <span v-else class="translator__dir-hint">(вручную)</span>
      </div>
      <button class="translator__swap" @click="swapDirection" title="Поменять направление">⇄</button>
    </div>

    <div class="translator__grid">
      <div class="translator__col">
        <label class="translator__label" for="tr-input">Исходный текст</label>
        <textarea
          id="tr-input"
          v-model="inputText"
          class="translator__textarea"
          :maxlength="MAX_CHARS + 50"
          placeholder="Введите текст для перевода…"
          rows="8"
        ></textarea>
        <div class="translator__footer">
          <div class="translator__footer-left">
            <!-- Решение 6: SVG-кольцо -->
            <div class="translator__count-ring">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" :r="RING_RADIUS" fill="none" stroke="var(--color-surface-alt)" stroke-width="3" />
                <circle
                  cx="22" cy="22" :r="RING_RADIUS"
                  fill="none" :stroke="ringColor" stroke-width="3"
                  :stroke-dasharray="RING_CIRCUMFERENCE"
                  :stroke-dashoffset="ringDashoffset"
                  transform="rotate(-90 22 22)"
                  style="transition: stroke-dashoffset 0.3s ease"
                />
              </svg>
              <span class="translator__count-text" :class="charCountClass">
                {{ charCount }}/{{ MAX_CHARS }}
              </span>
            </div>
            <!-- Решение 3: Очистить -->
            <Transition name="fade">
              <button
                v-if="hasContent"
                class="translator__btn translator__btn--ghost translator__btn--sm"
                @click="clear"
              >
                Очистить
              </button>
            </Transition>
          </div>
          <button
            class="translator__btn"
            :disabled="!inputText.trim() || translating || charCount > MAX_CHARS"
            @click="translate"
          >
            {{ translating ? 'Перевод…' : 'Перевести' }}
          </button>
        </div>
      </div>

      <div class="translator__col">
        <div class="translator__output-header">
          <label class="translator__label">Перевод</label>
          <div class="translator__output-actions">
            <!-- Решение 4: Копировать -->
            <Transition name="fade">
              <button
                v-if="fullTranslation"
                class="translator__btn-icon"
                :class="{ copied: copiedIcon }"
                @click="copy"
                title="Копировать перевод"
              >
                <span v-if="copiedIcon">✓</span>
                <span v-else>📋</span>
              </button>
            </Transition>
            <!-- Решение 9: Озвучить -->
            <Transition name="fade">
              <button
                v-if="fullTranslation && speechSupported"
                class="translator__btn-icon"
                :class="{ speaking: isSpeaking }"
                @click="speak"
                :title="isSpeaking ? 'Остановить' : 'Озвучить перевод'"
              >
                <span v-if="isSpeaking">⏸</span>
                <span v-else>🔊</span>
              </button>
            </Transition>
          </div>
        </div>
        <div class="translator__output">
          <TransitionGroup name="list" tag="div" class="translator__sentences">
            <div
              v-for="(s, index) in translatedSentences"
              :key="index"
              class="translator__sentence"
              :style="{ '--i': index }"
            >
              {{ s.target }}
            </div>
          </TransitionGroup>
          <p v-if="!translatedSentences.length && !translating" class="translator__placeholder">
            Здесь появится перевод…
          </p>
          <p v-if="translating" class="translator__typing">Переводим по предложениям…</p>
        </div>
      </div>
    </div>

    <!-- Решение 7: история переводов -->
    <Transition name="fade">
      <section v-if="historyStore.hasItems" class="translator__history">
        <div class="translator__history-header">
          <h3>Недавние переводы</h3>
          <button class="translator__btn translator__btn--ghost translator__btn--sm" @click="clearHistory">
            Очистить
          </button>
        </div>
        <TransitionGroup name="list" tag="ul" class="translator__history-list">
          <li
            v-for="item in historyStore.recent"
            :key="item.id"
            class="translator__history-item"
            @click="restoreFromHistory(item)"
          >
            <div class="translator__history-source">{{ item.source }}</div>
            <div class="translator__history-target">{{ item.target }}</div>
            <div class="translator__history-meta">
              {{ item.direction === 'ru_en' ? 'RU → EN' : 'EN → RU' }}
            </div>
          </li>
        </TransitionGroup>
      </section>
    </Transition>
  </div>

  <!-- Решение 4: Toast через Teleport -->
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="showToast" class="toast">Текст скопирован</div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.translator__header { margin-bottom: 24px; }
.translator__header h1 { font-size: 28px; margin-bottom: 8px; }
.translator__lead { color: var(--color-text-muted); max-width: 720px; }

.translator__status-bar { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
.translator__progress { flex: 1; min-width: 240px; max-width: 500px; }

.translator__controls { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.translator__dir { display: flex; align-items: center; gap: 8px; }
.translator__dir-chip { padding: 6px 14px; background: var(--color-primary-soft); color: var(--color-primary-dark); border-radius: 999px; font-weight: 600; font-size: 14px; }
.translator__dir-hint { font-size: 12px; color: var(--color-text-muted); }
.translator__swap { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-surface); font-size: 18px; color: var(--color-text); display: grid; place-items: center; transition: transform 0.4s ease, background-color 0.2s ease; }
.translator__swap:hover { transform: rotate(180deg); background: var(--color-primary-soft); border-color: var(--color-primary); }

.translator__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.translator__col { display: flex; flex-direction: column; }
.translator__label { font-size: 13px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 8px; }
.translator__textarea { width: 100%; resize: vertical; padding: 14px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: 15px; line-height: 1.5; color: var(--color-text); background: var(--color-surface); transition: border-color 0.2s ease; }
.translator__textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }

.translator__footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.translator__footer-left { display: flex; align-items: center; gap: 12px; }

/* Решение 6: SVG-кольцо */
.translator__count-ring { position: relative; width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; }
.translator__count-text { position: absolute; font-size: 10px; font-weight: 600; color: var(--color-text-muted); font-variant-numeric: tabular-nums; text-align: center; line-height: 1.1; }
.translator__count-text.warn { color: var(--color-warning); }
.translator__count-text.over { color: var(--color-danger); }

.translator__btn { padding: 10px 22px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 600; transition: background-color 0.2s ease, transform 0.15s ease; }
.translator__btn:hover:not(:disabled) { background: var(--color-primary-dark); transform: translateY(-1px); }
.translator__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.translator__btn--ghost { background: var(--color-surface-alt); color: var(--color-text); border: 1px solid var(--color-border); }
.translator__btn--ghost:hover { background: var(--color-surface); border-color: var(--color-primary); }
.translator__btn--sm { padding: 6px 14px; font-size: 12px; }

.translator__output-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.translator__output-actions { display: flex; gap: 6px; }
.translator__btn-icon { width: 32px; height: 32px; border: 1px solid var(--color-border); background: var(--color-surface); border-radius: var(--radius-sm); cursor: pointer; font-size: 16px; display: grid; place-items: center; transition: background-color 0.2s ease, border-color 0.2s ease; }
.translator__btn-icon:hover { background: var(--color-surface-alt); border-color: var(--color-primary); }
.translator__btn-icon.copied { background: #d4edda; border-color: #6db979; }
.translator__btn-icon.speaking { background: var(--color-primary-soft); border-color: var(--color-primary); color: var(--color-primary-dark); }

.translator__output { min-height: 200px; padding: 14px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); font-size: 15px; line-height: 1.6; }
.translator__placeholder { color: var(--color-text-muted); }
.translator__typing { color: var(--color-text-muted); font-size: 14px; }
.translator__sentences { display: flex; flex-direction: column; gap: 8px; }
.translator__sentence { position: relative; }

/* Решение 7: история */
.translator__history { margin-top: 24px; padding: 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.translator__history-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.translator__history-header h3 { font-size: 14px; font-weight: 600; }
.translator__history-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.translator__history-item { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; transition: background-color 0.2s ease, border-color 0.2s ease; }
.translator__history-item:hover { background: var(--color-surface-alt); border-color: var(--color-primary); }
.translator__history-source { font-size: 13px; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.translator__history-target { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.translator__history-meta { font-size: 10px; color: var(--color-primary-dark); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.list-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: calc(var(--i, 0) * 80ms); }
.list-enter-from { opacity: 0; transform: translateX(24px); }
.list-move { transition: transform 0.4s ease; }
</style>
