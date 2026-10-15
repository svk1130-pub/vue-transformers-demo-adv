# Практические задания по доработке приложения

В этом файле — 16 задач для самостоятельной работы. Они подобраны так,
чтобы каждая демонстрировала **разную технику Vue 3**. Выполняя их, вы
пройдёте через `computed`, `<Transition>`, `<TransitionGroup>`, `<Teleport>`,
Pinia-сторы, реактивный SVG, HTML5 Drag API, CSS-переменные и многое другое.

## Правила

- **Обязательные задачи (1–4)** — нужно выполнить всем для сдачи.
- **Дополнительные (5–16)** — выполняйте по мере роста навыков. Любые 3 из
  них дают бонусные баллы. Все 12 — отлично.
- **Готовый код проекта можно менять** — но не нарушайте существующую
  работу. Если что-то сломали — `git checkout .` и начните заново.
- **Проверяйте себя чеклистом** в конце каждой задачи.

## Где смотреть подсказки

- В каждой задаче есть блок **Подсказки** — наводящие мысли и приёмы.
- В конце — **Ссылки** на конкретные разделы документации Vue.
- В тексте встречаются `имена функций/компонентов` — это прямые указания,
  какой API использовать.

---

# Обязательные задачи

## 1. Индикатор загрузки детектора — сделать интереснее

**Файл:** `src/components/panels/DetectorPanel.vue`

Сейчас во время загрузки картинки показывается простой кружок-спиннер с
надписью «Идёт загрузка…». Это примитивно.

### Что сделать

Реализуйте **3-стадийный степпер**, который показывает текущий этап обработки:

```
① Загрузка изображения → ② Детекция → ③ Готово
```

- Активная стадия — подсвечена цветом `--color-primary`
- Пройденная стадия — серая с галочкой ✓
- Будущая стадия — серая, тусклая
- Под степпером — анимированная подпись текущей стадии
- Прогресс-бар внизу (опционально) — заполняется по мере стадий

### Стадии

| Стадия | Когда | Текст подписи |
|--------|-------|---------------|
| `idle` | ничего не происходит | (степпер скрыт) |
| `loading` | `imageLoading === true` | «Загрузка изображения…» |
| `detecting` | `inferencing === true` | «Детекция объектов…» |
| `done` | есть `detections` и не loading/inferencing | «Готово» (показать 1.5с, потом скрыть) |

### Подсказки

- Создайте `computed` `stage` с типом `'idle' | 'loading' | 'detecting' | 'done'`
  на основе `imageLoading.value` и `inferencing.value`.
- Шаги степпера — массив `[{ key: 'loading', label: 'Загрузка' }, ...]`,
  рендерится через `v-for`.
- Активный/пройденный/будущий статус каждого шага определяется через
  `:class` с динамическими выражениями.
- Подпись под степпером — `<Transition mode="out-in">` с `:key` по `stage`,
  чтобы анимировать смену текста.
- CSS-анимация shimmer для skeleton-плейсхолдера — `@keyframes` с
  `background-position`.

### Чеклист

- [ ] Степпер появляется только когда есть активная стадия (не показывается в `idle`)
- [ ] При смене стадии анимируется подпись под степпером
- [ ] После завершения детекции показывается «Готово» 1.5с и степпер исчезает
- [ ] Степпер не ломает layout при появлении/исчезновении (используйте `<Transition>`)
- [ ] Повторная загрузка той же картинки не ломает логику

### Ссылки

- `<Transition>`: https://vuejs.org/guide/built-ins/transition.html
- `computed`: https://vuejs.org/guide/essentials/computed.html

---

## 2. Количество найденных объектов над картинкой

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Добавьте над картинкой мини-панель с тремя показателями:

```
Найдено: 5  ·  Уникальных классов: 3  ·  Средняя уверенность: 87%
```

При изменении каждого числа — анимация «перелистывания»: старое число
уезжает вверх, новое въезжает снизу. Используйте `<Transition mode="out-in">`
с `key` по значению числа.

### Подсказки

- Создайте три `computed`:
  - `totalCount` — просто `detections.value.length`
  - `uniqueCount` — `new Set(detections.value.map(d => d.label)).size`
  - `averageConfidence` — `detections.value.reduce((s, d) => s + d.score, 0) / len * 100`
- Каждый показатель — отдельный `<Transition mode="out-in">` с `:key`
  по значению (`key="totalCount"`), чтобы анимация срабатывала на изменение.
- В `<Transition>` добавьте кастомные классы: `.num-enter-from { transform: translateY(-100%); }`
  и `.num-leave-to { transform: translateY(100%); }`.
- Панель должна появляться только когда `detections.length > 0` (через
  `<Transition>` с fade-in).
- Все три числа показываются в одной строке, разделены `·` (серединная точка).

### Чеклист

- [ ] Панель появляется с fade-in, когда есть детекции
- [ ] Каждое число анимируется отдельно при изменении
- [ ] Округление: уверенность до целых процентов, без десятичных
- [ ] При очистке детекций панель исчезает плавно
- [ ] Числа выровнены по центру или по левому краю — на ваш вкус

