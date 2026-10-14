# HOWTODO — пошаговое решение всех 12 задач

Этот документ — **для преподавателя**. Здесь расписано решение всех 12 задач
из `TODO.md` с указанием файлов, изменяемого кода и пояснениями.

> ⚠️ Этот файл не показывать студентам до дедлайна.

Все решения проверены на совместимость с текущей архитектурой проекта.
Каждая задача — отдельный раздел; можно решать их независимо друг от друга
(за исключением задач 7 и 11, где создаются новые файлы).

---

## Структура каждого решения

```
### N. Название задачи
**Файлы:** список затронутых файлов

**Что меняем** — краткое описание

**Код** — конкретные изменения (diff-формат или полный фрагмент)

**Пояснение** — почему именно так, какие Vue-техники использованы
```

---

## 1. Индикатор загрузки детектора — 3-стадийный степпер

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- Добавить `computed` `stage` для определения текущей стадии
- В шаблоне заменить спиннер на степпер
- Добавить CSS для степпера

### Код

**В `<script setup>` — после `imageLoading` добавьте `computed`:**

```js
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, inject } from 'vue'
//                            ^^^^^^^^ добавить computed

// ...существующий код...

// ★ Стадии обработки для степпера
// idle: ничего не происходит
// loading: imageLoading === true
// detecting: inferencing === true (после загрузки картинки)
// done: есть детекции, не loading, не inferencing (показать 1.5с и скрыть)
const stage = computed(() => {
  if (imageLoading.value) return 'loading'
  if (inferencing.value) return 'detecting'
  if (detections.value.length > 0) return 'done'
  return 'idle'
})

// Скрываем «done» через 1.5с после показа
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

// Виден ли степпер вообще
const showStepper = computed(() =>
  stage.value !== 'idle' || showDoneStage.value
)

// Шаги степпера
const steps = [
  { key: 'loading', label: 'Загрузка изображения' },
  { key: 'detecting', label: 'Детекция объектов' },
  { key: 'done', label: 'Готово' },
]

// Подпись под степпером для текущей стадии
const stageLabel = computed(() => {
  switch (stage.value) {
    case 'loading': return 'Загрузка изображения…'
    case 'detecting': return 'Идёт детекция…'
    case 'done': return `Готово — найдено ${detections.value.length} объектов`
    default: return ''
  }
})
```

**В `<template>` — замените существующий блок спиннера:**

Найдите:
```html
<div v-if="imageLoading" class="detector__loading">
  <div class="detector__spinner"></div>
  <p>Идёт загрузка…</p>
</div>
```

Замените на:
```html
<!-- Степпер загрузки -->
<Transition name="fade">
  <div v-if="showStepper" class="detector__stepper">
    <div class="detector__steps">
      <div
        v-for="(step, i) in steps"
        :key="step.key"
        class="detector__step"
        :class="{
          active: stage === step.key,
          done: isStepDone(step.key, i),
          pending: isStepPending(step.key, i),
        }"
      >
        <span class="detector__step-num">
          <span v-if="isStepDone(step.key, i)">✓</span>
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
```

**Добавьте в `<script setup>` вспомогательные методы (рядом со степпером):**

```js
// Вспомогательные функции для статуса шага
const stageOrder = ['idle', 'loading', 'detecting', 'done']
function isStepDone(stepKey, stepIndex) {
  const currentIdx = stageOrder.indexOf(stage.value)
  const stepIdx = stageOrder.indexOf(stepKey)
  return currentIdx > stepIdx
}
function isStepPending(stepKey, stepIndex) {
  const currentIdx = stageOrder.indexOf(stage.value)
  const stepIdx = stageOrder.indexOf(stepKey)
  return currentIdx < stepIdx
}
```

**В `<style scoped>` — замените `.detector__loading`/`.detector__spinner` на стили степпера:**

```css
/* === Степпер стадий загрузки === */
.detector__stepper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
}
.detector__steps {
  display: flex;
  gap: 8px;
}
.detector__step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  font-size: 12px;
  transition: all 0.3s ease;
}
.detector__step.active {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  border: 1px solid var(--color-primary);
}
.detector__step.done {
  background: #d4edda;
  color: #2c7a3d;
}
.detector__step.pending {
  opacity: 0.5;
}
.detector__step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-surface);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 11px;
  flex-shrink: 0;
}
.detector__step.active .detector__step-num {
  background: var(--color-primary);
  color: #fff;
}
.detector__step.done .detector__step-num {
  background: #2c7a3d;
  color: #fff;
}
.detector__step-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detector__stage-label {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
  font-style: italic;
  margin: 0;
}

/* Смена подписи под степпером */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
```

### Пояснение

