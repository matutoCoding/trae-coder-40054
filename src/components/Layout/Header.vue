<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Menu,
  Bell,
  Search,
  User
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const store = useAppStore()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': '工作台',
    '/preform-purchase': '瓶坯采购',
    '/preform-inspection': '瓶坯检验',
    '/blow-molding': '加热吹瓶',
    '/bottle-inspection': '瓶身检测',
    '/volume-verification': '容量校验',
    '/warehousing': '装箱入库',
    '/equipment-check': '设备点检'
  }
  return titles[route.path] || '吹瓶管理系统'
})

const toggleSidebar = () => {
  store.toggleSidebar()
}
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
    <div class="flex items-center gap-4">
      <button
        class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        @click="toggleSidebar"
      >
        <Menu class="w-5 h-5 text-slate-600" />
      </button>
      <h1 class="text-lg font-semibold text-slate-800">{{ pageTitle }}</h1>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative hidden md:block">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="搜索..."
          class="w-64 pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
        />
      </div>
      
      <button class="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
        <Bell class="w-5 h-5 text-slate-600" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
          <User class="w-4 h-4 text-white" />
        </div>
        <div class="hidden md:block">
          <div class="text-sm font-medium text-slate-800">管理员</div>
          <div class="text-xs text-slate-500">生产主管</div>
        </div>
      </div>
    </div>
  </header>
</template>