### Ссылки

- `<Transition mode="out-in">`: https://vuejs.org/guide/built-ins/transition.html#transition-modes
- `computed`: https://vuejs.org/guide/essentials/computed.html

---

## 3. Переводчик — кнопка «Очистить»

**Файл:** `src/components/panels/TranslatorPanel.vue`

### Что сделать

Добавьте кнопку «Очистить» рядом с «Перевести». При нажатии:
- Очищается поле «Исходный текст»
- Очищается поле «Перевод»
- Сбрасывается `manualOverride` (чтобы автоопределение снова заработало)

### Поведение

- Кнопка появляется только когда **есть что очищать** (в поле ввода есть
  текст ИЛИ есть перевод). Используйте `<Transition>` для плавного
  появления/исчезновения.
- Если поле ввода пустое и перевода нет — кнопка скрыта.
- Опционально: при длинном тексте (> 100 символов) показывать
  `window.confirm('Очистить поля? Введённый текст будет потерян.')`.

### Подсказки

- Метод `clear()`:
  ```js
  function clear() {
    if (inputText.value.length > 100) {
      if (!confirm('Очистить поля? Введённый текст будет потерян.')) return
    }
    inputText.value = ''
    translatedSentences.value = []
    manualOverride.value = false
  }
  ```
- `computed` `hasContent`:
  ```js
  const hasContent = computed(() =>
    inputText.value.trim() !== '' || translatedSentences.value.length > 0
  )
  ```
- Размещайте кнопку в `.translator__footer` рядом со счётчиком символов,
  но отдельно от кнопки «Перевести» — например, в левом углу.
- Стиль — `.translator__btn--ghost`, чтобы отличалась от «Перевести».

### Чеклист

- [ ] Кнопка появляется с fade-in когда есть контент
- [ ] Кнопка исчезает с fade-out когда контента нет
- [ ] При длинном тексте показывается confirm-диалог
- [ ] Сбрасывается `manualOverride` (проверьте, что после очистки направление снова «авто»)
- [ ] Кнопка визуально отличается от «Перевести»

### Ссылки

- `<Transition>`: https://vuejs.org/guide/built-ins/transition.html
- `computed`: https://vuejs.org/guide/essentials/computed.html

---

## 4. Переводчик — кнопка «Копировать» + toast через `<Teleport>`

**Файлы:** `src/components/panels/TranslatorPanel.vue`

### Что сделать

1. Добавьте кнопку «Копировать» рядом с полем «Перевод». При нажатии:
   - Полный текст перевода копируется в буфер обмена
   - Иконка на кнопке кратко меняется на ✓ (1.5с)
   - В правом нижнем углу экрана появляется toast «Текст скопирован»

2. Toast реализуйте через **`<Teleport to="body">`** — это важно. Toast
   должен быть вне DOM-дерева переводчика, чтобы не наследовать стили
   приложения и быть поверх всего контента.

### Поведение

- Кнопка «Копировать» `:disabled` если `translatedSentences` пустой
- Toast появляется с fade-in + slide-up, исчезает через 2с с fade-out
- Если нажать «Копировать» повторно, пока toast ещё виден — продлить
  его показ (не закрывать и снова открыть)
- Опционально: при отсутствии `navigator.clipboard` (старые браузеры)
  показать toast «Буфер обмена недоступен»

### Подсказки

- Полный текст перевода — `computed`:
  ```js
  const fullTranslation = computed(() =>
    translatedSentences.value.map(s => s.target).join(' ')
  )
  ```
- Метод `copy()`:
  ```js
  const showToast = ref(false)
  const copiedIcon = ref(false)
  let toastTimer = null

  async function copy() {
    if (!fullTranslation.value) return
    try {
      await navigator.clipboard.writeText(fullTranslation.value)
      copiedIcon.value = true
      setTimeout(() => { copiedIcon.value = false }, 1500)
      showToast.value = true
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => { showToast.value = false }, 2000)
    } catch (e) {
      console.error('Clipboard error:', e)
      // Опционально: показать toast с ошибкой
    }
  }
  ```
- Не забудьте `onBeforeUnmount(() => clearTimeout(toastTimer))`.
- Шаблон toast в конце `<template>`:
  ```vue
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="showToast" class="toast">Текст скопирован</div>
    </Transition>
  </Teleport>
  ```
- CSS `.toast` — `position: fixed; bottom: 24px; right: 24px; z-index: 1000`.

### Чеклист

- [ ] Кнопка «Копировать» `:disabled` когда перевода нет
- [ ] Иконка на кнопке меняется на ✓ после копирования, через 1.5с возвращается
- [ ] Toast появляется в правом нижнем углу экрана (не внутри переводчика!)
- [ ] Toast анимирован (fade + slide)
- [ ] При повторном копировании toast не «дёргается» (продлевается показ)
- [ ] При уходе со страницы таймер очищается

### Ссылки

- `<Teleport>`: https://vuejs.org/guide/built-ins/teleport.html
- `navigator.clipboard`: https://developer.mozilla.org/ru/docs/Web/API/Clipboard/writeText
- `onBeforeUnmount`: https://vuejs.org/api/composition-api-lifecycle.html#onbeforeunmount

