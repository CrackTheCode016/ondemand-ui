import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '~/views/DashboardView.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      title: 'EduChain Dashboard'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router