- **Multi-state через `computed`**: один `stage` вместо двух булевых
  `imageLoading`/`inferencing`. Это классический паттерн: в реальных
  приложениях состояний всегда больше, чем булевых флагов.
- **`watch` для авто-скрытия «done»**: через 1.5с после завершения степпер
  исчезает. Используем `clearTimeout` для корректной очистки таймера при
  новых изменениях состояния.
- **`<Transition mode="out-in">` для подписи**: старая подпись уходит
  (slide-up leave), затем входит новая (slide-up enter). Без `mode="out-in"`
  они бы наложились.
- **Динамические классы `:class`**: один элемент может быть в 3 состояниях
  (active/done/pending) — это уже не булев флаг, а enum.

---

## 2. Количество найденных объектов над картинкой

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- Добавить 3 `computed` для метрик
- Добавить панель над картинкой
- CSS с анимацией смены чисел

### Код

**В `<script setup>` — после `formattedDetections` добавьте:**

```js
// Метрики для панели над картинкой
const totalCount = computed(() => detections.value.length)
const uniqueCount = computed(() =>
  new Set(detections.value.map((d) => d.label)).size,
)
const averageConfidence = computed(() => {
  if (detections.value.length === 0) return 0
  const sum = detections.value.reduce((s, d) => s + d.score, 0)
  return Math.round((sum / detections.value.length) * 100)
})
```

**В `<template>` — перед блоком `.detector__canvas-wrap` добавьте:**

```html
<!-- Панель метрик над картинкой -->
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
```

**В `<style scoped>` — добавьте стили:**

```css
/* === Панель метрик === */
.detector__metrics {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}
.detector__metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.detector__metric-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.detector__metric-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.detector__metric-divider {
  color: var(--color-text-muted);
  font-size: 18px;
}

/* Анимация смены чисел */
.num-enter-active,
.num-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.num-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}
.num-leave-to {
  opacity: 0;
  transform: translateY(100%);
  position: absolute;
}
```

### Пояснение

- **3 `computed` из одного массива**: одна реактивная переменная
  `detections` порождает 3 разных вычисления. Это пример того, как
  `computed` лучше методов — Vue кеширует результат до изменения источника.
- **`<Transition mode="out-in">` с `:key`**: ключ — само значение числа.
  Когда число меняется, Vue удаляет старый элемент и создаёт новый,
  запуская leave- и enter-анимации.
- **`position: absolute` в `num-leave-to`**: удалённый элемент не должен
  занимать место в layout во время leave-анимации, иначе новое число будет
  сдвигаться. `position: absolute` вынимает его из потока.

---

## 3. Кнопка «Очистить» в переводчике

**Файл:** `src/components/panels/TranslatorPanel.vue`

### Что меняем

- Добавить метод `clear()` и `computed` `hasContent`
- Кнопку в шаблоне с `<Transition>` для появления
- CSS для кнопки

### Код

**В `<script setup>` — добавьте:**

```js
// Есть ли что очищать
const hasContent = computed(() =>
  inputText.value.trim() !== '' || translatedSentences.value.length > 0,
)

// Очистка полей
function clear() {
  // Подтверждение для длинных текстов
  if (inputText.value.length > 100) {
    if (!confirm('Очистить поля? Введённый текст будет потерян.')) return
  }
  inputText.value = ''
  translatedSentences.value = []
  manualOverride.value = false
}
```

**В `<template>` — обновите блок `.translator__footer`:**

Найдите:
```html
<div class="translator__footer">
  <span class="translator__count" :class="charCountClass">
    {{ charCount }} / {{ MAX_CHARS }}
  </span>
  <button
    class="translator__btn"
    :disabled="!inputText.trim() || translating || charCount > MAX_CHARS"
    @click="translate"
  >
    {{ translating ? 'Перевод…' : 'Перевести' }}
  </button>
</div>
```

Замените на:
```html
<div class="translator__footer">
  <div class="translator__footer-left">
    <span class="translator__count" :class="charCountClass">
      {{ charCount }} / {{ MAX_CHARS }}
    </span>
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
```

**В `<style scoped>` — добавьте:**

```css
.translator__footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.translator__btn--sm {
  padding: 6px 14px;
  font-size: 12px;
}
```

### Пояснение

- **`computed` `hasContent`**: один computed объединяет два условия, не
  нужно дублировать логику в шаблоне и в `:disabled`.
- **`<Transition>` для условного появления кнопки**: `v-if` на кнопке +
  `<Transition>` даёт плавный fade-in/fade-out. Кнопка не «прыгает» в layout.
- **Подтверждение для длинных текстов**: `window.confirm` — простое
  нативное API, но для длинных текстов реально спасает от случайной потери.

---

## 4. Кнопка «Копировать» + toast через `<Teleport>`

**Файл:** `src/components/panels/TranslatorPanel.vue`

