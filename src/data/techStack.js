export const techStackShort = [
  'Composition API',
  'Router',
  'Pinia',
  'Transition',
  'TransitionGroup',
  'Teleport',
  'KeepAlive',
]

export const techStackFull = [
  {
    category: 'Ядро Vue 3',
    items: [
      { name: 'Composition API', detail: 'все компоненты на <script setup>' },
      { name: 'Vue Router 4', detail: 'ленивый импорт страниц через () => import(...), query-параметр ?tab=' },
      { name: 'Pinia', detail: 'глобальное состояние: текущая модель, прогресс изучения, история переводов, тема' },
      { name: 'useRoute / useRouter', detail: 'переключение вкладок через ?tab=how, программная навигация' },
    ],
  },
  {
    category: 'Реактивность',
    items: [
      { name: 'ref / reactive', detail: 'локальное состояние компонентов, массивы и Map' },
      { name: 'computed', detail: 'форматирование confidence, автоопределение направления, фильтрация и сортировка COCO, статус модели, динамический min порога' },
      { name: 'watch', detail: 'авто-запуск детекции, реактивная подгрузка модели, перерисовка canvas, сброс фильтра/порога/сортировки при новой детекции' },
      { name: 'watch с deep: true', detail: 'реакция на изменение элемента массива через v-model (видимость боксов)' },
      { name: 'shallowRef', detail: 'инстанс модели (без глубокой реактивности)' },
      { name: 'nextTick + requestAnimationFrame', detail: 'даём браузеру покрасить спиннер/«Идёт детекция…» до блокирующего WASM-инференса' },
    ],
  },
  {
    category: 'Анимации',
    items: [
      { name: '<Transition>', detail: 'смена страниц, статусы модели, ошибки, прогресс-бар, canvas-overlay, появление кнопок, toast, черта-граница' },
      { name: '<Transition mode="out-in">', detail: 'смена вкладок, смена иконки темы, смена подписи под степлером, смена чисел в метриках' },
      { name: '<TransitionGroup>', detail: 'staggering карточек хаба, список объектов детектора, предложения переводчика, чипсы COCO, галереи, викторина, история переводов' },
      { name: '<TransitionGroup> с list-move', detail: 'плавное перемещение элементов при фильтрации и сортировке' },
      { name: 'list-enter-active со staggering', detail: 'задержка через CSS-переменную --i (каскадное появление)' },
    ],
  },
  {
    category: 'Композаблы и шаблоны',
    items: [
      { name: 'usePipeline', detail: 'единая обёртка над transformers.js (env.allowLocalModels, dtype, progress_callback)' },
      { name: 'template ref', detail: '<canvas> для рисования боксов поверх <img>, скрытый <input type="color">' },
      { name: 'defineAsyncComponent', detail: 'ленивая загрузка вкладки «Как это работает»' },
      { name: 'markRaw', detail: 'компоненты в объекте tabs не реактивны' },
      { name: 'provide / inject', detail: 'связь демо-вкладки и вкладки «Как это работает» (detectedClasses, pendingSample, pendingText)' },
      { name: 'watch на inject-значениях', detail: 'реакция на выбор примера из галереи' },
    ],
  },
  {
    category: 'Динамический рендеринг',
    items: [
      { name: '<component :is> по типу данных', detail: 'рендеринг 6 разных секций «Как это работает» одним механизмом' },
      { name: '<component :is> из prop', detail: 'DemoPage-обёртка принимает компонент демо как prop' },
      { name: '<KeepAlive>', detail: 'сохранение состояния демо между переключениями вкладок (модель не перезагружается)' },
      { name: '<Teleport to="body">', detail: 'toast «Текст скопирован» рендерится вне DOM-дерева переводчика' },
      { name: 'Динамические :class', detail: 'подсветка правильных/неправильных ответов викторины, выделение бокса, hidden/highlighted/dragging' },
      { name: 'Динамические :style', detail: 'clip-path для шторки, left для черты-границы, transition-delay через --i' },
    ],
  },
  {
    category: 'Формы и ввод',
    items: [
      { name: 'v-model на input/textarea', detail: 'поле перевода, фильтр по классу, поиск COCO' },
      { name: 'v-model.number на range', detail: 'слайдер порога уверенности, слайдер-шторка сравнения' },
      { name: 'v-model на checkbox', detail: 'видимость боксов, ответы викторины' },
      { name: 'v-model на radio', detail: 'викторина (одиночный выбор)' },
      { name: 'v-model на select', detail: 'сортировка найденных объектов' },
      { name: 'Динамический :min на range', detail: 'слайдер порога: min = наименьший confidence из найденных' },
    ],
  },
  {
    category: 'Canvas и Web API',
    items: [
      { name: 'Canvas API', detail: 'рисование bounding box-ов с подписями классов и confidence' },
      { name: 'ctx.globalAlpha', detail: '40% opacity для невыделенных боксов при выделении' },
      { name: 'HTML5 Drag and Drop', detail: 'перестановка найденных объектов мышью' },
      { name: 'navigator.clipboard.writeText', detail: 'копирование перевода в буфер обмена' },
      { name: 'speechSynthesis', detail: 'озвучка перевода и найденных объектов (класс + % на выбранном языке)' },
      { name: 'localStorage', detail: 'персистенция прогресса, истории переводов и темы между сессиями' },
      { name: '<input type="color">', detail: 'выбор цвета бокса по классу (Shift+клик по чекбоксу)' },
    ],
  },
  {
    category: 'Стор (Pinia)',
    items: [
      { name: 'state / getters / actions', detail: 'классическая структура Pinia (progress, history, theme, demoStore)' },
      { name: 'Персистенция в localStorage', detail: 'load() при инициализации, persist() после каждого действия' },
      { name: 'storeToRefs', detail: 'распаковка геттеров для реактивности в шаблоне (currentModel, icon)' },
      { name: 'Map как state', detail: 'customColors: Map<label, color> — пересоздаём для реактивности' },
    ],
  },
  {
    category: 'CSS и дизайн',
    items: [
      { name: 'CSS-переменные', detail: '--color-bg, --color-text и т.д. — меняются через JS для тёмной темы' },
      { name: 'prefers-color-scheme', detail: 'системная тема по умолчанию (dark/light ОС)' },
      { name: 'CSS Grid', detail: 'двухколоночный layout детектора (картинка + список справа)' },
      { name: '@media (max-width: 900px)', detail: 'адаптивность — список уходит под картинку на узких экранах' },
      { name: 'clip-path: inset()', detail: 'шторка сравнения «до/после» на canvas-overlay' },
      { name: '@keyframes skeleton-shimmer', detail: 'скелетоны для метрик/порога/шторки во время загрузки' },
      { name: 'position: sticky / relative', detail: 'кнопка темы в правом верхнем углу, скроллится со страницей' },
      { name: 'accent-color', detail: 'стилизация нативных radio/checkbox/range под тему' },
    ],
  },
]
