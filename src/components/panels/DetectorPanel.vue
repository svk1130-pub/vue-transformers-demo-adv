<script setup>
/**
 * DetectorPanel.vue — демо-логика детектора объектов.
 * Содержит ВСЕ 12 решений из HOWTODO.md (где относятся к детектору):
 *   1. 3-стадийный степпер загрузки
 *   2. Метрики объектов над картинкой
 *   5. Фильтр найденных объектов по классу
 *   8. Слайдер порога уверенности
 *   10. Drag-and-drop перестановка объектов
 *   12. Слайдер сравнения «до/после»
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, inject } from 'vue'
import { usePipeline } from '@/composables/usePipeline'
import { useDemoStore } from '@/stores/demoStore'
import ModelStatus from '@/components/ModelStatus.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'

const MODEL_TASK = 'object-detection'
const MODEL_NAME = 'Xenova/detr-resnet-50'

const demoStore = useDemoStore()

const detectedClasses = inject('detectedClasses', ref([]))
const pendingSample = inject('pendingSample', ref(null))

const BOX_COLORS = [
  '#42b883', '#3b82f6', '#f5a623', '#e5484d',
  '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
]

const { instance, loading, progress, error, load } = usePipeline(
  MODEL_TASK,
  MODEL_NAME,
  { dtype: 'fp32' },
)

// --- Состояние страницы ---
const imageUrl = ref(null)
const imageEl = ref(null)
const canvasEl = ref(null)
const detections = ref([])
const inferencing = ref(false)
const pageError = ref(null)
const imageLoading = ref(false)

// === Решение 1: 3-стадийный степпер ===
const stage = computed(() => {
  if (imageLoading.value) return 'loading'
  if (inferencing.value) return 'detecting'
  if (detections.value.length > 0) return 'done'
  return 'idle'
})

const showDoneStage = ref(false)
let doneTimer = null
watch(stage, (s) => {
  if (s === 'done') {
    showDoneStage.value = true
    clearTimeout(doneTimer)
    doneTimer = setTimeout(() => { showDoneStage.value = false }, 1500)
  } else if (s !== 'idle') {
    showDoneStage.value = false
  }
})
onBeforeUnmount(() => clearTimeout(doneTimer))

const showStepper = computed(() =>
  stage.value !== 'idle' || showDoneStage.value,
)

const steps = [
  { key: 'loading', label: 'Загрузка изображения' },
  { key: 'detecting', label: 'Детекция объектов' },
  { key: 'done', label: 'Готово' },
]

const stageLabel = computed(() => {
  switch (stage.value) {
    case 'loading': return 'Загрузка изображения…'
    case 'detecting': return 'Идёт детекция…'
    case 'done': return `Готово — найдено ${detections.value.length} объектов`
    default: return ''
  }
})

const stageOrder = ['idle', 'loading', 'detecting', 'done']
function isStepDone(stepKey) {
  return stageOrder.indexOf(stage.value) > stageOrder.indexOf(stepKey)
}
function isStepPending(stepKey) {
  return stageOrder.indexOf(stage.value) < stageOrder.indexOf(stepKey)
}

// === Решение 2: метрики ===
const totalCount = computed(() => detections.value.length)
const uniqueCount = computed(() =>
  new Set(detections.value.map((d) => d.label)).size,
)
const averageConfidence = computed(() => {
  if (detections.value.length === 0) return 0
  const sum = detections.value.reduce((s, d) => s + d.score, 0)
  return Math.round((sum / detections.value.length) * 100)
})

// === Решение 8: слайдер порога ===
const threshold = ref(0)

// === Решение 12: слайдер «до/после» ===
const sliderPosition = ref(100)

// === Решение 5: фильтр найденных объектов ===
const filterQuery = ref('')

// Форматирование
const formattedDetections = computed(() =>
  detections.value.map((d, i) => ({
    ...d,
    scorePct: (d.score * 100).toFixed(1),
    color: BOX_COLORS[i % BOX_COLORS.length],
  })),
)

// Решение 8: отфильтрованные по порогу
const visibleByThreshold = computed(() =>
  formattedDetections.value.filter((d) => d.score >= threshold.value / 100),
)

// Решение 5: отфильтрованные по запросу (внутри видимых по порогу)
const visibleDetections = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return visibleByThreshold.value
  return visibleByThreshold.value.filter((d) =>
    d.label.toLowerCase().includes(q),
  )
})

const status = computed(() => {
  if (error.value) return 'error'
  if (loading.value) return 'loading'
  if (instance.value) return 'ready'
  return 'idle'
})

function colorForIndex(i) {
  return BOX_COLORS[i % BOX_COLORS.length]
}

onMounted(async () => {
  demoStore.setCurrentModel({ task: MODEL_TASK, name: MODEL_NAME })
  await load()
})

onBeforeUnmount(() => {
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value)
  }
  demoStore.clearCurrentModel()
})

// === Решение 10: DnD перестановка ===
const draggedIndex = ref(null)

function onDragStart(i) {
  draggedIndex.value = i
}

function onDragOver(e, i) {
  e.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === i) return
  const arr = [...detections.value]
  const [moved] = arr.splice(draggedIndex.value, 1)
  arr.splice(i, 0, moved)
  detections.value = arr
  draggedIndex.value = i
}

function onDragDrop() {
  draggedIndex.value = null
}

function onDragEnd() {
  draggedIndex.value = null
}

// --- Загрузка файлов ---
function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  loadImageFromBlob(file)
}

function onDropzoneDrop(e) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    loadImageFromBlob(file)
  }
}
function onDropzoneDragOver(e) {
  e.preventDefault()
}

function loadImageFromBlob(file) {
  const newUrl = URL.createObjectURL(file)
  if (imageUrl.value === newUrl) {
    URL.revokeObjectURL(newUrl)
    imageLoading.value = false
    return
  }
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageLoading.value = true
  imageUrl.value = newUrl
  detections.value = []
}

function loadImageFromUrl(url) {
  if (imageUrl.value === url) {
    imageLoading.value = false
    detections.value = []
    if (instance.value && !inferencing.value) {
      runDetection()
    }
    return
  }
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageLoading.value = true
  imageUrl.value = url
  detections.value = []
}

function loadSample(name) {
  loadImageFromUrl(`/samples/${name}`)
}

// --- Реакция на выбор из галереи «Как это работает» ---
watch(pendingSample, async (src) => {
  if (src) {
    imageLoading.value = true
    detections.value = []
    pendingSample.value = null
    await nextTick()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    loadImageFromUrl(src)
  }
})

// --- Авто-запуск детекции ---
function onImageLoad() {
  imageLoading.value = false
  if (instance.value) {
    runDetection()
  }
}

function onImageError() {
  imageLoading.value = false
  pageError.value = 'Не удалось загрузить изображение. Попробуйте другое.'
}

watch(instance, (model) => {
  if (model && imageUrl.value && !imageLoading.value && !inferencing.value) {
    runDetection()
  }
})

watch(detections, (dets) => {
  detectedClasses.value = dets.map((d) => d.label)
})

// --- Перерисовка canvas при изменении порога или перестановке ---
watch([threshold, detections], () => {
  if (canvasEl.value && imageEl.value && detections.value.length > 0) {
    nextTick(() => drawBoxes())
  }
})

// --- Детекция ---
async function runDetection() {
  if (!instance.value || !imageUrl.value) return
  inferencing.value = true
  pageError.value = null
  await nextTick()
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  try {
    const output = await instance.value(imageUrl.value)
    detections.value = Array.isArray(output) ? output : [output]
    await nextTick()
    drawBoxes()
  } catch (e) {
    console.error(e)
    pageError.value = 'Произошла ошибка при обработке. Попробуйте ещё раз.'
  } finally {
    inferencing.value = false
  }
}

function drawBoxes() {
  const img = imageEl.value
  const canvas = canvasEl.value
  if (!img || !canvas || !img.naturalWidth) return

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  // Рисуем только боксы, прошедшие порог
  visibleByThreshold.value.forEach((d, i) => {
    const color = d.color
    const { xmin, ymin, xmax, ymax } = d.box
    const w = xmax - xmin
    const h = ymax - ymin

    ctx.lineWidth = Math.max(2, img.naturalWidth / 400)
    ctx.strokeStyle = color
    ctx.strokeRect(xmin, ymin, w, h)

    const label = `${d.label} ${(d.score * 100).toFixed(0)}%`
    ctx.font = `${Math.max(14, img.naturalWidth / 50)}px ${getComputedStyle(document.body).fontFamily}`
    const textW = ctx.measureText(label).width
    const padX = 6, padY = 4
    const fontH = Math.max(14, img.naturalWidth / 50)

    ctx.fillStyle = color
    ctx.fillRect(xmin, ymin - fontH - padY * 2, textW + padX * 2, fontH + padY * 2)

    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, xmin + padX, ymin - (fontH + padY * 2) / 2)
  })
}
</script>

<template>
  <div class="detector">
    <header class="detector__header">
      <h1>Детектор объектов</h1>
      <p class="detector__lead">
        Модель <code>Xenova/detr-resnet-50</code> находит объекты на изображении
        и возвращает bounding box-ы с подписями классов и оценкой уверенности.
      </p>
    </header>

    <ErrorBanner
      v-if="error"
      :message="'Не удалось загрузить модель. Проверьте подключение к интернету или наличие файлов в public/ (запустите npm run setup).'"
      @dismiss="() => {}"
    />
    <ErrorBanner v-if="pageError" :message="pageError" @dismiss="pageError = null" />

    <div class="detector__status-bar">
      <ModelStatus :status="status" />
      <Transition name="fade">
        <div v-if="loading" class="detector__progress">
          <ProgressBar :value="progress" />
        </div>
      </Transition>
    </div>

    <div class="detector__dropzone" @drop="onDropzoneDrop" @dragover="onDropzoneDragOver">
      <p class="detector__dropzone-hint">Перетащите изображение сюда или выберите файл</p>
      <div class="detector__dropzone-actions">
        <label class="detector__btn">
          Выбрать файл
          <input type="file" accept="image/*" hidden @change="onFileChange" />
        </label>
        <button class="detector__btn detector__btn--ghost" @click="loadSample('cat.jpg')">Пример: кот</button>
        <button class="detector__btn detector__btn--ghost" @click="loadSample('street.jpg')">Пример: улица</button>
        <button class="detector__btn detector__btn--ghost" @click="loadSample('dog.jpg')">Пример: собака</button>
      </div>
    </div>

    <!-- Решение 2: метрики -->
    <Transition name="fade">
      <div v-if="formattedDetections.length" class="detector__metrics">
        <div class="detector__metric">
          <span class="detector__metric-label">Найдено</span>
          <Transition mode="out-in" name="num">
            <span :key="totalCount" class="detector__metric-value">{{ totalCount }}</span>
          </Transition>
        </div>
        <span class="detector__metric-divider">·</span>
        <div class="detector__metric">
          <span class="detector__metric-label">Уникальных классов</span>
          <Transition mode="out-in" name="num">
            <span :key="uniqueCount" class="detector__metric-value">{{ uniqueCount }}</span>
          </Transition>
        </div>
        <span class="detector__metric-divider">·</span>
        <div class="detector__metric">
          <span class="detector__metric-label">Средняя уверенность</span>
          <Transition mode="out-in" name="num">
            <span :key="averageConfidence" class="detector__metric-value">{{ averageConfidence }}%</span>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Решение 8: слайдер порога -->
    <Transition name="fade">
      <div v-if="formattedDetections.length" class="detector__threshold">
        <label class="detector__threshold-label">
          Порог уверенности: ≥ {{ threshold }}%
        </label>
        <input
          v-model.number="threshold"
          type="range" min="0" max="100" step="5"
          class="detector__threshold-slider"
        />
        <span class="detector__threshold-count">
          Показано: {{ visibleByThreshold.length }} из {{ formattedDetections.length }}
        </span>
      </div>
    </Transition>

    <!-- Решение 12: слайдер «до/после» -->
    <Transition name="fade">
      <div v-if="detections.length" class="detector__compare">
        <label class="detector__compare-label">
          Сравнение: {{ sliderPosition }}% показа боксов
        </label>
        <input
          v-model.number="sliderPosition"
          type="range" min="0" max="100" step="1"
          class="detector__compare-slider"
        />
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="imageUrl" class="detector__canvas-wrap">
        <!-- Решение 1: степпер -->
        <Transition name="fade">
          <div v-if="showStepper" class="detector__stepper">
            <div class="detector__steps">
              <div
                v-for="(step, i) in steps"
                :key="step.key"
                class="detector__step"
                :class="{
                  active: stage === step.key,
                  done: isStepDone(step.key),
                  pending: isStepPending(step.key),
                }"
              >
                <span class="detector__step-num">
                  <span v-if="isStepDone(step.key)">✓</span>
                  <span v-else>{{ i + 1 }}</span>
                </span>
                <span class="detector__step-label">{{ step.label }}</span>
              </div>
            </div>
            <Transition name="slide-up" mode="out-in">
              <p :key="stageLabel" class="detector__stage-label">{{ stageLabel }}</p>
            </Transition>
          </div>
        </Transition>

        <div class="detector__canvas-inner">
          <img
            v-show="!imageLoading"
            ref="imageEl"
            :src="imageUrl"
            alt="Загруженное изображение"
            class="detector__img"
            @load="onImageLoad"
            @error="onImageError"
          />
          <Transition name="fade">
            <canvas
              v-if="detections.length"
              ref="canvasEl"
              class="detector__overlay"
              :style="{ 'clip-path': `inset(0 ${100 - sliderPosition}% 0 0)` }"
            ></canvas>
          </Transition>
        </div>
      </div>
    </Transition>

    <section class="detector__results">
      <h2 v-if="formattedDetections.length">Найденные объекты</h2>
      <Transition name="fade">
        <input
          v-if="formattedDetections.length"
          v-model="filterQuery"
          type="text"
          placeholder="Фильтр по классу…"
          class="detector__filter"
        />
      </Transition>
      <TransitionGroup name="list" tag="ul" class="detector__list">
        <li
          v-for="(d, index) in visibleDetections"
          :key="d.label + '-' + index"
          class="detector__item"
          :class="{ dragging: draggedIndex === index }"
          :style="{ '--color': d.color, '--i': index }"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover="onDragOver($event, index)"
          @drop="onDragDrop"
          @dragend="onDragEnd"
        >
          <span class="detector__item-drag">⋮⋮</span>
          <span class="detector__item-dot"></span>
          <span class="detector__item-label">{{ d.label }}</span>
          <span class="detector__item-score">{{ d.scorePct }}%</span>
        </li>
      </TransitionGroup>
      <p v-if="formattedDetections.length && !visibleDetections.length" class="detector__empty">
        Ничего не найдено по запросу «{{ filterQuery }}»
      </p>
    </section>
  </div>
</template>

<style scoped>
.detector__header { margin-bottom: 24px; }
.detector__header h1 { font-size: 28px; margin-bottom: 8px; }
.detector__lead { color: var(--color-text-muted); max-width: 720px; }
.detector__lead code { font-family: var(--font-mono); font-size: 13px; background: var(--color-surface-alt); padding: 1px 6px; border-radius: 4px; }

.detector__status-bar { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; }
.detector__progress { flex: 1; min-width: 240px; max-width: 500px; }

.detector__dropzone { border: 2px dashed var(--color-border); border-radius: var(--radius-lg); padding: 32px 24px; text-align: center; background: var(--color-surface); margin-bottom: 24px; transition: border-color 0.2s ease; }
.detector__dropzone:hover { border-color: var(--color-primary); }
.detector__dropzone-hint { color: var(--color-text-muted); margin-bottom: 16px; }
.detector__dropzone-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

.detector__btn { display: inline-flex; align-items: center; padding: 10px 18px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease, transform 0.15s ease; }
.detector__btn:hover { background: var(--color-primary-dark); transform: translateY(-1px); }
.detector__btn--ghost { background: var(--color-surface-alt); color: var(--color-text); border: 1px solid var(--color-border); }
.detector__btn--ghost:hover { background: var(--color-surface); border-color: var(--color-primary); }

/* Решение 2: метрики */
.detector__metrics { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 12px; }
.detector__metric { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.detector__metric-label { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.detector__metric-value { font-size: 18px; font-weight: 700; color: var(--color-text); font-variant-numeric: tabular-nums; }
.detector__metric-divider { color: var(--color-text-muted); font-size: 18px; }
.num-enter-active, .num-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.num-enter-from { opacity: 0; transform: translateY(-100%); }
.num-leave-to { opacity: 0; transform: translateY(100%); position: absolute; }

/* Решение 8: слайдер порога */
.detector__threshold { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 12px; }
.detector__threshold-label { font-size: 13px; font-weight: 500; color: var(--color-text); white-space: nowrap; }
.detector__threshold-slider { flex: 1; accent-color: var(--color-primary); cursor: pointer; }
.detector__threshold-count { font-size: 12px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Решение 12: слайдер до/после */
.detector__compare { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 12px; }
.detector__compare-label { font-size: 13px; font-weight: 500; color: var(--color-text); white-space: nowrap; }
.detector__compare-slider { flex: 1; accent-color: var(--color-primary); cursor: pointer; }

/* Решение 1: степпер */
.detector__stepper { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 8px; }
.detector__steps { display: flex; gap: 8px; }
.detector__step { flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--radius-sm); background: var(--color-surface-alt); color: var(--color-text-muted); font-size: 12px; transition: all 0.3s ease; }
.detector__step.active { background: var(--color-primary-soft); color: var(--color-primary-dark); border: 1px solid var(--color-primary); }
.detector__step.done { background: #d4edda; color: #2c7a3d; }
.detector__step.pending { opacity: 0.5; }
.detector__step-num { width: 20px; height: 20px; border-radius: 50%; background: var(--color-surface); display: grid; place-items: center; font-weight: 700; font-size: 11px; flex-shrink: 0; }
.detector__step.active .detector__step-num { background: var(--color-primary); color: #fff; }
.detector__step.done .detector__step-num { background: #2c7a3d; color: #fff; }
.detector__step-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.detector__stage-label { text-align: center; color: var(--color-text-muted); font-size: 14px; font-style: italic; margin: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(8px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-8px); }

.detector__canvas-wrap { margin-bottom: 24px; }
.detector__canvas-inner { position: relative; display: inline-block; max-width: 100%; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-md); }
.detector__img { display: block; max-height: 512px; width: auto; max-width: 100%; height: auto; object-fit: contain; }
.detector__overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

/* Решение 5: фильтр */
.detector__filter { width: 100%; padding: 8px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 13px; background: var(--color-surface); margin-bottom: 12px; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.detector__filter:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.detector__empty { font-size: 14px; color: var(--color-text-muted); font-style: italic; padding: 12px 0; }

.detector__results h2 { font-size: 18px; margin-bottom: 14px; }
.detector__list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; list-style: none; }
.detector__item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: grab; }
.detector__item.dragging { opacity: 0.5; cursor: grabbing; }
.detector__item-drag { color: var(--color-text-muted); font-size: 14px; letter-spacing: -2px; }
.detector__item-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--color); flex-shrink: 0; }
.detector__item-label { flex: 1; font-weight: 500; font-size: 14px; text-transform: capitalize; }
.detector__item-score { font-variant-numeric: tabular-nums; font-size: 13px; color: var(--color-text-muted); font-weight: 600; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.list-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: calc(var(--i, 0) * 90ms); }
.list-enter-from { opacity: 0; transform: translateX(24px); }
.list-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; position: absolute; }
.list-leave-to { opacity: 0; transform: translateX(24px); }
.list-move { transition: transform 0.4s ease; }
</style>