### Что меняем

- Полный текст перевода через `computed`
- Метод `copy()` с состоянием иконки и toast
- `<Teleport>` для toast в конце `<template>`
- CSS для кнопки и toast

### Код

**В `<script setup>` — добавьте:**

```js
// Полный текст перевода (для копирования)
const fullTranslation = computed(() =>
  translatedSentences.value.map((s) => s.target).join(' '),
)

// Состояние для копирования
const showToast = ref(false)
const copiedIcon = ref(false)
let toastTimer = null
let iconTimer = null

async function copy() {
  if (!fullTranslation.value) return
  try {
    await navigator.clipboard.writeText(fullTranslation.value)
    // Смена иконки на 1.5с
    copiedIcon.value = true
    clearTimeout(iconTimer)
    iconTimer = setTimeout(() => { copiedIcon.value = false }, 1500)
    // Toast на 2с (продлевается при повторном копировании)
    showToast.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { showToast.value = false }, 2000)
  } catch (e) {
    console.error('Clipboard error:', e)
    // Опционально: показать toast с ошибкой
    showToast.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { showToast.value = false }, 2000)
  }
}

// Очистка таймеров при уходе со страницы
onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  clearTimeout(iconTimer)
})
```

**В `<template>` — обновите блок вывода, добавьте кнопку «Копировать»:**

Найдите:
```html
<div class="translator__col">
  <label class="translator__label">Перевод</label>
  <div class="translator__output">
    ...
  </div>
</div>
```

Замените на (с кнопкой над output):
```html
<div class="translator__col">
  <div class="translator__output-header">
    <label class="translator__label">Перевод</label>
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
```

**В конец `<template>` (после всего, перед `</template>`):**

```html
<!-- Toast через Teleport — вне DOM-дерева переводчика -->
<Teleport to="body">
  <Transition name="toast">
    <div v-if="showToast" class="toast">
      Текст скопирован
    </div>
  </Transition>
</Teleport>
```

**В `<style scoped>` — добавьте:**

```css
/* Кнопка копирования */
.translator__output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.translator__btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 16px;
  display: grid;
  place-items: center;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.translator__btn-icon:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-primary);
}
.translator__btn-icon.copied {
  background: #d4edda;
  border-color: #6db979;
}

/* Toast — НЕ scoped, т.к. через Teleport рендерится в body.
   Используем :global() или выносим в base.css */
:global(.toast) {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  background: var(--color-text);
  color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
}

/* Анимация toast */
:global(.toast-enter-active),
:global(.toast-leave-active) {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
:global(.toast-enter-from) {
  opacity: 0;
  transform: translateY(20px);
}
:global(.toast-leave-to) {
  opacity: 0;
  transform: translateY(20px);
}
```

### Пояснение

- **`<Teleport to="body">`**: Vue 3 компонент, который рендерит детей в
  указанное место DOM (здесь — в `<body>`). Toast не наследует стили
  `scoped` и не «влияет» на layout переводчика.
- **`:global()` в scoped-стилях**: т.к. toast рендерится вне компонента,
  scoped-стили к нему не применяются автоматически. `:global()` говорит
  Vue: «не добавляй data-атрибут к этому селектору».
- **`clearTimeout` для повторного копирования**: если нажать «Копировать»
  повторно, пока toast ещё виден, мы очищаем старый таймер и ставим новый —
  toast не «дёргается».
- **`onBeforeUnmount`**: при уходе со страницы таймеры очищаются, иначе
  сработают после размонтирования компонента и попытаются изменить `ref`,
  которого уже нет.

---

## 5. Фильтр найденных объектов по классу

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- Добавить `ref` `filterQuery` и `computed` `filteredDetections`
- Поле ввода над списком
- Использовать `filteredDetections` в `<TransitionGroup>`

### Код

**В `<script setup>` — добавьте:**

```js
// Фильтр найденных объектов по классу
const filterQuery = ref('')
const filteredDetections = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return formattedDetections.value
  return formattedDetections.value.filter((d) =>
    d.label.toLowerCase().includes(q),
  )
})
```

**В `<template>` — обновите секцию `detector__results`:**

Найдите:
```html
<section class="detector__results">
  <h2 v-if="formattedDetections.length">Найденные объекты</h2>
  <TransitionGroup name="list" tag="ul" class="detector__list">
    <li
      v-for="(d, index) in formattedDetections"
      :key="d.label + '-' + index"
      ...
    >
      ...
    </li>
  </TransitionGroup>
</section>
```