---

# Дополнительные задачи

## 5. Фильтр найденных объектов по классу

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Над списком «Найденные объекты» — поле ввода с placeholder «Фильтр по классу…».
При вводе список фильтруется по имени класса (case-insensitive).

Внутри поля ввода — кнопка-крестик `[x]`, которая очищает фильтр. Кнопка
появляется только когда в поле есть текст (через `<Transition>` для плавного
появления).

Список должен анимироваться через `<TransitionGroup>` с `list-move` —
элементы плавно переезжают на новые позиции, исчезающие — fade-out.

### Подсказки

- `ref` `filterQuery` + `v-model` на input
- `computed` `filteredDetections` — фильтрация по `d.label.toLowerCase().includes(...)`
- Замените `v-for` в `<TransitionGroup>` на `filteredDetections` вместо `formattedDetections`
- CSS-классы `.list-move`, `.list-enter-active`, `.list-leave-active` уже есть —
  используйте `name="list"` на `<TransitionGroup>`
- Для `list-leave-active` обязательно `position: absolute`, иначе удалённые
  элементы оставляют «дырки» в layout
- Кнопка очистки: `v-if="filterQuery"` + `<Transition name="fade">` для появления.
  Обёрнута в position-absolute контейнер внутри input, чтобы не сдвигать layout.
  CSS: `position: absolute; right: 8px; top: 50%; transform: translateY(-50%);`
  Input нужно сделать с `padding-right: 32px`, чтобы текст не залезал под кнопку.

### Чеклист

- [ ] Фильтр case-insensitive
- [ ] При пустом фильтре — показываются все объекты
- [ ] При отсутствии совпадений — сообщение «Ничего не найдено»
- [ ] Элементы анимируются при фильтрации (move + leave)
- [ ] Кнопка `[x]` появляется только когда в поле есть текст
- [ ] Клик по `[x]` очищает `filterQuery`
- [ ] Кнопка анимируется при появлении/исчезновении (`<Transition>`)

### Ссылки

- `<TransitionGroup>`: https://vuejs.org/guide/built-ins/transition-group.html
- `computed` с фильтрацией: https://vuejs.org/guide/essentials/list.html#displaying-filtered-sorted-results
- Условный рендер с Transition: https://vuejs.org/guide/built-ins/transition.html

---

## 6. SVG-кольцо для счётчика символов

**Файл:** `src/components/panels/TranslatorPanel.vue`

### Что сделать

Замените текст «35 / 500» на SVG-кольцо, которое заполняется по мере ввода
текста. Цвета:
- 0–90% — `--color-primary`
- 90–100% — `--color-warning`
- > 100% — `--color-danger`

В центре кольца — текущий счётчик «35 / 500».

### Подсказки

- Базовая SVG:
  ```html
  <svg width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e6ec" stroke-width="4"/>
    <circle cx="24" cy="24" r="20" fill="none"
            :stroke="ringColor" stroke-width="4"
            :stroke-dasharray="ringCircumference"
            :stroke-dashoffset="ringDashoffset"
            transform="rotate(-90 24 24)"
            style="transition: stroke-dashoffset 0.3s ease"/>
  </svg>
  ```
- `computed` `ringPercent` — `Math.min(charCount / MAX_CHARS, 1.33)` (до 133%
  — больше 100% кольцо полностью красное)
- `computed` `ringCircumference` — `2 * Math.PI * 20 ≈ 125.66`
- `computed` `ringDashoffset` — `ringCircumference * (1 - Math.min(ringPercent, 1))`
- `computed` `ringColor` — выбор цвета по порогам

### Чеклист

- [ ] Кольцо плавно анимируется при вводе (transition: stroke-dashoffset)
- [ ] Цвет меняется при переходе через пороги (без анимации цвета — резко)
- [ ] В центре — счётчик «35 / 500»
- [ ] При пустом поле кольцо полностью серое

### Ссылки

- Реактивные SVG в Vue: https://vuejs.org/guide/essentials/template-syntax.html#dynamic-attributes
- SVG stroke-dasharray: https://developer.mozilla.org/ru/docs/Web/SVG/Attribute/stroke-dasharray

---

## 7. История переводов в Pinia

**Файлы:** `src/stores/history.js` (новый), `src/components/panels/TranslatorPanel.vue`

### Что сделать

Сохраняйте последние 5 уникальных переводов в новый Pinia-стор с
персистенцией в `localStorage`. Под полем вывода — раскрывающийся список
«Недавние переводы». Клик по элементу — восстановление исходного текста
и результата.

### Подсказки

- Создайте `src/stores/history.js` по образцу `src/stores/progress.js`:
  ```js
  export const useHistoryStore = defineStore('history', {
    state: () => {
      const saved = JSON.parse(localStorage.getItem('vue-transformers-history') || '[]')
      return { items: saved } // [{ id, source, target, direction, timestamp }]
    },
    getters: {
      recent: (s) => s.items.slice(0, 5),
      hasItems: (s) => s.items.length > 0,
    },
    actions: {
      add(item) {
        // Уникальность по source (или по source + direction)
        // Добавить в начало, обрезать до 5, персистировать
      },
      clear() { /* ... */ },
      persist() { /* ... */ },
    },
  })
  ```
