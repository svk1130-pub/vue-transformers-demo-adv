# HOWTODO — пошаговое решение всех 15 задач

Этот документ — **для преподавателя**. Здесь расписано решение всех 15 задач
из `TODO.md` с указанием файлов, изменяемого кода и пояснениями.

> ⚠️ Этот файл не показывать студентам до дедлайна.

Все решения проверены на совместимость с текущей архитектурой проекта.
Каждая задача — отдельный раздел; можно решать их независимо друг от друга
(за исключением задач 7, 11, 13 и 15, где создаются новые файлы/структуры).

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
- Поле ввода над списком с кнопкой очистки `[x]` внутри
- Использовать `filteredDetections` в `<TransitionGroup>`

### Код

**В `<script setup>` — добавьте (без изменений по сравнению с предыдущей версией):**

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

// Очистка фильтра
function clearFilter() {
  filterQuery.value = ''
}
```

**В `<template>` — обновите секцию `detector__results` с кнопкой очистки:**

Замените на:
```html
<section class="detector__results">
  <h2 v-if="formattedDetections.length">Найденные объекты</h2>
  <Transition name="fade">
    <div v-if="formattedDetections.length" class="detector__filter-wrap">
      <input
        v-model="filterQuery"
        type="text"
        placeholder="Фильтр по классу…"
        class="detector__filter"
      />
      <!-- Кнопка очистки [x] внутри input -->
      <Transition name="fade">
        <button
          v-if="filterQuery"
          type="button"
          class="detector__filter-clear"
          @click="clearFilter"
          aria-label="Очистить фильтр"
        >×</button>
      </Transition>
    </div>
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

**В `<style scoped>` — добавьте стили с обёрткой и кнопкой:**

```css
/* Обёртка фильтра с относительным позиционированием для кнопки [x] */
.detector__filter-wrap {
  position: relative;
  margin-bottom: 12px;
}
.detector__filter {
  width: 100%;
  padding: 8px 32px 8px 14px;  /* ★ padding-right 32px под кнопку */
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  background: var(--color-surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.detector__filter:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
/* Кнопка очистки [x] внутри input */
.detector__filter-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  background: var(--color-surface-alt);
  border-radius: 50%;
  color: var(--color-text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.detector__filter-clear:hover {
  background: var(--color-danger);
  color: #fff;
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
- **Кнопка `[x]` через `<Transition>`**: `v-if="filterQuery"` + `<Transition name="fade">`
  даёт плавное появление/исчезновение. `position: absolute` внутри обёртки
  `.detector__filter-wrap` (с `position: relative`) — кнопка не сдвигает layout.
- **`padding-right: 32px` на input**: место под кнопку, чтобы текст не
  залезал под неё.
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
- `computed` `minThreshold` — наименьший confidence в %
- `computed` `visibleDetections`
- Слайдер с динамическим `:min="minThreshold"`, `max="100"`, `step="0.1"`
- Перерисовка canvas при изменении слайдера

### Код

**В `<script setup>` — добавьте:**

```js
// Слайдер порога уверенности
const threshold = ref(0) // 0–100 (%)

// ★ Динамический min: наименьший confidence среди найденных объектов.
//   Округляем вниз до 0.1%, чтобы слайдер не показывал 92.567% и т.п.
const minThreshold = computed(() => {
  if (detections.value.length === 0) return 0
  const min = Math.min(...detections.value.map((d) => d.score))
  return Math.floor(min * 1000) / 10  // → 92.5 (было 0.92567)
})

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

**Добавьте `watch` для перерисовки canvas (и для сброса порога при
новой детекции):**