Замените на:
```html
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
      v-for="(d, index) in filteredDetections"
      :key="d.label + '-' + index"
      class="detector__item"
      :style="{ '--color': d.color, '--i': index }"
    >
      <span class="detector__item-dot"></span>
      <span class="detector__item-label">{{ d.label }}</span>
      <span class="detector__item-score">{{ d.scorePct }}%</span>
    </li>
  </TransitionGroup>
  <p v-if="formattedDetections.length && !filteredDetections.length" class="detector__empty">
    Ничего не найдено по запросу «{{ filterQuery }}»
  </p>
</section>
```

**В `<style scoped>` — добавьте:**

```css
.detector__filter {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  background: var(--color-surface);
  margin-bottom: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.detector__filter:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.detector__empty {
  font-size: 14px;
  color: var(--color-text-muted);
  font-style: italic;
  padding: 12px 0;
}
```

### Пояснение

- **`computed` `filteredDetections`**: возвращает отфильтрованный массив
  на основе `formattedDetections`. Vue кеширует результат, пока не изменится
  `filterQuery` или `formattedDetections`.
- **`<TransitionGroup>` с `name="list"`**: классы `.list-move`,
  `.list-leave-active` уже определены в существующих стилях — фильтрация
  автоматически анимируется (move + leave + enter).
- **`:key="d.label + '-' + index"`**: при фильтрации один и тот же класс
  может оказаться на новой позиции. Vue определяет перемещение по `key`,
  без него анимация `list-move` не сработает.

---

## 6. SVG-кольцо для счётчика символов

**Файл:** `src/components/panels/TranslatorPanel.vue`

### Что меняем

- Заменить текст счётчика на SVG-кольцо с числом в центре
- 3 `computed` для геометрии и цвета

### Код

**В `<script setup>` — добавьте:**

```js
// SVG-кольцо для счётчика символов
const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ≈ 113.1

const ringPercent = computed(() => Math.min(charCount.value / MAX_CHARS, 1))
const ringDashoffset = computed(() =>
  RING_CIRCUMFERENCE * (1 - ringPercent.value),
)
const ringColor = computed(() => {
  if (charCount.value > MAX_CHARS) return 'var(--color-danger)'
  if (charCount.value > MAX_CHARS * 0.9) return 'var(--color-warning)'
  return 'var(--color-primary)'
})
```

**В `<template>` — замените текст счётчика:**

Найдите:
```html
<span class="translator__count" :class="charCountClass">
  {{ charCount }} / {{ MAX_CHARS }}
</span>
```

Замените на:
```html
<div class="translator__count-ring">
  <svg width="44" height="44" viewBox="0 0 44 44">
    <circle
      cx="22" cy="22" :r="RING_RADIUS"
      fill="none" stroke="var(--color-surface-alt)" stroke-width="3"
    />
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
```

**В `<script setup>` — добавьте `RING_RADIUS` и `RING_CIRCUMFERENCE` как
константы в самом верху (после импортов):**

```js
const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
```

*(дублировать в `computed` не нужно, можно просто ссылаться на константы)*

**В `<style scoped>` — добавьте:**

```css
.translator__count-ring {
  position: relative;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.translator__count-text {
  position: absolute;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  text-align: center;
  line-height: 1.1;
}
.translator__count-text.warn { color: var(--color-warning); }
.translator__count-text.over { color: var(--color-danger); }
```

### Пояснение

- **Реактивные SVG-атрибуты**: `:stroke-dashoffset` — связан с `computed`,
  Vue автоматически обновляет атрибут при изменении. Это пример того, что
  Vue работает с SVG так же, как с HTML.
- **`Math.min(charCount / MAX_CHARS, 1)`**: ограничиваем процент до 100%,
  чтобы кольцо не «перелилось» при превышении лимита.
- **Динамический цвет через `computed`**: возвращает CSS-переменную как
  строку, Vue подставляет её в `:stroke`. При смене цвета анимации нет
  (по умолчанию), цвет переключается резко — это ОК для порогов.

---

## 7. История переводов в Pinia

**Файлы:** `src/stores/history.js` (новый), `src/components/panels/TranslatorPanel.vue`

### Что меняем

- Создать новый Pinia-стор
- Сохранять переводы после завершения
- Показывать список «Недавние переводы» под полем вывода

### Код

**Создайте `src/stores/history.js`:**

```js
import { defineStore } from 'pinia'

const STORAGE_KEY = 'vue-transformers-history'
const MAX_ITEMS = 5

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    items: load(),
  }),
  getters: {
    recent: (s) => s.items.slice(0, MAX_ITEMS),
    hasItems: (s) => s.items.length > 0,
  },
  actions: {
    add(item) {
      // Уникальность по source — если уже есть, удаляем старый
      this.items = this.items.filter((i) => i.source !== item.source)
      // Добавляем в начало
      this.items.unshift({
        ...item,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      })
      // Обрезаем до MAX_ITEMS
      this.items = this.items.slice(0, MAX_ITEMS)
      this.persist()
    },
    remove(id) {
      this.items = this.items.filter((i) => i.id !== id)
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    },
  },
})
```