- В `TranslatorPanel.vue` после успешного перевода вызывайте
  `historyStore.add({ source: inputText.value, target: fullTranslation.value, ... })`
- Список «Недавние переводы» — `<TransitionGroup>` с появлением элементов
- Кнопка «Очистить историю» с `confirm()`

### Чеклист

- [ ] После каждого перевода элемент добавляется в историю
- [ ] История сохраняется между сессиями (localStorage)
- [ ] Дубликаты (по source) не сохраняются — перемещаются в начало
- [ ] Максимум 5 элементов
- [ ] Клик по элементу восстанавливает и текст, и перевод
- [ ] Кнопка «Очистить историю» работает с подтверждением

### Ссылки

- Pinia: https://pinia.vuejs.org/core-concepts/
- localStorage: https://developer.mozilla.org/ru/docs/Web/API/Web_Storage_API
- `<TransitionGroup>`: https://vuejs.org/guide/built-ins/transition-group.html

---

## 8. Слайдер порога уверенности

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Над картинкой — range-слайдер «Показывать объекты с уверенностью ≥ N%».
При изменении:
- Список объектов фильтруется
- Боксы на canvas перерисовываются
- Под слайдером — счётчик «Показано: 3 из 5»

### Подсказки

- `ref` `threshold` со значением 0 (0%) по умолчанию
- `<input type="range" :min="minThreshold" max="100" step="0.1" v-model.number="threshold">`
  где `minThreshold` — `computed`, возвращающий наименьший из найденных
  confidence в процентах (с округлением вниз до 0.1):
  ```js
  const minThreshold = computed(() => {
    if (detections.value.length === 0) return 0
    const min = Math.min(...detections.value.map((d) => d.score))
    return Math.floor(min * 1000) / 10  // округление вниз до 0.1
  })
  ```
- `computed` `visibleDetections` — фильтр `detections.value.filter(d => d.score >= threshold.value / 100)`
- `watch` на `threshold` → `drawBoxes()` (нужно переписать `drawBoxes` на основе `visibleDetections`)
- В шаблоне списка используйте `visibleDetections` вместо `detections`
- При изменении слайдера canvas не нужно перезагружать — просто перерисовать

### Чеклист

- [ ] Слайдер от наименьшего confidence до 100% с шагом 0.1%
- [ ] Под слайдером — текущее значение и счётчик
- [ ] Список объектов фильтруется анимированно (TransitionGroup)
- [ ] Canvas перерисовывается (боксы низкого confidence исчезают)
- [ ] `min` динамически меняется при новой детекции (если самый уверенный бокс
  имеет 92.5%, нижняя граница станет ≈92.5%, а не 0)

### Ссылки

- `v-model.number`: https://vuejs.org/guide/essentials/forms.html#number
- `watch`: https://vuejs.org/guide/essentials/watchers.html

---

## 9. Кнопка «Озвучить перевод»

**Файл:** `src/components/panels/TranslatorPanel.vue`

### Что сделать

Рядом с «Копировать» — кнопка 🔊. Через `speechSynthesis.speak()`
произносит перевод вслух. Во время проигрывания иконка меняется на ⏸,
нажатие останавливает синтез.

### Подсказки

- Проверка поддержки: `if (!('speechSynthesis' in window)) { /* скрыть кнопку */ }`
- `ref` `isSpeaking`
- Метод `speak()`:
  ```js
  function speak() {
    if (isSpeaking.value) {
      speechSynthesis.cancel()
      isSpeaking.value = false
      return
    }
    const utter = new SpeechSynthesisUtterance(fullTranslation.value)
    utter.lang = effectiveDirection.value === 'ru_en' ? 'en-US' : 'ru-RU'
    utter.onend = () => { isSpeaking.value = false }
    utter.onerror = () => { isSpeaking.value = false }
    speechSynthesis.speak(utter)
    isSpeaking.value = true
  }
  ```
- `onBeforeUnmount(() => speechSynthesis.cancel())` — обязательно,
  иначе звук продолжится после ухода со страницы

### Чеклист

- [ ] Кнопка скрыта, если `speechSynthesis` недоступен
- [ ] Иконка меняется на ⏸ во время проигрывания
- [ ] Повторное нажатие останавливает синтез
- [ ] При уходе со страницы синтез останавливается
- [ ] Язык синтеза соответствует направлению перевода

### Ссылки

- `speechSynthesis`: https://developer.mozilla.org/ru/docs/Web/API/SpeechSynthesis
- `onBeforeUnmount`: https://vuejs.org/api/composition-api-lifecycle.html#onbeforeunmount

---

## 10. Drag-and-drop для перестановки найденных объектов

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Список найденных объектов можно перетаскивать мышью. Перетаскивание
меняет порядок в массиве `detections`. Боксы на canvas меняют цвет в
соответствии с новым порядком (цвет привязан к индексу).

### Подсказки