```js
// Перерисовка canvas при изменении порога
watch(threshold, () => {
  if (canvasEl.value && imageEl.value) {
    nextTick(() => drawBoxes())
  }
})

// ★ Сброс порога при новой детекции (если старое значение выше нового min)
watch(detections, () => {
  if (threshold.value < minThreshold.value) {
    threshold.value = minThreshold.value
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
      Порог уверенности: ≥ {{ threshold.toFixed(1) }}%
    </label>
    <input
      v-model.number="threshold"
      type="range"
      :min="minThreshold"
      max="100"
      step="0.1"
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

**В `<style scoped>` — добавьте (без изменений по сравнению с предыдущей
версией):**

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

- **`computed` `minThreshold`**: возвращает наименьший confidence в %
  с округлением вниз до 0.1. Это даёт корректный `min` для range-input:
  если все боксы имеют уверенность ≥ 92.5%, слайдер не позволит
  поставить порог ниже этого значения (иначе все боксы скрылись бы).
- **`Math.floor(min * 1000) / 10`**: умножаем на 1000, округляем вниз,
  делим на 10. `0.92567` → `925.67` → `925` → `92.5`.
- **`v-model.number`**: модификатор `.number` автоматически конвертирует
  значение в `number` (по умолчанию range возвращает строку).
- **`watch(detections)` для сброса**: если старый порог оказался ниже
  нового `min` (после новой детекции с более высоким min confidence),
  поднимаем порог до min. Иначе слайдер «залипнет» на значении ниже min
  и не даст его двигать.
- **`threshold.toFixed(1)` в подписи**: показываем порог с одним знаком
  после запятой (92.5%, а не 92.567890123%).
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

## 12. Слайдер-шторка сравнения «до/после»

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- `ref` `sliderPosition` (по умолчанию 100)
- Динамический `clip-path` на canvas-overlay
- Вертикальная черта-граница (отдельный `<div>` поверх картинки)
- Слайдер над картинкой

### Код

**В `<script setup>` — добавьте:**

```js
// Слайдер-шторка «до/после».
// 100 = все боксы видны, 0 = боксов не видно.
const sliderPosition = ref(100)
```

**В `<template>` — добавьте слайдер над картинкой (после блока threshold,
если делали задачу 8; иначе перед `.detector__canvas-wrap`):**

```html
<!-- Слайдер-шторка «до/после» -->
<Transition name="fade">
  <div v-if="detections.length" class="detector__compare">
    <label class="detector__compare-label">
      Шторка сравнения: {{ sliderPosition }}% показа боксов
    </label>
    <input
      v-model.number="sliderPosition"
      type="range" min="0" max="100" step="1"
      class="detector__compare-slider"
    />
  </div>
</Transition>
```

**В `<template>` — обновите блок `.detector__canvas-inner`, добавьте
через canvas-overlay с `clip-path` и вертикальную черту:**

Найдите:
```html
<div class="detector__canvas-inner">
  <img v-show="!imageLoading" ... />
  <Transition name="fade">
    <canvas v-if="detections.length" ref="canvasEl" class="detector__overlay"></canvas>
  </Transition>
</div>
```

Замените на (с чертой-границей):
```html
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
  <!-- Canvas-overlay: обрезается справа через clip-path, чтобы сделать
       «шторку»: слева видны боксы, справа — нет -->
  <Transition name="fade">
    <canvas
      v-if="detections.length"
      ref="canvasEl"
      class="detector__overlay"
      :style="{ 'clip-path': `inset(0 ${100 - sliderPosition}% 0 0)` }"
    ></canvas>
  </Transition>
  <!-- ★ Вертикальная черта-граница — видна всегда, двигается вместе
       со слайдером. Показывает, где проходит граница «до/после». -->
  <Transition name="fade">
    <div
      v-if="detections.length"
      class="detector__compare-line"
      :style="{ left: sliderPosition + '%' }"
    ></div>
  </Transition>
</div>
```

**В `<style scoped>` — добавьте стили слайдера и черты:**

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

/* ★ Вертикальная черта-граница */
.detector__compare-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-primary);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 2;
  transition: left 0.1s ease;
}
```

### Пояснение

