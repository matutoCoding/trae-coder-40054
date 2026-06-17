<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Wrench,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Settings,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import BaseModal from '@/components/Modal/BaseModal.vue'
import { useToast } from '@/composables/useToast'
import type { MaintenanceLog } from '@/types'

const store = useAppStore()
const toast = useToast()

const activeTab = ref<'equipment' | 'maintenance'>('equipment')
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRow = ref<string | null>(null)

const showAddModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref('')

const addForm = ref({
  equipmentId: '',
  type: '' as MaintenanceLog['type'] | '',
  title: '',
  content: '',
  result: '' as MaintenanceLog['result'] | '',
  partsReplaced: '',
  operator: '',
  date: new Date().toISOString().split('T')[0],
  nextDate: '',
  remark: ''
})

const filteredEquipments = computed(() => {
  let result = store.equipments
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(e =>
      e.name.toLowerCase().includes(keyword) ||
      e.equipmentNo.toLowerCase().includes(keyword) ||
      e.model.toLowerCase().includes(keyword)
    )
  }
  if (statusFilter.value) {
    result = result.filter(e => e.status === statusFilter.value)
  }
  return result
})

const filteredLogs = computed(() => {
  let result = store.maintenanceLogs
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(l =>
      l.title.toLowerCase().includes(keyword) ||
      l.equipmentName.toLowerCase().includes(keyword)
    )
  }
  if (statusFilter.value) {
    result = result.filter(l => l.type === statusFilter.value)
  }
  return result
})

const pagedEquipments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredEquipments.value.slice(start, start + pageSize.value)
})

const pagedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  const total = activeTab.value === 'equipment'
    ? filteredEquipments.value.length
    : filteredLogs.value.length
  return Math.ceil(total / pageSize.value) || 1
})

const statCards = computed(() => {
  const total = store.equipments.length
  const running = store.equipments.filter(e => e.status === 'running').length
  const maintenance = store.equipments.filter(e => e.status === 'maintenance').length
  const pending = store.maintenanceLogs.filter(l => l.result === 'pending').length
  return [
    { title: '设备总数', value: total, unit: '台', icon: Settings, bgColor: 'bg-blue-50' },
    { title: '运行中', value: running, unit: '台', icon: CheckCircle, bgColor: 'bg-emerald-50' },
    { title: '维护中', value: maintenance, unit: '台', icon: Wrench, bgColor: 'bg-amber-50' },
    { title: '待点检', value: pending, unit: '项', icon: Clock, bgColor: 'bg-purple-50' }
  ]
})

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    running: '运行中',
    maintenance: '维护中',
    fault: '故障',
    idle: '空闲'
  }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    running: 'bg-emerald-100 text-emerald-700',
    maintenance: 'bg-amber-100 text-amber-700',
    fault: 'bg-red-100 text-red-700',
    idle: 'bg-slate-100 text-slate-600'
  }
  return map[status] || 'bg-slate-100 text-slate-600'
}

const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    daily: '日常点检',
    weekly: '周度维护',
    monthly: '月度保养',
    repair: '维修',
    cleaning: '清洁保养'
  }
  return map[type] || type
}

const getTypeClass = (type: string) => {
  const map: Record<string, string> = {
    daily: 'bg-blue-100 text-blue-700',
    weekly: 'bg-cyan-100 text-cyan-700',
    monthly: 'bg-purple-100 text-purple-700',
    repair: 'bg-red-100 text-red-700',
    cleaning: 'bg-emerald-100 text-emerald-700'
  }
  return map[type] || 'bg-slate-100 text-slate-600'
}

const getResultText = (result: string) => {
  const map: Record<string, string> = {
    pass: '合格',
    fail: '不合格',
    pending: '待处理'
  }
  return map[result] || result
}

const getResultClass = (result: string) => {
  const map: Record<string, string> = {
    pass: 'bg-emerald-100 text-emerald-700',
    fail: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700'
  }
  return map[result] || 'bg-slate-100 text-slate-600'
}

const toggleExpand = (id: string) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

const getEquipmentMaintenanceLogs = (equipmentId: string) => {
  return store.getMaintenanceLogsByEquipment(equipmentId)
}