- `ref` `draggedIndex` — индекс перетаскиваемого элемента
- HTML5 Drag API:
  ```html
  <li
    v-for="(d, index) in formattedDetections"
    :key="d.label + '-' + index"
    draggable="true"
    @dragstart="onDragStart(index)"
    @dragover.prevent="onDragOver(index)"
    @drop="onDrop(index)"
    @dragend="draggedIndex = null"
  >
  ```
- Методы:
  ```js
  function onDragStart(i) { draggedIndex.value = i }
  function onDragOver(i) {
    if (draggedIndex.value === null || draggedIndex.value === i) return
    const arr = [...detections.value]
    const [moved] = arr.splice(draggedIndex.value, 1)
    arr.splice(i, 0, moved)
    detections.value = arr
    draggedIndex.value = i
  }
  function onDrop(i) { draggedIndex.value = null }
  ```
- `<TransitionGroup>` с `list-move` — для анимации переезда
- `watch` на `detections` → `drawBoxes()` — canvas обновится автоматически

### Чеклист

- [ ] Элементы можно перетаскивать
- [ ] Список переезжает плавно (list-move)
- [ ] Цвет боксов меняется после перестановки (красный → синий и т.д.)
- [ ] После `dragend` курсор не «залипает»

### Ссылки

- HTML5 Drag and Drop: https://developer.mozilla.org/ru/docs/Web/API/HTML_Drag_and_Drop_API
- `<TransitionGroup>` с move: https://vuejs.org/guide/built-ins/transition-group.html#move-transitions

---

## 11. Тёмная тема через CSS-переменные + Pinia

**Файлы:** `src/stores/theme.js` (новый), `src/components/AppSidebar.vue`, `src/assets/styles/base.css`

### Что сделать

Кнопка 🌙/☀️ в сайдбаре. Переключает тему. Все CSS-переменные (`--color-bg`,
`--color-text` и т.д.) заменяются на тёмные аналоги. Выбор сохраняется в
`localStorage`. По умолчанию — системная тема через `prefers-color-scheme`.

### Подсказки

- Создайте `src/stores/theme.js`:
  ```js
  export const useThemeStore = defineStore('theme', {
    state: () => {
      const saved = localStorage.getItem('vue-transformers-theme')
      return { theme: saved || 'system' } // 'light' | 'dark' | 'system'
    },
    getters: {
      isDark: (s) => {
        if (s.theme === 'dark') return true
        if (s.theme === 'light') return false
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      },
    },
    actions: {
      toggle() {
        this.theme = this.isDark ? 'light' : 'dark'
        this.persist()
        this.apply()
      },
      apply() {
        const isDark = this.isDark
        const root = document.documentElement
        if (isDark) {
          root.style.setProperty('--color-bg', '#0d1117')
          // ... все переменные
        } else {
          root.style.removeProperty('--color-bg')
          // ... вернуть дефолтные (можно просто удалить overrides)
        }
      },
      persist() { localStorage.setItem('vue-transformers-theme', this.theme) },
    },
  })
  ```
- В `AppSidebar.vue` добавьте кнопку с `<Transition>` для смены иконки 🌙/☀️
- В `App.vue` вызывайте `themeStore.apply()` в `onMounted` и `watch` на `theme`

### Чеклист

- [ ] Тема переключается по клику
- [ ] Выбор сохраняется между сессиями
- [ ] Системная тема по умолчанию (`prefers-color-scheme: dark`)
- [ ] Все цвета (фон, текст, бордеры, primary) меняются на тёмные аналоги
- [ ] Иконка в сайдбаре анимируется при переключении

### Ссылки

- CSS-переменные в JS: https://developer.mozilla.org/ru/docs/Web/CSS/--*
- `prefers-color-scheme`: https://developer.mozilla.org/ru/docs/Web/CSS/@media/prefers-color-scheme
- Pinia: https://pinia.vuejs.org/core-concepts/

---

## 12. Слайдер-шторка сравнения «до/после» для детектора

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Над картинкой — горизонтальный слайдер (0–100%). Он работает как
**шторка**: при `position=N` левая часть картинки (N%) показывается с
боксами, правая часть (100-N%) — без боксов (чистое изображение).

**Вертикальная черта-граница** между двумя зонами должна быть видна
всегда — она показывает, где проходит граница «до/после». Черта
двигается вместе со слайдером.

Визуально: одна картинка, на ней вертикальная линия; слева от линии
видны боксы, справа — нет. Перетаскивая слайдер (или саму линию
мышью), пользователь управляет положением границы.

### Подсказки

- Это не «две картинки рядом», а одна картинка с **clip-path** на canvas-overlay.
  Нижний слой — `<img>` (чистое изображение), верхний — `<canvas>` с боксами.
  Canvas обрезается справа через `clip-path: inset(0 X% 0 0)`, где X —
  процент скрытой зоны.
- `ref` `sliderPosition` со значением 100 (по умолчанию все боксы видны)
- `<input type="range" min="0" max="100" step="1" v-model.number="sliderPosition">`
  над картинкой.
