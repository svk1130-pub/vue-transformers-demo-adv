export const techStackShort = ['Composition API', 'Router', 'Pinia', 'Transition']

export const techStackFull = [
  {
    category: 'Ядро Vue 3',
    items: [
      { name: 'Composition API', detail: 'все компоненты на <script setup>' },
      { name: 'Vue Router 4', detail: 'ленивый импорт страниц через () => import(...)' },
      { name: 'Pinia', detail: 'глобальное состояние: текущая модель, прогресс, тема' },
    ],
  },
  {
    category: 'Реактивность',
    items: [
      { name: 'ref / reactive', detail: 'локальное состояние компонентов' },
      { name: 'computed', detail: 'форматирование confidence, автоопределение направления, статус модели' },
      { name: 'watch', detail: 'авто-запуск детекции, реактивная подгрузка второй модели переводчика' },
      { name: 'shallowRef', detail: 'инстанс модели (без глубокой реактивности)' },
    ],
  },
  {
    category: 'Анимации',
    items: [
      { name: '<Transition>', detail: 'смена страниц, статусы модели, ошибки, прогресс-бар, canvas-overlay' },
      { name: '<TransitionGroup>', detail: 'staggering карточек хаба, список объектов детектора, предложения переводчика' },
      { name: 'list-move', detail: 'плавное перемещение элементов в TransitionGroup' },
    ],
  },
  {
    category: 'Композаблы и шаблоны',
    items: [
      { name: 'usePipeline', detail: 'единая обёртка над transformers.js' },
      { name: 'template ref', detail: '<canvas> для рисования боксов поверх <img>' },
      { name: 'defineProps / defineEmits', detail: 'типизированный API компонентов' },
    ],
  },
]
