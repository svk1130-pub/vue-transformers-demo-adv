# NEW_FEATURES — отличия ветки `solutions` от главной (`main`)

Этот документ описывает все 16 фич, добавленные в ветке `solutions` по сравнению
с `main`. Для каждой фичи указано: что делает, какие Vue-техники демонстрирует,
в каком файле реализована.

> Студентам: эти фичи НЕ входят в обязательную часть задания. Они реализованы
> как эталонные решения задач 1–16 из `TODO.md`. Смотрите `HOWTODO.md` для
> пошаговых решений.

---

## Сводная таблица фич

| # | Фича | Главная ветка | Solutions | Категория |
|---|------|----------------|-----------|-----------|
| 1 | 3-стадийный степпер загрузки | простой спиннер | степпер с галочками | UI/UX |
| 2 | Метрики объектов | нет | Найдено / Уникальных / Средняя уверенность | UI/UX |
| 3 | Кнопка «Очистить» в переводчике | нет | с подтверждением для длинных текстов | UI/UX |
| 4 | Кнопка «Копировать» + toast | нет | через `<Teleport to="body">` | Vue 3 техника |
| 5 | Фильтр найденных объектов | нет | поиск + кнопка [x], по 2 языкам | UI/UX |
| 6 | SVG-кольцо для счётчика символов | текст «35 / 500» | SVG с динамическими атрибутами | SVG + Vue |
| 7 | История переводов в Pinia | нет | последние 5, localStorage | Pinia |
| 8 | Слайдер порога уверенности | нет | динамический min, шаг 0.1% | UI/UX |
| 9 | Кнопка «Озвучить перевод» | нет | speechSynthesis с очисткой при unmount | Web API |
| 10 | Drag-and-drop перестановка объектов | нет | HTML5 Drag API + TransitionGroup | DnD |
| 11 | Тёмная тема | нет | CSS-переменные + Pinia + системная | Тема |
| 12 | Слайдер-шторка «до/после» | нет | clip-path + вертикальная черта | CSS + Vue |
| 13 | Управление видимостью боксов + color picker | нет | чекбоксы, Shift+клик для цвета, выделение по клику | Canvas + Vue |
| 14 | Переключатель темы в шапке | нет | `align-self: flex-end`, скроллится | Layout |
| 15 | Блок «Найденные объекты» справа от фото | список под фото | двухколоночный grid + сортировка + скелетоны | Layout |
| 16 | Переключатель языка + перевод классов + озвучка | нет | EN/RU, coco.js, speechSynthesis на 2 языках | Локализация |

---

## 1. 3-стадийный степпер загрузки детектора

**Файл:** `src/components/panels/DetectorPanel.vue`

Простой спиннер «Идёт загрузка…» заменён на 3-стадийный степпер:
① Загрузка изображения → ② Детекция → ③ Готово

- Активная стадия подсвечена, пройденная — с галочкой ✓, будущая — тусклая
- Под степпером — анимированная подпись через `<Transition mode="out-in">`
- После завершения показывается 1.5с, затем исчезает
- При «ничего не найдено» степпер остаётся с подписью «Готово — ничего не найдено»

**Vue-техники:** multi-state `computed`, `<Transition mode="out-in">` для смены подписи, динамические `:class` (active/done/pending)

---

## 2. Метрики объектов над картинкой

**Файл:** `src/components/panels/DetectorPanel.vue`

Над картинкой — мини-панель с тремя показателями:
- Найдено: N
- Уникальных классов: M
- Средняя уверенность: K%

При изменении каждого числа — анимация «перелистывания»: старое число уезжает вверх, новое въезжает снизу.

**Vue-техники:** 3 `computed` из одного массива (`totalCount`, `uniqueCount`, `averageConfidence`), `<Transition mode="out-in">` с `:key` по значению, `position: absolute` в leave-анимации

---

## 3. Кнопка «Очистить» в переводчике

**Файл:** `src/components/panels/TranslatorPanel.vue`

Кнопка появляется с fade-in только когда есть что очищать (текст или перевод). При длинном тексте (>100 символов) — `window.confirm()`. Сбрасывает `inputText`, `translatedSentences` и `manualOverride`.

**Vue-техники:** `computed` `hasContent`, `<Transition>` для условного появления кнопки, `confirm()` для длинных текстов

---

## 4. Кнопка «Копировать» + toast через `<Teleport>`

**Файл:** `src/components/panels/TranslatorPanel.vue`

Кнопка 📋 рядом с полем «Перевод». При нажатии:
- Полный текст копируется в `navigator.clipboard`
- Иконка меняется на ✓ на 1.5с
- В правом нижнем углу экрана появляется toast «Текст скопирован» через `<Teleport to="body">`

Toast рендерится вне DOM-дерева переводчика — не наследует `scoped` стили, не влияет на layout.

**Vue-техники:** `<Teleport to="body">` (чисто Vue 3 техника), `:global()` в scoped-стилях для toast, `clearTimeout` для продления toast при повторном копировании, `onBeforeUnmount` для очистки таймеров

---

## 5. Фильтр найденных объектов + кнопка [x]

