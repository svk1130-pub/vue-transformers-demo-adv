# Практические задания по доработке приложения

В этом файле — 12 задач для самостоятельной работы. Они подобраны так,
чтобы каждая демонстрировала **разную технику Vue 3**. Выполняя их, вы
пройдёте через `computed`, `<Transition>`, `<TransitionGroup>`, `<Teleport>`,
Pinia-сторы, реактивный SVG, HTML5 Drag API, CSS-переменные и многое другое.

## Правила

- **Обязательные задачи (1–4)** — нужно выполнить всем для сдачи.
- **Дополнительные (5–12)** — выполняйте по мере роста навыков. Любые 3 из
  них дают бонусные баллы. Все 8 — отлично.
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

### Чеклист

- [ ] Фильтр case-insensitive
- [ ] При пустом фильтре — показываются все объекты
- [ ] При отсутствии совпадений — сообщение «Ничего не найдено»
- [ ] Элементы анимируются при фильтрации (move + leave)

### Ссылки

- `<TransitionGroup>`: https://vuejs.org/guide/built-ins/transition-group.html
- `computed` с фильтрацией: https://vuejs.org/guide/essentials/list.html#displaying-filtered-sorted-results

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

- `ref` `threshold` со значением 0.5 (50%) по умолчанию
- `<input type="range" min="0" max="100" step="5" v-model.number="threshold">`
- `computed` `visibleDetections` — фильтр `detections.value.filter(d => d.score >= threshold.value / 100)`
- `watch` на `threshold` → `drawBoxes()` (нужно переписать `drawBoxes` на основе `visibleDetections`)
- В шаблоне списка используйте `visibleDetections` вместо `detections`
- При изменении слайдера canvas не нужно перезагружать — просто перерисовать

### Чеклист

- [ ] Слайдер от 0 до 100% с шагом 5%
- [ ] Под слайдером — текущее значение и счётчик
- [ ] Список объектов фильтруется анимированно (TransitionGroup)
- [ ] Canvas перерисовывается (боксы низкого confidence исчезают)

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

## 12. Слайдер сравнения «до/после» для детектора

**Файл:** `src/components/panels/DetectorPanel.vue`

### Что сделать

Над картинкой — вертикальный слайдер. Слева от него — оригинальное
изображение без боксов, справа — с боксами. Перетаскивая слайдер,
пользователь видит «чистое» изображение и результат детекции одновременно.

### Подсказки

- Два `<canvas>` друг над другом:
  - Нижний — чистая картинка (можно через `<img>` или canvas с изображением)
  - Верхний — canvas с боксами
- Верхний canvas обрезается через `clip-path: inset(0 X% 0 0)`:
  ```html
  <canvas
    ref="overlayCanvas"
    :style="{ 'clip-path': `inset(0 ${100 - sliderPosition}% 0 0)` }"
    class="detector__overlay"
  />
  ```
- `ref` `sliderPosition` со значением 50
- `<input type="range" min="0" max="100" v-model.number="sliderPosition">` над картинкой
- Опционально: перетаскивание слайдера мышью прямо по картинке через
  `@mousedown` + `@mousemove` + `@mouseup`

### Чеклист

- [ ] Слайдер над картинкой
- [ ] Перетаскивание слайдера обрезает canvas с боксами
- [ ] При position=0 видна только чистая картинка
- [ ] При position=100 видны только боксы
- [ ] Плавная анимация (без рывков)

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

- [ ] Задача 5: Фильтр с list-move анимацией
- [ ] Задача 6: SVG-кольцо с динамическими атрибутами
- [ ] Задача 7: История переводов сохраняется в localStorage
- [ ] Задача 8: Слайдер порога перерисовывает canvas
- [ ] Задача 9: Озвучка с очисткой при unmount
- [ ] Задача 10: DnD-перестановка объектов
- [ ] Задача 11: Тёмная тема с системной по умолчанию
- [ ] Задача 12: Слайдер «до/после» с clip-path

## Критерии приёмки работы

Для сдачи обязательных задач:

1. **Функциональность** — все чеклисты из задач 1–4 отмечены
2. **Существующаяющая работа** — не сломаны: загрузка модели, детекция, перевод, переключение вкладок, прогресс изучения
3. **Чистота кода** — нет закомментированного кода, нет `console.log` (кроме логов загрузки моделей)
4. **Стили** — новый UI вписывается в существующий дизайн (использует CSS-переменные из `base.css`)
5. **Комментарии** — на русском, поясняют Vue-техники (как в существующем коде)

Для бонусных задач:

6. То же самое + 3 любые дополнительные задачи на выбор

Удачи! Если застряли — открывайте DevTools → Console, читайте ошибки,
и помните: Vue 3 документация на русском доступна по адресу
https://ru.vuejs.org/guide/introduction.html.