- **`clip-path: inset(top right bottom left)`**: CSS-функция, обрезающая
  элемент. `inset(0 50% 0 0)` обрежет правые 50%, оставив левые 50% видимыми.
  Меняя значение, мы «открываем»/«закрываем» canvas-overlay.
- **Динамический `:style`**: Vue корректно работает с `style` как объектом.
  `` `inset(0 ${100 - sliderPosition}% 0 0)` `` — template string в JS.
- **Черта-граница через отдельный `<div>`**: не canvas-элемент, а обычный
  `<div>` поверх картинки с `position: absolute` и `left: sliderPosition + '%'`.
  `transform: translateX(-50%)` центрирует её относительно этой координаты
  (иначе черта будет слева от позиции, а не по центру).
- **`transition: left 0.1s ease` на черте**: чтобы при перетаскивании слайдера
  черта двигалась плавно, а не дёргалась. Canvas `clip-path` анимировать
  не нужно — он обновляется мгновенно.
- **`pointer-events: none`**: черта не должна перехватывать клики по canvas.
  Если добавить `@click` на canvas (задача 13), черта не должна мешать.
- **`z-index: 2`**: черта должна быть поверх canvas-overlay (z-index: 1
  по умолчанию для absolute-элементов) и под UI-кнопками.
- **`sliderPosition = 100`** → видны все боксы (overlay не обрезан), черта
  у правого края. **`sliderPosition = 0`** → боксов не видно (overlay
  полностью обрезан), черта у левого края. Логика обратная:
  `100 - sliderPosition` даёт % обрезки справа.

---

## 13. Управление видимостью боксов + color picker

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- `ref`-массив `boxVisibility` (один флаг на детект)
- `ref(new Map())` для `customColors`
- Чекбокс у каждого элемента списка + кнопки «Показать все» / «Скрыть все»
- Клик по canvas скрывает соответствующий бокс
- Shift+клик по чекбоксу открывает color picker
- Скрытые строки списка с opacity 0.4 и зачёркиванием
- `drawBoxes()` использует `customColors` и фильтрует по `boxVisibility`

### Код

**В `<script setup>` — добавьте:**

```js
// === Управление видимостью боксов ===
// boxVisibility[i] = true/false — видимость i-го бокса
const boxVisibility = ref([])

// customColors: Map<label, color> — кастомные цвета по классам
const customColors = ref(new Map())

// Синхронизация: при новых детекциях все боксы видны, кастомные цвета сбрасываются
watch(detections, (dets) => {
  boxVisibility.value = dets.map(() => true)
  customColors.value = new Map()
})

// computed: только видимые детекции (для отрисовки и счётчиков)
const visibleDetectionsForDraw = computed(() =>
  formattedDetections.value.filter((d, i) => boxVisibility.value[i] !== false),
)

// Цвет бокса: кастомный или дефолтный по индексу
function getColorForDetection(d, i) {
  return customColors.value.get(d.label) || BOX_COLORS[i % BOX_COLORS.length]
}

// Перерисовка canvas при изменении видимости или цветов
watch([boxVisibility, customColors], () => {
  if (canvasEl.value && imageEl.value) {
    nextTick(() => drawBoxes())
  }
}, { deep: true })

// Кнопки «Показать все» / «Скрыть все»
function showAllBoxes() {
  boxVisibility.value = detections.value.map(() => true)
}

function hideAllBoxes() {
  boxVisibility.value = detections.value.map(() => false)
}

// === Клик по canvas скрывает бокс ===
// Скрытый ref на скрытый <input type="color"> — открывается программно
const colorInputEl = ref(null)
let colorPickerTarget = ref(null)  // label, для которого открывают picker

function onCanvasClick(e) {
  if (!canvasEl.value || detections.value.length === 0) return
  const rect = canvasEl.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvasEl.value.width / rect.width)
  const y = (e.clientY - rect.top) * (canvasEl.value.height / rect.height)

  // Найти бокс, в который попал клик (по первому совпадению)
  for (let i = 0; i < detections.value.length; i++) {
    const { xmin, ymin, xmax, ymax } = detections.value[i].box
    if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
      boxVisibility.value[i] = false
      return
    }
  }
}

// === Shift+клик по чекбоксу открывает color picker ===
function onCheckboxClick(e, label) {
  if (e.shiftKey) {
    e.preventDefault()
    colorPickerTarget.value = label
    colorInputEl.value?.click()
  }
}

function onColorPicked(e) {
  if (colorPickerTarget.value) {
    customColors.value.set(colorPickerTarget.value, e.target.value)
    // Триггерим реактивность: Map не реактивна по умолчанию, нужно
    // создать новый Map с теми же значениями
    customColors.value = new Map(customColors.value)
  }
}
```

