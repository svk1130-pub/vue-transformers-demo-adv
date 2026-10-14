# Vue 3 + transformers.js — учебный SPA-демо

> Интерактивное приложение, которое показывает **Composition API, Vue Router, Pinia и Transition-анимации** на «вау-задачах» из машинного обучения. Модели работают прямо в браузере через [transformers.js](https://github.com/huggingface/transformers.js) — без сервера, без API-ключей, полностью офлайн после первой загрузки.

<p align="center">
  <em>Детектор объектов и переводчик, работающие в браузере на Vue 3.</em>
</p>

---

## ✨ Возможности

- **🎯 Детектор объектов** — загрузите картинку, нейросеть `Xenova/detr-resnet-50` найдёт объекты, нарисует bounding box-ы на `<canvas>` с подписями классов и confidence.
- **🌐 Переводчик RU ↔ EN** — модели `opus-mt-ru-en` / `opus-mt-en-ru` с автоопределением направления по наличию кириллицы, кнопкой Swap и **инкрементальным стримингом** по предложениям (результат появляется по одной строке за раз).
- **📚 Вкладка «Как это работает»** — для каждой демо-страницы: описание модели, ограничения, живые примеры, интерактивный поиск по 80 классам COCO с подсветкой найденных объектов и **мини-викторина** из 3 вопросов с проверкой и объяснениями.
- **📊 Прогресс изучения** — прогресс-бар на хабе, галочки «✓» в сайдбаре, персистенция в `localStorage`, кнопка сброса.
- **🎨 Анимации повсюду** — `<Transition>` для смены страниц/статусов/ошибок, `<TransitionGroup>` со staggering для карточек хаба / списка объектов / предложений перевода / чипсов COCO.

---

## 🛠 Стек

| Слой | Технология |
|------|------------|
| Сборка | **Vite 6** |
| Фреймворк | **Vue 3.5** (Composition API, `<script setup>`) |
| Роутинг | **Vue Router 4** (ленивый импорт, `?tab=` query) |
| Состояние | **Pinia** (глобальное + прогресс изучения) |
| Стили | Чистый CSS (без UI-фреймворков) |
| ML | **`@huggingface/transformers`** (transformers.js, ONNX Runtime Web) |
| Язык | JavaScript (без TypeScript) |

---

## 🚀 Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/ВАШ_ЛОГИН/vue-transformers-demo.git
cd vue-transformers-demo

# 2. Установить зависимости
npm install

# 3. Скачать модели (384 МБ, один раз) и WASM-файлы
npm run setup

# 4. Запустить dev-сервер
npm run dev
# → http://localhost:5173
```

### Production-сборка

```bash
npm run build      # в dist/
npm run preview    # локальный preview на http://localhost:4173
```

---

## 📖 Что изучают студенты

Этот проект — не про ML, а про **чистый Vue 3 код**. Модели здесь как источник эффектных демо. Все техники собраны в одном приложении:

| Техника | Где используется |
|---|---|
| **`useRoute` / `useRouter`** | Переключение вкладок через `?tab=how` |
| **`computed` от `route.query`** | Определение активной вкладки |
| **`<Transition mode="out-in">`** | Смена страниц, статусы, ошибки, прогресс |
| **`<TransitionGroup>` со staggering** | Карточки хаба, список объектов, предложения перевода, чипсы COCO, галереи, викторина |
| **`<KeepAlive>`** | Сохранение состояния демо между переключениями вкладок |
| **`defineAsyncComponent`** | Ленивая загрузка вкладки «Как это работает» |
| **`markRaw`** | Компоненты в объекте `tabs` не реактивны |
| **`<component :is>`** | Рендеринг секций по типу данных + DemoPage-обёртка |
| **`provide` / `inject`** | Связь «Демо» ↔ «Как это работает» |
| **`watch` на inject-значениях** | Реакция на выбор примера из галереи |
| **`watch` + `nextTick` + `requestAnimationFrame`** | Даём браузеру покрасить спиннер ДО блокирующего WASM-инференса |
| **`v-model` на radio** | Викторина |
| **`computed`** | Проверка викторины, фильтрация COCO, автоопределение направления перевода |
| **Динамические классы** | Подсветка правильных/неправильных ответов, найденных классов |
| **`template ref`** | `<canvas>` для рисования боксов поверх `<img>` |
| **Pinia (state/getters/actions)** | Прогресс изучения |
| **Персистенция в `localStorage`** | Сохранение прогресса между сессиями |

---

## 📁 Структура проекта

```
src/
  main.js                       # точка входа
  App.vue                       # каркас: сайдбар + RouterView + Transition
  router/
    index.js                    # ленивый импорт страниц
  stores/
    demoStore.js                # текущая загруженная модель
    progress.js                 # прогресс изучения (localStorage)
  composables/
    usePipeline.js              # единая обёртка над transformers.js
  content/
    coco.js                     # 80 классов COCO
    detector.js                 # контент «Как это работает» для детектора
    translator.js               # контент «Как это работает» для переводчика
  data/
    techStack.js                # справочник Vue-технологий
  components/
    AppSidebar.vue              # навигация + галочки изученного
    DemoCard.vue                # карточка демо на хабе
    ModelStatus.vue             # индикатор статуса модели
    ProgressBar.vue             # прогресс загрузки
    ErrorBanner.vue             # баннер ошибки (slide-down)
    DemoPage.vue                # обёртка с двумя вкладками + KeepAlive
    HowItWorksPanel.vue         # рендерер секций «Как это работает»
    panels/
      DetectorPanel.vue         # демо-логика детектора
      TranslatorPanel.vue       # демо-логика переводчика
    sections/
      TextSection.vue           # текстовая секция
      ListSection.vue           # список (маркеры)
      ChipsSection.vue          # чипсы COCO с поиском + подсветкой
      GallerySection.vue        # галерея примеров (детектор)
      ExamplesSection.vue       # карточки примеров (переводчик)
      QuizSection.vue           # мини-викторина
  views/
    HomeView.vue                # хаб: карточки + прогресс + технологии
    DetectorView.vue            # тонкая обёртка с provide
    TranslatorView.vue          # тонкая обёртка с provide
  wasm/                         # ONNX Runtime Web (.mjs + .wasm) — генерируется npm run setup
  assets/styles/
    base.css                    # глобальные стили + CSS-переменные
public/
  favicon.svg
  samples/                      # примеры изображений
  samples/err/                  # примеры «что распознаётся плохо»
  models/                       # генерируется через `npm run setup`
scripts/
  download-models.js            # `npm run setup` — модели + WASM с retry
```

---

## 🧠 Модели

Все модели — из семейства `Xenova/*` на Hugging Face Hub, в ONNX-формате, работают через ONNX Runtime Web (WASM).

| Модель | Задача | Размер | dtype |
|--------|--------|-------|-------|
| `Xenova/detr-resnet-50` | object-detection | 166 МБ | `fp32` |
| `Xenova/opus-mt-ru-en` | translation | 108 МБ | `q8` (квантованная) |
| `Xenova/opus-mt-en-ru` | translation | 108 МБ | `q8` (квантованная) |

Суммарно ~384 МБ. После первого запуска кэшируются в IndexedDB (`env.useBrowserCache = true`) — повторные открытия мгновенны.

---

## ⚙️ Важно про transformers.js v3 + Vite

Три неочевидных нюанса, учтённых в `usePipeline.js`:

1. **`env.allowLocalModels = true`** — по умолчанию в браузере `false`. Без этой опции библиотека игнорирует локальные модели.
2. **Явный `dtype`** — transformers.js v3 по умолчанию ищет `_quantized.onnx` файлы. Для `detr-resnet-50` мы передаём `dtype: 'fp32'` (используем `model.onnx` без квантования), для `opus-mt-*` — `dtype: 'q8'`.
3. **WASM-файлы в `src/wasm/`** — `onnxruntime-web` v1.21+ грузит WASM через динамический `import()` от `.mjs`-обёртки. Vite ломает такой импорт query-параметром `?import`, если `.mjs` лежит в `public/`. Решение: `.mjs` + `.wasm` лежат в `src/wasm/` и резолвятся через `new URL('../wasm/...', import.meta.url)`.

---

## 📕 HOWTO — полный проход по приложению

Подробный пошаговый гид с 6 этапами и чеклистом из 17 пунктов — в [`HOWTO.md`](./HOWTO.md). Пройдите все этапы, увидите каждую фишку в действии.

---

## 🎓 Для кого этот проект

- Для студентов, изучающих Vue 3 и Composition API
- Для преподавателей, ищущих готовый пример интеграции ML в SPA
- Для разработчиков, которым интересно, как запустить нейросеть в браузере без бэкенда
- Для всех, кто хочет увидеть, что `<Transition>` и `<TransitionGroup>` могут делать в реальном приложении, а не в песочнице

---

## ❌ Что НЕ входит в проект

- Авторизация и страница входа
- Web Worker для инференса (весь код async/await, миграция тривиальна)
- Адаптивность под мобильные устройства
- Тёмная тема
- Тесты

Это осознанные ограничения для учебного демо.

---

## 📜 Лицензия

MIT — используйте, форкайте, препо́дайте свободно.

Модели распространяются по лицензии Apache 2.0 через Hugging Face Hub.

---

## 🙏 Благодарности

- [Hugging Face](https://huggingface.co/) — за transformers.js и модели `Xenova/*`
- [ONNX Runtime](https://onnxruntime.ai/) — за ONNX Runtime Web
- [Vue.js team](https://vuejs.org/) — за Composition API и Transition-компоненты
- [Vite](https://vitejs.dev/) — за быструю сборку