**Файл:** `src/components/panels/DetectorPanel.vue`

Поле ввода над списком «Найденные объекты». Фильтрует список по имени класса.
Поиск работает сразу на 2 языках: «cat» найдёт «cat», «кот» тоже найдёт «cat» (через `findClassByEn().ru`).

Внутри поля — кнопка [x] для очистки, появляется только когда в поле есть текст (через `<Transition>`).

Фильтр также отсеивает боксы на canvas — `drawBoxes()` проверяет `matchesQuery`.

При новой детекции фильтр сбрасывается.

**Vue-техники:** `computed` с фильтрацией, `<TransitionGroup>` с `list-move`, `<Transition>` для условного появления кнопки [x], `position: absolute` внутри обёртки, `watch` для сброса

---

## 6. SVG-кольцо для счётчика символов

**Файл:** `src/components/panels/TranslatorPanel.vue`

Текст «35 / 500» заменён на SVG-кольцо, заполняющееся по мере ввода.
- 0–90% — зелёный, 90–100% — жёлтый, >100% — красный
- SVG 52×52, радиус 20, текст с `padding: 3px` (зазор)

**Vue-техники:** реактивные SVG-атрибуты (`:stroke-dasharray`, `:stroke-dashoffset`), `computed` для геометрии (`ringPercent`, `ringDashoffset`, `ringColor`)

---

## 7. История переводов в Pinia

**Файлы:** `src/stores/history.js` (новый), `src/components/panels/TranslatorPanel.vue`

Последние 5 уникальных переводов сохраняются в Pinia-стор с персистенцией в `localStorage`. Под полем вывода — раскрывающийся список «Недавние переводы». Клик по элементу — восстановление исходного текста и направления.

**Vue-техники:** Pinia `state`/`getters`/`actions`, `localStorage`, уникальность по `source`, `Date.now()` как id, `<TransitionGroup>` для появления элементов

---

## 8. Слайдер порога уверенности с динамическим min

**Файл:** `src/components/panels/DetectorPanel.vue`

Слайдер над картинкой: «Порог уверенности: ≥ N%».
- `min` = наименьший confidence из найденных (округлённый вниз до 0.1%)
- `max` = 100, `step` = 0.1
- При изменении — список фильтруется анимированно, canvas перерисовывается
- При новой детекции порог сбрасывается на min

**Vue-техники:** `v-model.number` на range, динамический `:min` через `computed`, `watch` для перерисовки canvas, `Math.floor(min * 1000) / 10` для округления

---

## 9. Кнопка «Озвучить перевод»

**Файл:** `src/components/panels/TranslatorPanel.vue`

Кнопка 🔊 рядом с «Копировать». Через `speechSynthesis.speak()` произносит перевод вслух.
- Язык синтеза соответствует направлению перевода (`en-US` / `ru-RU`)
- Во время проигрывания иконка меняется на ⏸, нажатие останавливает синтез
- `onBeforeUnmount` — `speechSynthesis.cancel()` (критично, иначе звук продолжится)

**Vue-техники:** `speechSynthesis` Web API, `SpeechSynthesisUtterance`, `onend`/`onerror`, `onBeforeUnmount` для очистки

---

## 10. Drag-and-drop перестановка найденных объектов

**Файл:** `src/components/panels/DetectorPanel.vue`

Список найденных объектов можно перетаскивать мышью. Перетаскивание меняет порядок в массиве `detections`. Боксы на canvas меняют цвет в соответствии с новым порядком.

**Vue-техники:** HTML5 Drag API (`@dragstart`, `@dragover.prevent`, `@drop`, `@dragend`), `ref` `draggedIndex`, `<TransitionGroup>` с `list-move`, `detections.value = arr` (новый массив для реактивности)

---

## 11. Тёмная тема через CSS-переменные + Pinia

**Файлы:** `src/stores/theme.js` (новый), `src/App.vue`, `src/components/AppSidebar.vue`

Кнопка 🌙/☀️ в правом верхнем углу `main`. Переключает тему. Все CSS-переменные (`--color-bg`, `--color-text` и т.д.) заменяются на тёмные аналоги через `document.documentElement.style.setProperty()`. Выбор сохраняется в `localStorage`. По умолчанию — системная тема через `prefers-color-scheme`.

**Vue-техники:** Pinia `state`/`getters`/`actions`, `document.documentElement.style.setProperty`, `removeProperty` для light, `prefers-color-scheme: dark`, `storeToRefs` для `icon`

---

## 12. Слайдер-шторка «до/после» с вертикальной чертой

**Файл:** `src/components/panels/DetectorPanel.vue`

Горизонтальный слайдер (0–100%) работает как шторка: при `position=N` левая часть картинки (N%) показывается с боксами, правая (100-N%) — без боксов.

Вертикальная черта-граница всегда видна, двигается вместе со слайдером.

**Vue-техники:** динамический `:style` с `clip-path: inset(0 X% 0 0)`, отдельный `<div>` для черты с `position: absolute` и `transform: translateX(-50%)`, `transition: left 0.1s ease`, `pointer-events: none`

---

## 13. Управление видимостью боксов + color picker + выделение по клику