- Canvas-overlay:
  ```html
  <canvas
    ref="canvasEl"
    :style="{ 'clip-path': `inset(0 ${100 - sliderPosition}% 0 0)` }"
    class="detector__overlay"
  />
  ```
  При `sliderPosition=100` — `inset(0 0% 0 0)` — canvas не обрезан, все
  боксы видны. При `sliderPosition=0` — `inset(0 100% 0 0)` — canvas
  полностью обрезан, боксов не видно.
- Вертикальная черта — отдельный `<div>` поверх картинки, позиционированный
  через `:style="{ left: sliderPosition + '%' }"`. CSS:
  ```css
  .detector__compare-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-primary);
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 2;
  }
  ```
- Опционально: перетаскивание черты мышью прямо по картинке через
  `@mousedown` + `@mousemove` + `@mouseup` — обновляет `sliderPosition`
  в процентах от ширины картинки.

### Чеклист

- [ ] Слайдер над картинкой (0–100%)
- [ ] При `position=100` видны все боксы (canvas не обрезан)
- [ ] При `position=0` боксов не видно (canvas полностью обрезан)
- [ ] Вертикальная черта-граница видна всегда, двигается вместе со слайдером
- [ ] Плавная анимация (без рывков) — `clip-path` меняется мгновенно,
  черта — через `transition: left 0.1s ease`

### Ссылки

- `clip-path`: https://developer.mozilla.org/ru/docs/Web/CSS/clip-path
- Динамические стили в Vue: https://vuejs.org/guide/essentials/class-and-style.html#binding-inline-styles

---

# Финальный чеклист

После выполнения обязательных 4 задач:

- [ ] Задача 1: Степпер загрузки работает на всех стадиях
- [ ] Задача 2: Панель количества объектов анимируется при изменении
- [ ] Задача 3: Кнопка «Очистить» с подтверждением для длинных текстов
- [ ] Задача 4: Toast через `<Teleport>`, без «дёрганий» при повторном копировании

После выполнения дополнительных (на выбор, минимум 3):

- [ ] Задача 5: Фильтр с list-move анимацией и кнопкой очистки
- [ ] Задача 6: SVG-кольцо с динамическими атрибутами
- [ ] Задача 7: История переводов сохраняется в localStorage
- [ ] Задача 8: Слайдер порога с динамическим min
- [ ] Задача 9: Озвучка с очисткой при unmount
- [ ] Задача 10: DnD-перестановка объектов
- [ ] Задача 11: Тёмная тема с системной по умолчанию
- [ ] Задача 12: Слайдер-шторка «до/после» с вертикальной чертой
- [ ] Задача 13: Управление видимостью боксов + color picker
- [ ] Задача 14: Переключатель темы в шапке main
- [ ] Задача 15: Блок «Найденные объекты» слева от фото + сортировка + скелетоны
- [ ] Задача 16: Переключатель языка + перевод классов + озвучка

## Критерии приёмки работы

Для сдачи обязательных задач:

1. **Функциональность** — все чеклисты из задач 1–4 отмечены
2. **Существующаяющая работа** — не сломаны: загрузка модели, детекция, перевод, переключение вкладок, прогресс изучения
3. **Чистота кода** — нет закомментированного кода, нет `console.log` (кроме логов загрузки моделей)
4. **Стили** — новый UI вписывается в существующий дизайн (использует CSS-переменные из `base.css`)
5. **Комментарии** — на русском, поясняют Vue-техники (как в существующем коде)

Для бонусных задач:

6. То же самое + 3 любые дополнительные задачи на выбор

---

# Продвинутые задачи (дополнительные)

Эти задачи сложнее предыдущих — они требуют понимания сразу нескольких
Vue-техник одновременно. Выполняйте последними, после обязательных и
простых дополнительных.

---

## 13. Управление видимостью боксов + color picker

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

После детекции рядом с каждым найденным объектом в списке появляется чекбокс.
Сняв галочку, можно скрыть соответствующий бокс на canvas. Возврат галочки —
бокс снова отображается.

Дополнительно:
- Две кнопки над списком: «Показать все» и «Скрыть все»
- При клике на бокс прямо на canvas — он скрывается (чекбокс в списке
  тоже снимается)
- Скрытые строки списка — с пониженной opacity (0.4) и зачёркиванием
- **Color picker**: клик по чекбоку с зажатым `Shift` открывает нативный
  `<input type="color">`, выбранный цвет применяется к этому и всем
  последующим боксам того же класса. Цвет хранится в `Map<label, color>`
  и используется в `drawBoxes()` вместо `BOX_COLORS[i]`.

### Поведение

- Все боксы видны по умолчанию после детекции
- Скрытие бокса НЕ удаляет его из массива `detections` — только меняет
  видимость. Это важно: если заново запустить детекцию, флаги видимости
  сбрасываются (все боксы снова видны)
- При изменении порога уверенности (задача 8) скрытые боксы остаются
  скрытыми, даже если порог их «включил» обратно
- Цвет, заданный через color picker, сохраняется до новой детекции

### Подсказки

- `ref`-массив `boxVisibility`: один булевый флаг на каждый детект.
  Синхронизируйте с `detections` через `watch` — при новых детекциях
  все боксы видны.