**В `src/components/panels/TranslatorPanel.vue` — в `<script setup>`:**

Добавьте импорт вверху:
```js
import { useHistoryStore } from '@/stores/history'
```

Инициализируйте стор (после `demoStore`):
```js
const historyStore = useHistoryStore()
```

В методе `translate()` — после успешного перевода (после `for`-цикла)
добавьте сохранение:
```js
try {
  const sentences = splitIntoSentences(text)
  for (const sentence of sentences) {
    // ...существующий код...
  }
  // ★ Сохраняем в историю
  historyStore.add({
    source: inputText.value,
    target: translatedSentences.value.map((s) => s.target).join(' '),
    direction: effectiveDirection.value,
  })
} catch (e) { /* ... */ }
```

Добавьте методы для восстановления и очистки:
```js
// Восстановление из истории
function restoreFromHistory(item) {
  inputText.value = item.source
  // Не подставляем target — пусть перевод запустится снова,
  // это даёт «живой» результат. Или подставляем — на выбор:
  // translatedSentences.value = [{ source: item.source, target: item.target }]
  manualOverride.value = item.direction !== 'auto'
  direction.value = item.direction
}

// Очистка истории
function clearHistory() {
  if (confirm('Очистить историю переводов?')) {
    historyStore.clear()
  }
}
```

**В `<template>` — под блоком `.translator__grid` добавьте:**

```html
<!-- История переводов -->
<Transition name="fade">
  <section v-if="historyStore.hasItems" class="translator__history">
    <div class="translator__history-header">
      <h3>Недавние переводы</h3>
      <button class="translator__btn--ghost translator__btn--sm" @click="clearHistory">
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
```

**В `<style scoped>` — добавьте:**

```css
.translator__history {
  margin-top: 24px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.translator__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.translator__history-header h3 {
  font-size: 14px;
  font-weight: 600;
}
.translator__history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.translator__history-item {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.translator__history-item:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-primary);
}
.translator__history-source {
  font-size: 13px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.translator__history-target {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.translator__history-meta {
  font-size: 10px;
  color: var(--color-primary-dark);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}
```

### Пояснение

- **`defineStore` с state/getters/actions**: классическая структура Pinia.
  `state` — функция, возвращающая объект (нужно для изоляции инстансов).
  `getters` — `recent` возвращает срез до 5 элементов.
  `actions` — методы, изменяющие state.
- **Персистенция**: `load()` при инициализации, `persist()` после каждого
  действия. Паттерн аналогичен `progress.js`.
- **Уникальность по source**: перед добавлением удаляем старый элемент с
  тем же `source` — это даёт «перемещение в начало» при повторном переводе
  того же текста.
- **`Date.now()` как id**: простой способ получить уникальный id. В реальном
  продакшене лучше `crypto.randomUUID()`, но для демо достаточно.
- **`<TransitionGroup>` для истории**: при добавлении нового элемента
  старые плавно сдвигаются вниз (если лимит исчерпан — последний исчезает).

---

## 8. Слайдер порога уверенности

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- `ref` `threshold` (по умолчанию 0)
- `computed` `visibleDetections`
- Слайдер над картинкой
- Перерисовка canvas при изменении слайдера

### Код

**В `<script setup>` — добавьте:**

```js
// Слайдер порога уверенности
const threshold = ref(0) // 0–100 (%)

// Отфильтрованные детекции (по порогу)
const visibleDetections = computed(() =>
  formattedDetections.value.filter((d) => d.score >= threshold.value / 100),
)
```

**Измените метод `drawBoxes` — используйте `visibleDetections` вместо
`detections`:**

Найдите в `drawBoxes()`:
```js
detections.value.forEach((d, i) => {
```

Замените на:
```js
visibleDetections.value.forEach((d, i) => {
```

**Добавьте `watch` для перерисовки canvas:**

```js
// Перерисовка canvas при изменении порога
watch(threshold, () => {
  if (canvasEl.value && imageEl.value) {
    nextTick(() => drawBoxes())
  }
})
```

**В `<template>` — добавьте слайдер над картинкой (после блока метрик,
перед `.detector__canvas-wrap`):**

```html
<!-- Слайдер порога уверенности -->
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
      Показано: {{ visibleDetections.length }} из {{ formattedDetections.length }}
    </span>
  </div>
</Transition>
```

**В `<template>` — обновите `<TransitionGroup>` списка объектов,
используйте `visibleDetections`:**

Найдите:
```html
<TransitionGroup name="list" tag="ul" class="detector__list">
  <li
    v-for="(d, index) in formattedDetections"
    ...
```

