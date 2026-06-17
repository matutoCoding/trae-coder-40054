import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/Layout/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard/index.vue')
      },
      {
        path: 'preform-purchase',
        name: 'PreformPurchase',
        component: () => import('@/pages/PreformPurchase/index.vue')
      },
      {
        path: 'preform-inspection',
        name: 'PreformInspection',
        component: () => import('@/pages/PreformInspection/index.vue')
      },
      {
        path: 'blow-molding',
        name: 'BlowMolding',
        component: () => import('@/pages/BlowMolding/index.vue')
      },
      {
        path: 'bottle-inspection',
        name: 'BottleInspection',
        component: () => import('@/pages/BottleInspection/index.vue')
      },
      {
        path: 'volume-verification',
        name: 'VolumeVerification',
        component: () => import('@/pages/VolumeVerification/index.vue')
      },
      {
        path: 'warehousing',
        name: 'Warehousing',
        component: () => import('@/pages/Warehousing/index.vue')
      },
      {
        path: 'equipment-check',
        name: 'EquipmentCheck',
        component: () => import('@/pages/EquipmentCheck/index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
