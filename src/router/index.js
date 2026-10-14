import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: 'Хаб — демо' } },
  { path: '/detector', name: 'detector', component: () => import('../views/DetectorView.vue'), meta: { title: 'Детектор объектов' } },
  { path: '/translator', name: 'translator', component: () => import('../views/TranslatorView.vue'), meta: { title: 'Переводчик' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title} — Vue + transformers.js` : 'Vue + transformers.js'
})

export default router