Замените на:
```html
<TransitionGroup name="list" tag="ul" class="detector__list">
  <li
    v-for="(d, index) in visibleDetections"
    ...
```

**В `<style scoped>` — добавьте:**

```css
.detector__threshold {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}
.detector__threshold-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}
.detector__threshold-slider {
  flex: 1;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.detector__threshold-count {
  font-size: 12px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
```

### Пояснение

- **`v-model.number`**: модификатор `.number` автоматически конвертирует
  значение в `number` (по умолчанию range возвращает строку).
- **`watch` на `threshold` → `drawBoxes`**: при изменении слайдера canvas
  перерисовывается. `nextTick` нужен, чтобы DOM обновился до отрисовки.
- **`computed` `visibleDetections`**: один источник правды — используется
  и в canvas, и в списке, и в счётчике. Меняем порог → обновляются все 3
  места одновременно (это и есть реактивность).

---

## 9. Кнопка «Озвучить перевод»

**Файл:** `src/components/panels/TranslatorPanel.vue`

### Что меняем

- Кнопка 🔊 рядом с «Копировать»
- `speechSynthesis.speak()` с установкой языка
- Очистка при unmount

### Код

**В `<script setup>` — добавьте:**

```js
// Поддерживается ли speechSynthesis
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
  // Язык соответствует целевому языку перевода
  utter.lang = effectiveDirection.value === 'ru_en' ? 'en-US' : 'ru-RU'
  utter.rate = 1.0
  utter.onend = () => { isSpeaking.value = false }
  utter.onerror = () => { isSpeaking.value = false }
  speechSynthesis.speak(utter)
  isSpeaking.value = true
}
```

**В `onBeforeUnmount` — добавьте остановку синтеза:**

```js
onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  clearTimeout(iconTimer)
  // ★ Останавливаем синтез речи при уходе со страницы
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
})
```

**В `<template>` — рядом с кнопкой «Копировать» добавьте «Озвучить»:**

Найдите блок `.translator__output-header` (из задачи 4) и обновите:

```html
<div class="translator__output-header">
  <label class="translator__label">Перевод</label>
  <div class="translator__output-actions">
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
```

**В `<style scoped>` — добавьте:**

```css
.translator__output-actions {
  display: flex;
  gap: 6px;
}
.translator__btn-icon.speaking {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
}
```

### Пояснение

- **`speechSupported` — не реактивный флаг**: `speechSynthesis in window`
  не меняется в течение сессии, поэтому используем обычную константу, не `ref`.
- **`utter.lang` — язык синтеза**: `en-US` для русского→английского,
  `ru-RU` для английского→русского. Без этого браузер использует язык
  системы по умолчанию.
- **`onend`/`onerror`**: обязательно сбрасываем `isSpeaking`, иначе кнопка
  «залипнет» в состоянии «говорит».
- **`onBeforeUnmount` → `speechSynthesis.cancel()`**: критично. Без этого
  синтез продолжится даже после ухода со страницы — пользователь услышит
  «оборванный» текст, когда откроет другую страницу приложения.

---

## 10. Drag-and-drop перестановка объектов

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- `ref` `draggedIndex`
- HTML5 Drag API на элементах списка
- `<TransitionGroup>` с `list-move` для анимации

### Код

**В `<script setup>` — добавьте:**

```js
// Drag-and-drop для перестановки объектов
const draggedIndex = ref(null)

function onDragStart(i) {
  draggedIndex.value = i
}

function onDragOver(e, i) {
  e.preventDefault() // обязательно, иначе drop не сработает
  if (draggedIndex.value === null || draggedIndex.value === i) return
  // Переставляем в массиве detections (источник)
  const arr = [...detections.value]
  const [moved] = arr.splice(draggedIndex.value, 1)
  arr.splice(i, 0, moved)
  detections.value = arr
  draggedIndex.value = i
}

function onDrop() {
  draggedIndex.value = null
}

function onDragEnd() {
  draggedIndex.value = null
}
```

**В `<template>` — обновите `<li>` в `<TransitionGroup>`:**

Найдите:
```html
<li
  v-for="(d, index) in visibleDetections"
  :key="d.label + '-' + index"
  class="detector__item"
  :style="{ '--color': d.color, '--i': index }"
>
  <span class="detector__item-dot"></span>
  <span class="detector__item-label">{{ d.label }}</span>
  <span class="detector__item-score">{{ d.scorePct }}%</span>
</li>
```