- `computed` `visibleDetections`: фильтр по `boxVisibility[i] === true`.
  Использовать в `drawBoxes()` вместо `detections` или `formattedDetections`.
- `watch` на `boxVisibility` с `{ deep: true }` → `nextTick(() => drawBoxes())`.
  deep — обязательно, иначе изменение одного элемента массива через
  `v-model` не trigger-нет watch.
- Для клика по canvas: `canvas.addEventListener('click', ...)` в
  `onMounted`, не забудьте `removeEventListener` в `onBeforeUnmount`.
  Координаты клика нужно масштабировать, если canvas отображается
  не в натуральном размере:
  ```js
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvas.width / rect.width)
  const y = (e.clientY - rect.top) * (canvas.height / rect.height)
  ```
- Color picker: `ref(new Map())` для `customColors`. В `drawBoxes()`
  читать цвет из мапы: `const color = customColors.value.get(d.label) || BOX_COLORS[i]`.
- `<input type="color" :value="currentColor" @input="setColor">` — нативный
  браузерный picker. Чтобы его открыть программно (по Shift+клик на чекбоксе),
  вызовите `.click()` на hidden color input.

### Чеклист

- [ ] Чекбокс у каждого элемента списка
- [ ] Снятие галочки скрывает бокс на canvas
- [ ] Возврат галочки — бокс снова виден
- [ ] Кнопки «Показать все» / «Скрыть все»
- [ ] Клик по боксу на canvas скрывает его (и снимает чекбокс в списке)
- [ ] Скрытые строки списка — с opacity 0.4 и зачёркиванием
- [ ] Новая детекция сбрасывает все флаги видимости
- [ ] Изменение порога (задача 8) не сбрасывает флаги видимости
- [ ] Shift+клик по чекбоксу открывает color picker
- [ ] Выбранный цвет применяется ко всем боксам того же класса
- [ ] Цвет хранится в `Map<label, color>` до новой детекции

### Ссылки

- `watch` с `deep`: https://vuejs.org/guide/essentials/watchers.html#deep-watchers
- `v-model` на массив: https://vuejs.org/guide/essentials/forms.html#v-model-with-array
- Canvas API: https://developer.mozilla.org/ru/docs/Web/API/Canvas_API
- `<input type="color">`: https://developer.mozilla.org/ru/docs/Web/HTML/Element/input/color

---

## 14. Переключатель темы в шапке main

**Файлы:** `src/App.vue`, `src/components/AppSidebar.vue`

### Что сделать

Перенесите кнопку переключения тёмной темы из сайдбара в правый верхний
угол блока `main` (в шапку страницы). Это более привычное место для такой
кнопки — как в GitHub, Notion, Vercel.

### Поведение

- Кнопка `🌙`/`☀️` располагается в правом верхнем углу `main`, фиксировано
  относительно блока (не скроллится вместе с контентом, а sticky сверху).
- При скролле страницы кнопка остаётся видимой.
- В сайдбаре кнопка удаляется.
- Все остальные функции темы (Pinia-стор, localStorage, `prefers-color-scheme`)
  остаются без изменений.

### Подсказки

- В `App.vue` оберните `<main>` содержимое в `<header>` или добавьте
  абсолютно-позиционированную кнопку:
  ```html
  <main class="app-main">
    <button class="theme-toggle" @click="themeStore.toggle">…</button>
    <RouterView v-slot="{ Component, route }">…</RouterView>
  </main>
  ```
- CSS `.theme-toggle`:
  ```css
  .theme-toggle {
    position: sticky;
    top: 16px;
    margin-left: auto;
    z-index: 10;
    /* …стили кнопки… */
  }
  ```
  `margin-left: auto` + flex-родитель прижмёт кнопку вправо.
- В `App.vue` импортируйте `useThemeStore` и используйте `themeStore.toggle`
  и `themeStore.icon` (как было в `AppSidebar`).
- В `AppSidebar.vue` удалите кнопку темы и связанный код (но импорт
  `useThemeStore` и `icon` — оставьте, если сайдбар ещё где-то показывает
  иконку, или удалите, если нет).

### Чеклист

- [ ] Кнопка темы в правом верхнем углу `main`
- [ ] При скролле кнопка остаётся видимой (sticky)
- [ ] В сайдбаре кнопки темы нет
- [ ] Переключение работает, тема сохраняется в localStorage
- [ ] Иконка анимируется при смене (через `<Transition mode="out-in">`)
- [ ] Не сломаны другие функции сайдбара (галочки, активная модель)

### Ссылки

- `position: sticky`: https://developer.mozilla.org/ru/docs/Web/CSS/position#sticky
- `<Transition mode="out-in">`: https://vuejs.org/guide/built-ins/transition.html#transition-modes

---

## 15. Блок «Найденные объекты» слева от фотографии + сортировка

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Блок «Найденные объекты» (включая поле фильтра, заголовок и список)
расположите **справа от фотографии**, а не под ней. Получится двухколоночный
layout: слева — изображение с canvas-overlay, справа — список найденных
объектов.