**Файл:** `src/components/panels/DetectorPanel.vue`

После детекции рядом с каждым объектом в списке — чекбокс. Сняв галочку, можно скрыть соответствующий бокс на canvas.

- Кнопки «Показать все» / «Скрыть все»
- Shift+клик по чекбоксу открывает нативный `<input type="color">` — выбранный цвет применяется ко всем боксам того же класса
- **Клик по боксу на canvas**: первый клик — выделяет (pill получает рамку цветом класса, бокс — рамка в 2× толще, остальные боксы 40% opacity) + озвучивает; второй клик — снимает выделение, без озвучки
- Скрытые строки списка — с opacity 0.4 и зачёркиванием

**Vue-техники:** `ref`-массив `boxVisibility`, `ref(new Map())` для `customColors` (пересоздаём для реактивности), `watch` с `{ deep: true }`, `@click` на canvas, масштабирование координат (`canvas.width / rect.width`), `addEventListener` для color picker, `ctx.globalAlpha` для 40% opacity

---

## 14. Переключатель темы в шапке main

**Файлы:** `src/App.vue`, `src/components/AppSidebar.vue`

Кнопка темы перенесена из сайдбара в правый верхний угол `main`. `align-self: flex-end` прижимает вправо, скроллится вместе со страницей.

**Vue-техники:** `align-self: flex-end` в flex-column родителе, `<Transition mode="out-in">` для смены иконки

---

## 15. Блок «Найденные объекты» справа от фото + сортировка + скелетоны

**Файл:** `src/components/panels/DetectorPanel.vue`

Двухколоночный layout: картинка слева (1fr), список справа (280px). На узких экранах (<900px) — одна колонка.

Сортировка через `<select>`: % уверенности ↓ (по умолчанию), % уверенности ↑, класс А→Я, класс Я→А. Сортировка по классу работает на выбранном языке (RU → по русским именам из `coco.js`).

Скелетоны (shimmer-анимация) для метрик, порога и шторки во время загрузки/обработки.

При «ничего не найдено» — алерт «Ничего не найдено на этом изображении», степпер остаётся с подписью «Готово — ничего не найдено».

**Vue-техники:** CSS Grid `1fr 280px` с `align-items: start` и `min-width: 0`, `@media` для адаптивности, `v-model` на `<select>`, `localeCompare` на `getDisplayName(d)`, `@keyframes skeleton-shimmer`, `computed` `showSkeletons` с флагом `hasFinishedInference`

---

## 16. Переключатель языка + перевод классов + озвучка

**Файл:** `src/components/panels/DetectorPanel.vue`

Переключатель EN/RU в шапке блока «Найденные объекты».
- При RU названия классов переводятся на русский через `findClassByEn(d.label).ru` из `coco.js`
- На каждой плашке — кнопка 🔊, озвучивает фразу:
  - EN: `"With 99.5% probability, it's a cat"` (lang=`en-US`)
  - RU: `"С вероятностью 99.5 процентов это кот"` (lang=`ru-RU`)
- Повторное нажатие останавливает озвучку
- `onBeforeUnmount` — `speechSynthesis.cancel()`

**Vue-техники:** `ref` `displayLanguage`, `findClassByEn` из `coco.js`, `speechSynthesis` с `utter.lang`, `@click.stop` (не триггерит DnD), `getDisplayName(d)` используется и в шаблоне, и в сортировке

---

## Сводка изменений по файлам

| Файл | Задачи | Что меняем |
|------|-------|------------|
| `src/components/panels/DetectorPanel.vue` | 1, 2, 5, 8, 10, 12, 13, 15, 16 | Большая часть работы |
| `src/components/panels/TranslatorPanel.vue` | 3, 4, 6, 7, 9 | Большая часть работы |
| `src/stores/history.js` (новый) | 7 | Создать |
| `src/stores/theme.js` (новый) | 11 | Создать |
| `src/App.vue` | 11, 14 | Кнопка темы в шапке, `themeStore.apply()` |
| `src/components/AppSidebar.vue` | 14 | Удалить кнопку темы (перенесена в App.vue) |
| `src/data/techStack.js` | 2 (на хабе) | Обновить список технологий |

## Новые техники Vue, не использованные в главной ветке

- `<Teleport to="body">` — задача 4
- `<KeepAlive>` — обёртка DemoPage (уже было в main, но в solutions сохранено)
- `defineAsyncComponent` — обёртка DemoPage
- `markRaw` — обёртка DemoPage
- `provide`/`inject` — обёртки DetectorView/TranslatorView (уже было в main)
- `watch` с `{ deep: true }` — задача 13
- `Map` как `ref` — задача 13
- `navigator.clipboard` — задача 4
- `speechSynthesis` — задачи 9, 16
- `<input type="color">` — задача 13
- `clip-path` с динамическим `:style` — задача 12
- CSS-переменные через `setProperty` — задача 11
- `prefers-color-scheme` — задача 11
- `@keyframes` для скелетонов — задача 15
- `storeToRefs` для геттеров — задача 11
- HTML5 Drag API — задача 10
- Реактивный SVG (`:stroke-dashoffset`) — задача 6