const openAddModal = (defaultType?: string) => {
  addForm.value = {
    equipmentId: '',
    type: (defaultType || '') as MaintenanceLog['type'] | '',
    title: '',
    content: '',
    result: '',
    partsReplaced: '',
    operator: '',
    date: new Date().toISOString().split('T')[0],
    nextDate: '',
    remark: ''
  }
  showAddModal.value = true
}

const onEquipmentChange = () => {
  const equipment = store.equipments.find(e => e.id === addForm.value.equipmentId)
  if (equipment && addForm.value.type === 'cleaning') {
    addForm.value.title = `${equipment.name} 模具清洁保养`
  }
}

const submitAdd = () => {
  const form = addForm.value
  if (!form.equipmentId) {
    toast.error('请选择设备')
    return
  }
  if (!form.type) {
    toast.error('请选择点检类型')
    return
  }
  if (!form.title.trim()) {
    toast.error('请填写标题')
    return
  }
  if (!form.result) {
    toast.error('请选择点检结果')
    return
  }
  if (!form.operator.trim()) {
    toast.error('请填写操作员')
    return
  }

  const equipment = store.equipments.find(e => e.id === form.equipmentId)
  if (!equipment) {
    toast.error('设备不存在')
    return
  }

  store.addMaintenanceLog({
    equipmentId: form.equipmentId,
    equipmentName: equipment.name,
    type: form.type as MaintenanceLog['type'],
    title: form.title.trim(),
    content: form.content,
    result: form.result as MaintenanceLog['result'],
    partsReplaced: form.partsReplaced,
    operator: form.operator.trim(),
    date: form.date,
    nextDate: form.nextDate,
    remark: form.remark
  })

  showAddModal.value = false
  toast.success('点检记录添加成功')
}