**В `onMounted` — добавьте слушатель клика на canvas:**

```js
onMounted(async () => {
  // ...существующий код...
  // ★ Слушатель клика по canvas для скрытия боксов
  if (canvasEl.value) {
    canvasEl.value.addEventListener('click', onCanvasClick)
  }
})
```

**В `onBeforeUnmount` — не забудьте убрать слушатель:**

```js
onBeforeUnmount(() => {
  // ...существующий код...
  if (canvasEl.value) {
    canvasEl.value.removeEventListener('click', onCanvasClick)
  }
})
```

**Измените `drawBoxes()` — используйте `visibleDetectionsForDraw` и
`getColorForDetection`:**

Найдите в `drawBoxes()`:
```js
visibleByThreshold.value.forEach((d, i) => {
  const color = d.color
  // ...
})
```

Замените на:
```js
// ★ Только видимые боксы, прошедшие порог, с учётом кастомных цветов
const drawList = visibleByThreshold.value.filter((d, i) => {
  const realIndex = formattedDetections.value.indexOf(d)
  return boxVisibility.value[realIndex] !== false
})
drawList.forEach((d) => {
  const realIndex = formattedDetections.value.indexOf(d)
  const color = getColorForDetection(d, realIndex)
  // ...остальной код рисования бокса с этим color...
})
```

**В `<template>` — обновите секцию `detector__results`:**

```html
<section class="detector__results">
  <h2 v-if="formattedDetections.length">Найденные объекты</h2>

  <!-- Кнопки «Показать все» / «Скрыть все» -->
  <Transition name="fade">
    <div v-if="formattedDetections.length" class="detector__visibility-actions">
      <button class="detector__btn detector__btn--ghost detector__btn--sm" @click="showAllBoxes">
        Показать все
      </button>
      <button class="detector__btn detector__btn--ghost detector__btn--sm" @click="hideAllBoxes">
        Скрыть все
      </button>
    </div>
  </Transition>

  <!-- Фильтр (из задачи 5) -->
  <Transition name="fade">
    <div v-if="formattedDetections.length" class="detector__filter-wrap">
      <input v-model="filterQuery" type="text" placeholder="Фильтр по классу…" class="detector__filter" />
      <Transition name="fade">
        <button v-if="filterQuery" class="detector__filter-clear" @click="clearFilter">×</button>
      </Transition>
    </div>
  </Transition>

  <!-- Скрытый color picker, открывается программно -->
  <input
    ref="colorInputEl"
    type="color"
    style="position: absolute; opacity: 0; pointer-events: none"
    @input="onColorPicked"
  />

  <TransitionGroup name="list" tag="ul" class="detector__list">
    <li
      v-for="(d, index) in visibleDetections"
      :key="d.label + '-' + index"
      class="detector__item"
      :class="{ hidden: boxVisibility[index] === false }"
      :style="{ '--color': getColorForDetection(d, index), '--i': index }"
    >
      <input
        type="checkbox"
        v-model="boxVisibility[index]"
        class="detector__item-checkbox"
        @click="onCheckboxClick($event, d.label)"
        title="Shift+клик — сменить цвет"
      />
      <span class="detector__item-dot"></span>
      <span class="detector__item-label">{{ d.label }}</span>
      <span class="detector__item-score">{{ d.scorePct }}%</span>
    </li>
  </TransitionGroup>
  <!-- ...существующий блок «Ничего не найдено»... -->
</section>
```