Дополнительно:
- Уменьшите размер pills (элементов списка) за счёт `padding` и `font-size`.
  Сейчас элементы крупные; сделайте их компактнее — `padding: 6px 10px`,
  `font-size: 12px` для подписи и счётчика, `12px` для точки-индикатора.
- На узких экранах (< 900px) блок должен автоматически переноситься
  под картинку (media query).

### Поведение

- Двухколоночный grid: `grid-template-columns: 1fr 280px; gap: 20px;`
  (картинка занимает всё оставшееся место, список — фиксированно 280px).
- На узких экранах `grid-template-columns: 1fr;` — список уходит под
  картинку.
- Слайдер порога (задача 8) и слайдер «до/после» (задача 12) остаются
  над картинкой.
- Метрики (задача 2) остаются над картинкой.
- Степпер (задача 1) остаётся над картинкой.

### Подсказки

- Оберните `.detector__canvas-wrap` и `.detector__results` в один
  `<div class="detector__layout">` с grid:
  ```css
  .detector__layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 20px;
  }
  @media (max-width: 900px) {
    .detector__layout { grid-template-columns: 1fr; }
  }
  ```
- Стили pills:
  ```css
  .detector__item { padding: 6px 10px; gap: 6px; }
  .detector__item-dot { width: 8px; height: 8px; }
  .detector__item-label { font-size: 12px; }
  .detector__item-score { font-size: 11px; }
  ```
- Заголовок «Найденные объекты» и поле фильтра остаются над списком
  внутри правой колонки.

### Чеклист

- [ ] Блок «Найденные объекты» справа от фотографии (на широких экранах)
- [ ] На узких экранах (<900px) — под фотографией
- [ ] Pills уменьшены (padding 6px 10px, font-size 12px)
- [ ] Метрики и слайдеры остались над картинкой
- [ ] Layout не ломается при отсутствии детекций (правая колонка скрыта
  через `v-if="formattedDetections.length"`)

### Ссылки

- CSS Grid: https://developer.mozilla.org/ru/docs/Web/CSS/CSS_Grid_Layout
- Media queries: https://developer.mozilla.org/ru/docs/Web/CSS/Media_Queries/Using_media_queries

---

Удачи! Если застряли — открывайте DevTools → Console, читайте ошибки,
и помните: Vue 3 документация на русском доступна по адресу
https://ru.vuejs.org/guide/introduction.html.

---

## 16. Переключатель языка + перевод классов + озвучка

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Добавьте переключатель языка (EN/RU) в блок «Найденные объекты».
При выборе RU названия классов переводятся на русский. На каждой плашке
появляется кнопка-динамик (🔊) — при нажатии озвучивается фраза:
«С вероятностью 99.5 процентов это кот».

### Подсказки

- Используйте `coco.js` — там уже есть русские переводы для всех 80
  классов. Не нужно запускать ML-перевод для каждого класса.
  ```js
  import { findClassByEn } from '@/content/coco'
  function getDisplayName(d) {
    if (displayLanguage.value === 'ru') {
      const cocoClass = findClassByEn(d.label)
      return cocoClass ? cocoClass.ru : d.label
    }
    return d.label
  }
  ```
- `ref` `displayLanguage` ('en' | 'ru') + кнопки EN/RU в шаблоне.
- Озвучка через `speechSynthesis`:
  ```js
  const phrase = `С вероятностью ${score} процентов это ${name}`
  ```
- ★ ВАЖНО про «процентов» vs «%»: в переводчике ru-en фраза с `%`
  переводится неправильно («With a probability of 99, this cat is»),
  а со словом «процентов» — правильно («With a 99.5% probability,
  it's a cat»). Даже для `speechSynthesis` лучше использовать «процентов»,
  чтобы фраза звучала естественно.
- ★ Костыль для «кот» vs «кошка»: `coco.js` уже содержит правильные
  переводы (cat → «кошка»). В русском языке чаще говорят «кот» для
  кота-самца. Если хотите «кот» вместо «кошки» — создайте override-мапу:
  ```js
  const RU_OVERRIDE = { cat: 'кот', dog: 'пёс', /* ... */ }
  ```
  и используйте её перед `findClassByEn`.
- `@click.stop` на кнопке динамика — чтобы не триггерить DnD на элементе списка.
- `speechSynthesis.cancel()` в `onBeforeUnmount` — чтобы остановить
  озвучку при уходе со страницы.

### Чеклист

- [ ] Переключатель EN/RU в блоке «Найденные объекты»
- [ ] При RU — названия классов на русском (из coco.js)
- [ ] Кнопка 🔊 на каждой плашке
- [ ] Фраза: «С вероятностью N процентов это [класс]»
- [ ] Повторное нажатие останавливает озвучку
- [ ] При уходе со страницы озвучка останавливается
- [ ] Используется «процентов», а не «%»
- [ ] (Опционально) override-мапа для «кот» вместо «кошки»

### Ссылки

- `speechSynthesis`: https://developer.mozilla.org/ru/docs/Web/API/SpeechSynthesis
- `findClassByEn` из `coco.js`: см. `src/content/coco.js`