Замените на:
```html
<li
  v-for="(d, index) in visibleDetections"
  :key="d.label + '-' + index"
  class="detector__item"
  :class="{ dragging: draggedIndex === index }"
  :style="{ '--color': d.color, '--i': index }"
  draggable="true"
  @dragstart="onDragStart(index)"
  @dragover="onDragOver($event, index)"
  @drop="onDrop"
  @dragend="onDragEnd"
>
  <span class="detector__item-drag">⋮⋮</span>
  <span class="detector__item-dot"></span>
  <span class="detector__item-label">{{ d.label }}</span>
  <span class="detector__item-score">{{ d.scorePct }}%</span>
</li>
```

**В `<style scoped>` — добавьте:**

```css
.detector__item.dragging {
  opacity: 0.5;
  cursor: grabbing;
}
.detector__item[draggable="true"] {
  cursor: grab;
}
.detector__item-drag {
  color: var(--color-text-muted);
  font-size: 14px;
  cursor: grab;
  letter-spacing: -2px;
}
```

**Обратите внимание**: `<TransitionGroup>` уже имеет `name="list"` с
классом `.list-move` — переезды анимируются автоматически. Никаких
дополнительных изменений в CSS не нужно.

### Пояснение

- **`draggable="true"`**: включает HTML5 Drag API на элементе.
- **`@dragover.prevent`**: без `prevent` drop не сработает. Можно писать
  `@dragover.prevent="onDragOver($event, index)"` или `@dragover="onDragOver($event, index)"`
  с `e.preventDefault()` в методе.
- **`detections.value = arr`**: всегда создаём новый массив через
  spread, иначе Vue не заметит изменение (мутации массива не реактивны).
- **`watch` на `detections`**: уже есть в коде (обновляет `detectedClasses`
  для ChipsSection) — и он же перерисует canvas через `watch(detections)`,
  если такой watch добавить. Или можно явно:
  ```js
  watch(detections, () => {
    if (canvasEl.value && imageEl.value) {
      nextTick(() => drawBoxes())
    }
  })
  ```
- **`<TransitionGroup>` с `list-move`**: Vue анимирует перемещение
  элементов на новые позиции. Это **главное** отличие от `<Transition>`:
  для одного элемента — Transition, для списка с перестановками —
  TransitionGroup.

---

## 11. Тёмная тема через CSS-переменные + Pinia

**Файлы:** `src/stores/theme.js` (новый), `src/components/AppSidebar.vue`, `src/App.vue`

### Что меняем

- Новый Pinia-стор с темой и `apply()` для CSS-переменных
- Кнопка в сайдбаре
- `apply()` при старте приложения

### Код

**Создайте `src/stores/theme.js`:**

```js
import { defineStore } from 'pinia'

const STORAGE_KEY = 'vue-transformers-theme'

// Тёмные аналоги CSS-переменных
const DARK_VARS = {
  '--color-bg': '#0d1117',
  '--color-surface': '#161b22',
  '--color-surface-alt': '#21262d',
  '--color-border': '#30363d',
  '--color-text': '#e6edf3',
  '--color-text-muted': '#8b949e',
  '--color-primary': '#42b883',
  '--color-primary-dark': '#529286',
  '--color-primary-soft': '#1f2a25',
  '--color-accent': '#3b82f6',
}

export const useThemeStore = defineStore('theme', {
  state: () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return { theme: saved || 'system' } // 'light' | 'dark' | 'system'
  },
  getters: {
    isDark: (s) => {
      if (s.theme === 'dark') return true
      if (s.theme === 'light') return false
      // system: проверяем медиа-запрос
      return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    },
    icon: (s) => s.isDark ? '☀️' : '🌙',
  },
  actions: {
    toggle() {
      this.theme = this.isDark ? 'light' : 'dark'
      this.persist()
      this.apply()
    },
    apply() {
      const root = document.documentElement
      if (this.isDark) {
        for (const [key, value] of Object.entries(DARK_VARS)) {
          root.style.setProperty(key, value)
        }
      } else {
        // Возвращаем дефолтные — просто удаляем overrides
        for (const key of Object.keys(DARK_VARS)) {
          root.style.removeProperty(key)
        }
      }
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, this.theme)
    },
  },
})
```

**В `src/App.vue` — добавьте применение темы при старте:**

```vue
<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import AppSidebar from './components/AppSidebar.vue'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.apply()
})
</script>

<template>
  <!-- ...существующий шаблон без изменений... -->
</template>
```

**В `src/components/AppSidebar.vue` — добавьте кнопку переключения темы:**

В `<script setup>` добавьте импорт:
```js
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
const { icon } = storeToRefs(themeStore)
```

В шаблоне — добавьте кнопку перед `.sidebar__footer`:

```html
<button class="sidebar__theme-toggle" @click="themeStore.toggle" :title="themeStore.isDark ? 'Светлая тема' : 'Тёмная тема'">
  <Transition name="fade" mode="out-in">
    <span :key="icon">{{ icon }}</span>
  </Transition>
</button>
```

В `<style scoped>` добавьте:

```css
.sidebar__theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: 0 8px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.sidebar__theme-toggle:hover {
  background: var(--color-surface);
  border-color: var(--color-primary);
}
```

### Пояснение

- **`document.documentElement.style.setProperty`**: единственный способ
  динамически менять CSS-переменные из JS. `--color-bg` и т.д. —
  определены в `base.css` в `:root`, что эквивалентно
  `document.documentElement`.
- **`removeProperty` для light**: не задаём «светлые» значения, а просто
  удаляем override — `base.css` снова начинает работать.
- **`prefers-color-scheme: dark`**: медиа-запрос ОС. Если пользователь не
  выбирал тему вручную, приложение следует системной.
- **`storeToRefs` для `icon`**: геттер Pinia нужно «распаковать» через
  `storeToRefs`, иначе он не будет реактивным в шаблоне.

---

## 12. Слайдер сравнения «до/после»

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- `ref` `sliderPosition` (по умолчанию 50)
- Динамический `clip-path` на canvas-overlay
- Слайдер над картинкой

### Код

**В `<script setup>` — добавьте:**

```js
// Слайдер «до/после»
const sliderPosition = ref(50) // 0–100 (% показа overlay)
```

**В `<template>` — добавьте слайдер над картинкой (после блока threshold,
если делали задачу 8; иначе перед `.detector__canvas-wrap`):**

```html
<!-- Слайдер «до/после» -->
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
```

**В `<template>` — обновите canvas-overlay, добавьте динамический
`clip-path`:**

Найдите:
```html
<Transition name="fade">
  <canvas v-if="detections.length" ref="canvasEl" class="detector__overlay"></canvas>
</Transition>
```

Замените на:
```html
<Transition name="fade">
  <canvas
    v-if="detections.length"
    ref="canvasEl"
    class="detector__overlay"
    :style="{ 'clip-path': `inset(0 ${100 - sliderPosition}% 0 0)` }"
  ></canvas>
</Transition>
```

**В `<style scoped>` — добавьте:**

```css
.detector__compare {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}
.detector__compare-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}
.detector__compare-slider {
  flex: 1;
  accent-color: var(--color-primary);
  cursor: pointer;
}
```

### Пояснение

- **`clip-path: inset(top right bottom left)`**: CSS-функция, обрезающая
  элемент. `inset(0 50% 0 0)` обрежет правые 50%, оставив левые 50% видимыми.
  Меняя значение, мы «открываем»/«закрываем» canvas-overlay.
- **Динамический `:style`**: Vue корректно работает с `style` как объектом.
  `` `inset(0 ${100 - sliderPosition}% 0 0)` `` — template string в JS.
- **Без анимации по умолчанию**: `clip-path` через `:style` не анимируется
  автоматически (нужно `transition: clip-path 0.1s` в CSS, если хотите
  плавность). Для slider это не нужно — он и так реагирует мгновенно.
- **`sliderPosition = 100`** → видны все боксы (overlay не обрезан).
  **`sliderPosition = 0`** → боксов не видно (overlay полностью обрезан).
  Логика обратная: `100 - sliderPosition` даёт % обрезки справа.

---

# Сводка изменений по файлам

| Файл | Задачи | Что меняем |
|------|-------|------------|
| `src/components/panels/DetectorPanel.vue` | 1, 2, 5, 8, 10, 12 | Большая часть работы |
| `src/components/panels/TranslatorPanel.vue` | 3, 4, 6, 7, 9 | Большая часть работы |
| `src/stores/history.js` (новый) | 7 | Создать |
| `src/stores/theme.js` (новый) | 11 | Создать |
| `src/components/AppSidebar.vue` | 11 | Кнопка темы |
| `src/App.vue` | 11 | `themeStore.apply()` в `onMounted` |

## Порядок внедрения (рекомендация)

Чтобы изменения не конфликтовали:

1. **Сначала задачи 1, 2** (степпер + метрики в DetectorPanel)
2. **Задачи 3, 4** (Очистить + Копировать в TranslatorPanel)
3. **Задача 7** (история — отдельный стор, не конфликтует)
4. **Задача 11** (тема — отдельный стор, не конфликтует)
5. **Задачи 5, 8** (фильтр + threshold — обе в DetectorPanel)
6. **Задачи 6, 9** (кольцо + озвучка — обе в TranslatorPanel)
7. **Задачи 10, 12** (DnD + слайдер «до/после» — обе в DetectorPanel)

## После внедрения

Запустите `npm run dev` и проверьте все 12 задач по чеклистам из `TODO.md`.
Если что-то не работает — откройте DevTools Console, посмотрите ошибки.
Все новые `computed`/`watch`/`ref` должны быть в `<script setup>` **до**
использования в шаблоне.

Удачи!