**В `<style scoped>` — добавьте стили чекбокса и скрытых строк:**

```css
/* Кнопки «Показать все» / «Скрыть все» */
.detector__visibility-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.detector__btn--sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Чекбокс в элементе списка */
.detector__item-checkbox {
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}

/* Скрытые строки: полупрозрачные с зачёркиванием */
.detector__item.hidden {
  opacity: 0.4;
  text-decoration: line-through;
}
.detector__item.hidden .detector__item-dot {
  opacity: 0.5;
}
```

### Пояснение

- **`boxVisibility`-массив**: один булевый флаг на каждый детект. Меняем через
  `v-model` на чекбоксе — Vue обновит массив и trigger-нет `watch` с `deep: true`.
- **`watch` с `{ deep: true }`**: обязательно для массива/объекта, иначе
  изменение одного элемента через `v-model="boxVisibility[index]"` не
  trigger-нет watch (потому что ссылка на массив не меняется).
- **`customColors.value = new Map(customColors.value)`**: Map не реактивна
  по умолчанию в Vue 3. Чтобы trigger-нуть обновление, создаём новый Map
  с теми же парами. Vue видит новый объект — обновляет dependents.
- **Клик по canvas**: `canvasEl.addEventListener('click', ...)`. Координаты
  клика масштабируются (`canvas.width / rect.width`), потому что canvas
  отображается не в натуральном размере (его ширина/высота в CSS отличается
  от внутреннего размера).
- **Shift+клик по чекбоксу**: `e.shiftKey` — проверка модификатора. Чтобы
  открыть нативный color picker программно, вызываем `.click()` на скрытом
  `<input type="color">`. Браузер сам откроет системное окно выбора цвета.
- **`e.preventDefault()` при Shift+клике**: чтобы чекбокс не переключился,
  только открылся picker.
- **`onBeforeUnmount` для слушателя**: критично убрать `addEventListener`,
  иначе при размонтировании компонента ссылка на `onCanvasClick` останется
  в canvas, а функция будет удалена → memory leak.

---

## 14. Переключатель темы в шапке main

**Файлы:** `src/App.vue`, `src/components/AppSidebar.vue`

### Что меняем

- В `App.vue` добавить кнопку темы в правый верхний угол `main`
- В `AppSidebar.vue` удалить кнопку темы и связанный код

### Код

**В `src/App.vue` — обновите `<script setup>` и `<template>`:**

```vue
<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'
import AppSidebar from './components/AppSidebar.vue'

const themeStore = useThemeStore()
const { icon } = storeToRefs(themeStore)

onMounted(() => {
  themeStore.apply()
})
</script>

<template>
  <div class="app-shell">
    <Transition name="slide" appear>
      <AppSidebar />
    </Transition>

    <main class="app-main">
      <!-- ★ Кнопка темы в правом верхнем углу main -->
      <button
        class="theme-toggle"
        @click="themeStore.toggle"
        :title="themeStore.isDark ? 'Светлая тема' : 'Тёмная тема'"
      >
        <Transition name="fade" mode="out-in">
          <span :key="icon">{{ icon }}</span>
        </Transition>
      </button>

      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }
.app-main {
  flex: 1;
  min-width: 0;
  padding: 32px 40px 64px;
  max-width: var(--content-max);
  position: relative; /* ★ для position: sticky внутри */
}

/* ★ Кнопка темы в правом верхнем углу main, sticky сверху */
.theme-toggle {
  position: sticky;
  top: 16px;
  margin-left: auto;
  margin-bottom: 16px;
  z-index: 10;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 18px;
  box-shadow: var(--shadow-sm);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.theme-toggle:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-primary);
}

.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease; }
.slide-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-leave-to { transform: translateX(-100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
```

