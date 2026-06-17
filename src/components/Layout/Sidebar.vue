<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardCheck,
  Flame,
  FlaskConical,
  Beaker,
  PackageOpen,
  Wrench
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const menuItems = [
  { path: '/dashboard', name: '工作台', icon: LayoutDashboard },
  { path: '/preform-purchase', name: '瓶坯采购', icon: ShoppingCart },
  { path: '/preform-inspection', name: '瓶坯检验', icon: ClipboardCheck },
  { path: '/blow-molding', name: '加热吹瓶', icon: Flame },
  { path: '/bottle-inspection', name: '瓶身检测', icon: FlaskConical },
  { path: '/volume-verification', name: '容量校验', icon: Beaker },
  { path: '/warehousing', name: '装箱入库', icon: PackageOpen },
  { path: '/equipment-check', name: '设备点检', icon: Wrench }
]

const isActive = (path: string) => route.path.startsWith(path)

const handleMenuClick = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside
    class="h-full bg-slate-900 text-white flex flex-col transition-all duration-300"
    :class="store.sidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <div class="h-16 flex items-center justify-center border-b border-slate-700">
      <template v-if="!store.sidebarCollapsed">
        <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
          <Flame class="w-5 h-5 text-white" />
        </div>
        <span class="font-bold text-lg">吹瓶管理系统</span>
      </div>
      </template>
      <template v-else>
        <div class="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
          <Flame class="w-5 h-5 text-white" />
        </div>
      </template>
    </div>
    
    <nav class="flex-1 py-4 px-2 space-y-1">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-200 rounded-lg mx-2"
        :class="isActive(item.path) 
          ? 'bg-cyan-600 text-white shadow-lg' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
        @click="handleMenuClick(item.path)"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!store.sidebarCollapsed" class="text-sm font-medium">{{ item.name }}</span>
      </div>
    </nav>

    <div v-if="!store.sidebarCollapsed" class="p-4 border-t border-slate-700">
      <div class="text-xs text-slate-400">v1.0.0</div>
    </div>
  </aside>
</template>