const confirmDelete = (id: string) => {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

const executeDelete = () => {
  store.deleteMaintenanceLog(deleteTargetId.value)
  showDeleteConfirm.value = false
  toast.success('点检记录已删除')
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const resetFilter = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1
}

const switchTab = (tab: 'equipment' | 'maintenance') => {
  activeTab.value = tab
  currentPage.value = 1
  statusFilter.value = ''
  expandedRow.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="(card, index) in statCards"
        :key="index"
        class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500 mb-1">{{ card.title }}</p>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold text-slate-800">{{ card.value }}</span>
              <span class="text-sm text-slate-500">{{ card.unit }}</span>
            </div>
          </div>
          <div :class="[card.bgColor, 'p-3 rounded-xl']">
            <component :is="card.icon" class="w-6 h-6 text-slate-700" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <div class="border-b border-slate-200">
        <div class="flex gap-8 px-6">
          <button
            class="py-4 px-1 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'equipment'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'"
            @click="switchTab('equipment')"
          >
            设备档案
          </button>
          <button
            class="py-4 px-1 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'maintenance'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'"
            @click="switchTab('maintenance')"
          >
            点检记录
          </button>
        </div>
      </div>

      <div class="p-6">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="relative">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="searchKeyword"
                type="text"
                :placeholder="activeTab === 'equipment' ? '搜索设备名称/编号...' : '搜索记录标题/设备...'"
                class="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <div class="relative">
              <Filter class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                v-model="statusFilter"
                class="pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer"
              >
                <option value="">{{ activeTab === 'equipment' ? '全部状态' : '全部类型' }}</option>
                <template v-if="activeTab === 'equipment'">
                  <option value="running">运行中</option>
                  <option value="maintenance">维护中</option>
                  <option value="fault">故障</option>
                  <option value="idle">空闲</option>
                </template>
                <template v-else>
                  <option value="daily">日常点检</option>
                  <option value="weekly">周度维护</option>
                  <option value="monthly">月度保养</option>
                  <option value="repair">维修</option>
                  <option value="cleaning">清洁保养</option>
                </template>
              </select>
            </div>
            <button
              class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              @click="resetFilter"
            >
              <RefreshCw class="w-4 h-4" />
              重置
            </button>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors"
              @click="openAddModal('cleaning')"
            >
              <Wrench class="w-4 h-4" />
              新增模具清洁保养
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm"
              @click="openAddModal()"
            >
              <Plus class="w-4 h-4" />
              新增点检
            </button>
          </div>
        </div>

        <template v-if="activeTab === 'equipment'">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="w-10 pb-3"></th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">设备编号</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">设备名称</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">型号</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">位置</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">上次保养</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">下次保养</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="item in pagedEquipments" :key="item.id">
                  <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td class="py-4">
                      <button class="p-1 hover:bg-slate-200 rounded" @click="toggleExpand(item.id)">
                        <ChevronDown v-if="expandedRow !== item.id" class="w-4 h-4 text-slate-400" />
                        <ChevronUp v-else class="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                    <td class="py-4 text-sm font-medium text-slate-800">{{ item.equipmentNo }}</td>
                    <td class="py-4 text-sm text-slate-700">{{ item.name }}</td>
                    <td class="py-4 text-sm text-slate-600">{{ item.model }}</td>
                    <td class="py-4 text-sm text-slate-600">
                      {{ item.type === 'blower' ? '吹瓶机' : item.type === 'mold' ? '模具' : item.type === 'inspection' ? '检测设备' : '其他' }}
                    </td>
                    <td class="py-4 text-sm text-slate-600">{{ item.location }}</td>
                    <td class="py-4">
                      <span :class="[getStatusClass(item.status), 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium']">
                        <span v-if="item.status === 'running'" class="w-1.5 h-1.5 bg-current rounded-full mr-1.5 animate-pulse"></span>
                        {{ getStatusText(item.status) }}
                      </span>
                    </td>
                    <td class="py-4 text-sm text-slate-600">{{ item.lastMaintenanceDate }}</td>
                    <td class="py-4 text-sm">
                      <span :class="new Date(item.nextMaintenanceDate) < new Date() ? 'text-red-600' : 'text-slate-600'">
                        {{ item.nextMaintenanceDate }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="expandedRow === item.id" class="bg-slate-50">
                    <td colspan="9" class="py-4 px-10">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 class="text-sm font-medium text-slate-800 mb-3">设备信息</h4>
                          <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                              <span class="text-slate-500">安装日期</span>
                              <span class="text-slate-700">{{ item.installDate }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">设备编号</span>
                              <span class="text-slate-700">{{ item.equipmentNo }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">设备状态</span>
                              <span :class="[getStatusClass(item.status), 'px-2 py-0.5 rounded text-xs font-medium']">
                                {{ getStatusText(item.status) }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 class="text-sm font-medium text-slate-800 mb-3">历史保养记录</h4>
                          <div v-if="getEquipmentMaintenanceLogs(item.id).length === 0" class="text-sm text-slate-400">
                            暂无保养记录
                          </div>
                          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                            <div
                              v-for="log in getEquipmentMaintenanceLogs(item.id)"
                              :key="log.id"
                              class="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200"
                            >
                              <div class="flex items-center gap-3">
                                <span class="text-sm text-slate-500">{{ log.date }}</span>
                                <span :class="[getTypeClass(log.type), 'text-xs px-2 py-0.5 rounded-full font-medium']">
                                  {{ getTypeText(log.type) }}
                                </span>
                                <span class="text-sm text-slate-700">{{ log.title }}</span>
                              </div>
                              <span :class="[getResultClass(log.result), 'text-xs px-2 py-0.5 rounded-full font-medium']">
                                {{ getResultText(log.result) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="w-10 pb-3"></th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">记录编号</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">标题</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">设备</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">结果</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作人</th>
                  <th class="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">日期</th>
                  <th class="text-right pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="log in pagedLogs" :key="log.id">
                  <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td class="py-4">
                      <button class="p-1 hover:bg-slate-200 rounded" @click="toggleExpand(log.id)">
                        <ChevronDown v-if="expandedRow !== log.id" class="w-4 h-4 text-slate-400" />
                        <ChevronUp v-else class="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                    <td class="py-4 text-sm font-medium text-slate-800">{{ log.id }}</td>
                    <td class="py-4">
                      <span :class="[getTypeClass(log.type), 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium']">
                        {{ getTypeText(log.type) }}
                      </span>
                    </td>
                    <td class="py-4 text-sm text-slate-700">{{ log.title }}</td>
                    <td class="py-4 text-sm text-slate-600">{{ log.equipmentName }}</td>
                    <td class="py-4">
                      <span :class="[getResultClass(log.result), 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium']">
                        <span v-if="log.result === 'pending'" class="w-1.5 h-1.5 bg-current rounded-full mr-1.5 animate-pulse"></span>
                        {{ getResultText(log.result) }}
                      </span>
                    </td>
                    <td class="py-4 text-sm text-slate-600">{{ log.operator }}</td>
                    <td class="py-4 text-sm text-slate-600">{{ log.date }}</td>
                    <td class="py-4 text-right pr-4">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                          @click="confirmDelete(log.id)"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="expandedRow === log.id" class="bg-slate-50">
                    <td colspan="9" class="py-4 px-10">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 class="text-sm font-medium text-slate-800 mb-3">点检内容</h4>
                          <div class="text-sm text-slate-600 whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200">
                            {{ log.content || '无' }}
                          </div>
                        </div>
                        <div>
                          <h4 class="text-sm font-medium text-slate-800 mb-3">详细信息</h4>
                          <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                              <span class="text-slate-500">设备名称</span>
                              <span class="text-slate-700">{{ log.equipmentName }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">点检类型</span>
                              <span class="text-slate-700">{{ getTypeText(log.type) }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">点检结果</span>
                              <span :class="[getResultClass(log.result), 'px-2 py-0.5 rounded text-xs font-medium']">
                                {{ getResultText(log.result) }}
                              </span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">更换配件</span>
                              <span class="text-slate-700">{{ log.partsReplaced || '无' }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">下次点检</span>
                              <span class="text-slate-700">{{ log.nextDate || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">备注</span>
                              <span class="text-slate-700">{{ log.remark || '-' }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>

        <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <div class="text-sm text-slate-500">
            共 {{ activeTab === 'equipment' ? filteredEquipments.length : filteredLogs.length }} 条记录
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </button>
            <template v-for="page in Math.min(totalPages, 7)" :key="page">
              <button
                v-if="page <= 3 || page > totalPages - 3 || page === currentPage"
                class="w-8 h-8 text-sm rounded-md transition-colors"
                :class="page === currentPage
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
              <span v-else-if="page === 4 && totalPages > 7" class="text-slate-400 px-1">...</span>
            </template>
            <button
              class="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model:visible="showAddModal" title="新增点检记录" width="640px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">选择设备</label>
            <select
              v-model="addForm.equipmentId"
              @change="onEquipmentChange"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="">请选择设备</option>
              <option v-for="eq in store.equipments" :key="eq.id" :value="eq.id">
                {{ eq.equipmentNo }} - {{ eq.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">点检类型</label>
            <select
              v-model="addForm.type"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="">请选择类型</option>
              <option value="daily">日常点检</option>
              <option value="weekly">周度维护</option>
              <option value="monthly">月度保养</option>
              <option value="repair">维修</option>
              <option value="cleaning">清洁保养</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">标题</label>
          <input
            v-model="addForm.title"
            type="text"
            placeholder="请输入点检标题"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">点检内容</label>
          <textarea
            v-model="addForm.content"
            rows="3"
            placeholder="请输入点检内容"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">点检结果</label>
            <select
              v-model="addForm.result"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="">请选择结果</option>
              <option value="pass">合格</option>
              <option value="fail">不合格</option>
              <option value="pending">待处理</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">更换配件</label>
            <input
              v-model="addForm.partsReplaced"
              type="text"
              placeholder="选填"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">操作员</label>
            <input
              v-model="addForm.operator"
              type="text"
              placeholder="请输入操作员"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">日期</label>
            <input
              v-model="addForm.date"
              type="date"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">下次点检日期</label>
            <input
              v-model="addForm.nextDate"
              type="date"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
            <input
              v-model="addForm.remark"
              type="text"
              placeholder="选填"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showAddModal = false"
            class="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="submitAdd"
            class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm font-medium"
          >
            确认添加
          </button>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model:visible="showDeleteConfirm" title="确认删除" width="400px">
      <p class="text-sm text-slate-600">确定要删除该点检记录吗？此操作不可撤销。</p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="executeDelete"
            class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors font-medium"
          >
            确认删除
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