**В `src/components/AppSidebar.vue` — удалите кнопку темы и связанный код:**

В `<script setup>` удалите импорт `useThemeStore` и `icon`:
```js
// Удалить эти строки:
import { useThemeStore } from '@/stores/theme'
// ...
const themeStore = useThemeStore()
const { icon } = storeToRefs(themeStore)
```

В `<template>` удалите кнопку:
```html
<!-- Удалить этот блок: -->
<button class="sidebar__theme-toggle" @click="themeStore.toggle" :title="...">
  <Transition name="fade" mode="out-in">
    <span :key="icon">{{ icon }}</span>
  </Transition>
</button>
```

В `<style scoped>` удалите `.sidebar__theme-toggle` стили.

### Пояснение

- **`position: sticky; top: 16px;`**: элемент остаётся на месте при скролле,
  пока родитель (`.app-main`) виден в viewport. Когда пользователь скроллит
  вниз, кнопка «прилипает» к верху и остаётся видимой.
- **`margin-left: auto`**: прижимает кнопку вправо внутри flex/grid-родителя.
  `main` — это flex-ребёнок `.app-shell`, внутри main элементы по умолчанию
  идут блочно. `margin-left: auto` работает, если родитель — flex. Если нет,
  используйте `position: absolute; right: 16px; top: 16px;` вместо sticky.
- **`storeToRefs` для `icon`**: геттер Pinia нужно «распаковать» через
  `storeToRefs`, иначе он не будет реактивным в шаблоне.
- **`<Transition mode="out-in">` на иконке**: при смене 🌙 → ☀️ старая иконка
  fade-out, новая fade-in. Без `mode="out-in"` они бы наложились.
- **`box-shadow: var(--shadow-sm)`**: чтобы кнопка была визуально отделена
  от контента, особенно над сложным фоном.

---

## 15. Блок «Найденные объекты» справа от фотографии

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что меняем

- Обернуть `.detector__canvas-wrap` и `.detector__results` в
  `<div class="detector__layout">` с CSS Grid
- На широких экранах — две колонки (картинка + список)
- На узких (<900px) — одна колонка, список под картинкой
- Уменьшить pills (padding, font-size, dot size)

### Код

**В `<template>` — оберните два блока в обёртку:**

Найдите:
```html
<Transition name="fade">
  <div v-if="imageUrl" class="detector__canvas-wrap">
    <!-- ...степпер, метрики, слайдеры, картинка... -->
  </div>
</Transition>

<!-- ...блок threshold, compare (если есть)... -->

<section class="detector__results">
  <!-- ...список найденных объектов... -->
</section>
```

Замените на:
```html
<!-- ★ Двухколоночный layout: картинка слева, список справа.
     На узких экранах — одна колонка, список под картинкой. -->
<div class="detector__layout">
  <div class="detector__layout-left">
    <!-- Метрики, слайдеры, степпер, картинка — слева -->
    <Transition name="fade">
      <div v-if="imageUrl" class="detector__canvas-wrap">
        <!-- ...существующий контент... -->
      </div>
    </Transition>
  </div>

  <div class="detector__layout-right">
    <!-- Блок «Найденные объекты» — справа -->
    <section v-if="formattedDetections.length" class="detector__results">
      <!-- ...существующий контент блока results... -->
    </section>
  </div>
</div>
```

**В `<style scoped>` — добавьте grid-стили и уменьшите pills:**

```css
/* ★ Двухколоночный layout */
.detector__layout {
  display: grid;
  grid-template-columns: 1fr 280px;  /* картинка занимает 1fr, список 280px */
  gap: 20px;
  align-items: start;  /* важно: колонки не растягиваются по высоте */
}
@media (max-width: 900px) {
  .detector__layout {
    grid-template-columns: 1fr;  /* узкий экран — одна колонка */
  }
}
.detector__layout-left {
  min-width: 0;  /* критично для grid-элементов с длинным контентом */
}
.detector__layout-right {
  min-width: 0;
}

/* ★ Уменьшенные pills */
.detector__item {
  padding: 6px 10px;  /* было 10px 14px */
  gap: 6px;            /* было 10px */
}
.detector__item-dot {
  width: 8px;          /* было 12px */
  height: 8px;
}
.detector__item-label {
  font-size: 12px;     /* было 14px */
}
.detector__item-score {
  font-size: 11px;     /* было 13px */
}
.detector__item-checkbox {
  width: 14px;         /* чекбокс тоже меньше */
  height: 14px;
}
```

### Пояснение

- **CSS Grid `1fr 280px`**: `1fr` — занимает всё доступное место, `280px` —
  фиксированная ширина правой колонки. Получаем layout «картинка + боковая
  панель», как в Notion/Linear.
- **`align-items: start`**: критично для grid. Без этого обе колонки
  растягиваются до высоты самой длинной, и правая колонка будет иметь пустое
  пространство под списком, если он короче картинки.
- **`min-width: 0`**: grid-элементы по умолчанию не ужимаются меньше контента.
  Это критично, потому что `.detector__canvas-inner` имеет длинный контент
  (картинку). Без `min-width: 0` левая колонка «выдавит» правую за пределы
  grid.
- **`@media (max-width: 900px)`**: media query для адаптивности. На узких
  экранах (<900px) колонка одна, блок уходит под картинку.
- **`v-if="formattedDetections.length"` на правой колонке**: если детекций
  нет, вся правая колонка скрыта — layout автоматически становится
  одноколоночным без пустого места справа.
- **Уменьшенные pills**: компактнее выглядят в узкой правой колонке.
  `padding: 6px 10px` + `font-size: 12px` экономят место, не теряя читаемость.

---

# Сводка изменений по файлам

| Файл | Задачи | Что меняем |
|------|-------|------------|
| `src/components/panels/DetectorPanel.vue` | 1, 2, 5, 8, 10, 12, 13, 15 | Большая часть работы |
| `src/components/panels/TranslatorPanel.vue` | 3, 4, 6, 7, 9 | Большая часть работы |
| `src/stores/history.js` (новый) | 7 | Создать |
| `src/stores/theme.js` (новый) | 11 | Создать |
| `src/components/AppSidebar.vue` | 11, 14 | Кнопка темы (11) → удалить (14) |
| `src/App.vue` | 11, 14 | `themeStore.apply()` (11) + кнопка в шапке (14) |

## Порядок внедрения (рекомендация)

Чтобы изменения не конфликтовали:

1. **Сначала задачи 1, 2** (степпер + метрики в DetectorPanel)
2. **Задачи 3, 4** (Очистить + Копировать в TranslatorPanel)
3. **Задача 7** (история — отдельный стор, не конфликтует)
4. **Задача 11** (тема — отдельный стор + кнопка в сайдбаре)
5. **Задачи 5, 8** (фильтр с кнопкой [x] + threshold с динамическим min)
6. **Задачи 6, 9** (кольцо + озвучка — обе в TranslatorPanel)
7. **Задачи 10, 12** (DnD + слайдер-шторка с чертой — обе в DetectorPanel)
8. **Задача 13** (видимость боксов + color picker — после всех остальных
   в DetectorPanel, потому что меняет `drawBoxes` и список)
9. **Задача 14** (тема в шапке — после задачи 11, потому что удаляет кнопку
   из сайдбара)
10. **Задача 15** (блок справа — последняя, потому что меняет layout всего
    DetectorPanel)

## После внедрения

Запустите `npm run dev` и проверьте все 15 задач по чеклистам из `TODO.md`.
Если что-то не работает — откройте DevTools Console, посмотрите ошибки.
Все новые `computed`/`watch`/`ref` должны быть в `<script setup>` **до**
использования в шаблоне.

Удачи!
