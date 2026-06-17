<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import {
  Search,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  ClipboardList,
  CheckCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/Modal/BaseModal.vue'
import type { PreformInspection } from '@/types'
import TraceabilityView from '@/components/Traceability/TraceabilityView.vue'

const store = useAppStore()
const toast = useToast()

const searchKeyword = ref('')
const conclusionFilter = ref('')
const dateRange = ref({ start: '', end: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRows = ref<string[]>([])

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref('')
const editingId = ref('')
const isEditing = computed(() => !!editingId.value)

const today = new Date().toISOString().split('T')[0]

const defaultForm = () => ({
  purchaseId: '',
  purchaseSpec: '',
  supplierName: '',
  sampleCount: 0,
  qualifiedCount: 0,
  avgWeight: 0,
  minWeight: 0,
  maxWeight: 0,
  appearanceResult: 'pending' as const,
  transparencyResult: 'pending' as const,
  conclusion: 'pending' as const,
  inspector: '',
  inspectDate: today,
  remark: ''
})

const form = reactive(defaultForm())

watch(() => form.purchaseId, (id) => {
  const order = store.purchaseOrders.find(o => o.id === id)
  if (order) {
    form.purchaseSpec = order.spec
    form.supplierName = order.supplierName
    form.avgWeight = order.weight
    form.minWeight = Math.round(order.weight * 0.95 * 100) / 100
    form.maxWeight = Math.round(order.weight * 1.05 * 100) / 100
  }
})

const inspectingOrders = computed(() =>
  store.purchaseOrders.filter(o => o.status === 'inspecting')
)

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingId.value = ''
}

const handleAdd = () => {
  resetForm()
  showModal.value = true
}

const handleView = (item: PreformInspection) => {
  expandedRows.value = expandedRows.value.includes(item.id)
    ? expandedRows.value.filter(id => id !== item.id)
    : [...expandedRows.value, item.id]
}

const handleEdit = (item: PreformInspection) => {
  editingId.value = item.id
  Object.assign(form, {
    purchaseId: item.purchaseId,
    purchaseSpec: item.purchaseSpec,
    supplierName: item.supplierName,
    sampleCount: item.sampleCount,
    qualifiedCount: item.qualifiedCount,
    avgWeight: item.avgWeight,
    minWeight: item.minWeight,
    maxWeight: item.maxWeight,
    appearanceResult: item.appearanceResult,
    transparencyResult: item.transparencyResult,
    conclusion: item.conclusion,
    inspector: item.inspector,
    inspectDate: item.inspectDate,
    remark: item.remark
  })
  showModal.value = true
}

const handleDelete = (item: PreformInspection) => {
  deleteTargetId.value = item.id
  showDeleteConfirm.value = true
}

const confirmDelete = () => {
  store.deletePreformInspection(deleteTargetId.value)
  toast.success('检验记录已删除')
  showDeleteConfirm.value = false
  deleteTargetId.value = ''
}

const handleSave = () => {
  if (!form.purchaseId) {
    toast.warning('请选择采购单')
    return
  }
  if (form.sampleCount <= 0) {
    toast.warning('抽样数必须大于0')
    return
  }
  if (form.qualifiedCount > form.sampleCount) {
    toast.warning('合格数不能大于抽样数')
    return
  }
  if (!form.inspector) {
    toast.warning('请填写检验员')
    return
  }

  if (isEditing.value) {
    store.updatePreformInspection(editingId.value, { ...form })
    toast.success('检验记录已更新')
  } else {
    store.addPreformInspection({ ...form })
    toast.success('检验记录已创建')
  }
  showModal.value = false
  resetForm()
}

const getQualifiedRate = (item: PreformInspection) => {
  if (item.sampleCount === 0) return '0.0%'
  return (item.qualifiedCount / item.sampleCount * 100).toFixed(1) + '%'
}

const filteredInspections = computed(() => {
  let result = store.preformInspections

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.id.toLowerCase().includes(keyword) ||
      item.purchaseId.toLowerCase().includes(keyword) ||
      item.purchaseSpec.toLowerCase().includes(keyword) ||
      item.supplierName.toLowerCase().includes(keyword)
    )
  }

  if (conclusionFilter.value) {
    result = result.filter(item => item.conclusion === conclusionFilter.value)
  }

  if (dateRange.value.start) {
    result = result.filter(item => item.inspectDate >= dateRange.value.start)
  }

  if (dateRange.value.end) {
    result = result.filter(item => item.inspectDate <= dateRange.value.end)
  }

  return result
})

const paginatedInspections = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredInspections.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredInspections.value.length / pageSize.value))
})

const todayInspections = computed(() => {
  return store.preformInspections.filter(item => item.inspectDate === today).length
})

const qualifiedRate = computed(() => {
  const completed = store.preformInspections.filter(item => item.conclusion !== 'pending')
  if (completed.length === 0) return '0.0'
  const qualified = completed.filter(item => item.conclusion === 'qualified')
  return ((qualified.length / completed.length) * 100).toFixed(1)
})

const pendingCount = computed(() => {
  return store.preformInspections.filter(item => item.conclusion === 'pending').length
})

const totalSamples = computed(() => {
  return store.preformInspections.reduce((sum, item) => sum + item.sampleCount, 0)
})

const statCards = computed(() => [
  {
    title: '今日检验批次',
    value: todayInspections.value,
    unit: '批次',
    icon: ClipboardList,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    title: '合格率',
    value: qualifiedRate.value,
    unit: '%',
    icon: CheckCircle,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    title: '待检验批次',
    value: pendingCount.value,
    unit: '批次',
    icon: Clock,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600'
  },
  {
    title: '抽样总数',
    value: totalSamples.value.toLocaleString(),
    unit: '只',
    icon: Layers,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600'
  }
])

const getConclusionClass = (conclusion: string) => {
  switch (conclusion) {
    case 'qualified':
      return 'bg-emerald-100 text-emerald-700'
    case 'unqualified':
      return 'bg-red-100 text-red-700'
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getConclusionText = (conclusion: string) => {
  switch (conclusion) {
    case 'qualified':
      return '合格'
    case 'unqualified':
      return '不合格'
    case 'pending':
      return '待检验'
    default:
      return ''
  }
}

const getResultDotClass = (result: string) => {
  switch (result) {
    case 'pass':
      return 'bg-emerald-500'
    case 'fail':
      return 'bg-red-500'
    case 'pending':
      return 'bg-amber-500'
    default:
      return 'bg-gray-300'
  }
}

const getResultText = (result: string) => {
  switch (result) {
    case 'pass':
      return '通过'
    case 'fail':
      return '不通过'
    case 'pending':
      return '待检'
    default:
      return ''
  }
}

const toggleRowExpand = (id: string) => {
  const index = expandedRows.value.indexOf(id)
  if (index > -1) {
    expandedRows.value.splice(index, 1)
  } else {
    expandedRows.value.push(id)
  }
}

const isRowExpanded = (id: string) => {
  return expandedRows.value.includes(id)
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const getPageNumbers = () => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else if (current <= 3) {
    for (let i = 1; i <= 5; i++) {
      pages.push(i)
    }
    pages.push(-1)
    pages.push(total)
  } else if (current >= total - 2) {
    pages.push(1)
    pages.push(-1)
    for (let i = total - 4; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    pages.push(-1)
    for (let i = current - 1; i <= current + 1; i++) {
      pages.push(i)
    }
    pages.push(-1)
    pages.push(total)
  }

  return pages
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
            <component :is="card.icon" :class="['w-6 h-6', card.iconColor]" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-6 border-b border-slate-100">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            <div class="relative flex-1 w-full sm:max-w-xs">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索检验单号、采购单号、规格、供应商..."
                class="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
              />
            </div>
            <select
              v-model="conclusionFilter"
              class="px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
            >
              <option value="">全部结论</option>
              <option value="qualified">合格</option>
              <option value="unqualified">不合格</option>
              <option value="pending">待检验</option>
            </select>
            <div class="flex items-center gap-2">
              <div class="relative">
                <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="dateRange.start"
                  type="date"
                  class="pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
                />
              </div>
              <span class="text-slate-400 text-sm">至</span>
              <div class="relative">
                <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="dateRange.end"
                  type="date"
                  class="pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
          <button
            @click="handleAdd"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm hover:shadow-md"
          >
            <Plus class="w-4 h-4" />
            新增检验
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">检验单号</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">采购单号</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">规格</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">供应商</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">抽样数</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">合格数</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">合格率</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">平均重量(g)</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">外观</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">透明度</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">结论</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">检验日期</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="item in paginatedInspections" :key="item.id">
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-4">
                  <button
                    @click="toggleRowExpand(item.id)"
                    class="p-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    <ChevronDown
                      v-if="!isRowExpanded(item.id)"
                      class="w-4 h-4 text-slate-400"
                    />
                    <ChevronUp
                      v-else
                      class="w-4 h-4 text-slate-400"
                    />
                  </button>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm font-medium text-slate-800">{{ item.id }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ item.purchaseId }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ item.purchaseSpec }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ item.supplierName }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600">{{ item.sampleCount }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600">{{ item.qualifiedCount }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                      item.sampleCount > 0 && (item.qualifiedCount / item.sampleCount) >= 0.9
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.sampleCount > 0 && (item.qualifiedCount / item.sampleCount) >= 0.7
                          ? 'bg-amber-100 text-amber-700'
                          : item.sampleCount > 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                    ]"
                  >
                    {{ getQualifiedRate(item) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm font-medium text-slate-700">{{ item.avgWeight }}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <span :class="['w-2.5 h-2.5 rounded-full', getResultDotClass(item.appearanceResult)]"></span>
                    <span class="text-sm text-slate-600">{{ getResultText(item.appearanceResult) }}</span>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <span :class="['w-2.5 h-2.5 rounded-full', getResultDotClass(item.transparencyResult)]"></span>
                    <span class="text-sm text-slate-600">{{ getResultText(item.transparencyResult) }}</span>
                  </div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full',
                      getConclusionClass(item.conclusion)
                    ]"
                  >
                    {{ getConclusionText(item.conclusion) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600">{{ item.inspectDate }}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      @click="handleView(item)"
                      class="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleEdit(item)"
                      class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleDelete(item)"
                      class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="isRowExpanded(item.id)" class="bg-slate-50">
                <td colspan="14" class="px-4 py-4">
                  <div class="pl-8">
                    <div class="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Layers class="w-4 h-4 text-cyan-500" />
                        重量抽检详情
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">最小重量</p>
                          <p class="text-lg font-bold text-slate-800">{{ item.minWeight }} <span class="text-sm font-normal text-slate-500">g</span></p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">最大重量</p>
                          <p class="text-lg font-bold text-slate-800">{{ item.maxWeight }} <span class="text-sm font-normal text-slate-500">g</span></p>
                        </div>
                        <div class="bg-cyan-50 rounded-lg p-3">
                          <p class="text-xs text-cyan-600 mb-1">平均重量</p>
                          <p class="text-lg font-bold text-cyan-700">{{ item.avgWeight }} <span class="text-sm font-normal text-cyan-500">g</span></p>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">检验员</p>
                          <p class="text-sm font-medium text-slate-800">{{ item.inspector || '-' }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">合格率</p>
                          <p class="text-sm font-bold text-cyan-700">{{ getQualifiedRate(item) }}</p>
                        </div>
                      </div>
                      <div v-if="item.remark" class="mt-3 pt-3 border-t border-slate-100">
                        <p class="text-xs text-slate-500 mb-1">备注</p>
                        <p class="text-sm text-slate-600">{{ item.remark }}</p>
                      </div>
                      <div class="mt-4 pt-4 border-t border-slate-100">
                        <TraceabilityView type="preformInspection" :id="item.id" />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="filteredInspections.length === 0" class="py-16 text-center">
        <ClipboardList class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-sm text-slate-400">暂无检验数据</p>
      </div>

      <div class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-slate-500">
          共 <span class="font-medium text-slate-700">{{ filteredInspections.length }}</span> 条记录
        </div>
        <div class="flex items-center gap-1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <template v-for="pageNum in getPageNumbers()" :key="pageNum">
            <button
              v-if="pageNum !== -1"
              @click="goToPage(pageNum)"
              :class="[
                'min-w-9 h-9 px-3 text-sm font-medium rounded-lg transition-colors',
                currentPage === pageNum
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
              ]"
            >
              {{ pageNum }}
            </button>
            <span v-else class="px-2 text-slate-400">
              <MoreHorizontal class="w-4 h-4" />
            </span>
          </template>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <BaseModal
      v-model:visible="showModal"
      :title="isEditing ? '编辑检验记录' : '新增检验记录'"
      width="680px"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">采购单 <span class="text-red-500">*</span></label>
            <select
              v-model="form.purchaseId"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
              :class="{ 'bg-slate-50': isEditing }"
              :disabled="isEditing"
            >
              <option value="">请选择采购单</option>
              <option
                v-for="order in inspectingOrders"
                :key="order.id"
                :value="order.id"
              >
                {{ order.id }} - {{ order.spec }} ({{ order.supplierName }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">规格</label>
            <input
              v-model="form.purchaseSpec"
              type="text"
              readonly
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">供应商</label>
            <input
              v-model="form.supplierName"
              type="text"
              readonly
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">抽样数 <span class="text-red-500">*</span></label>
            <input
              v-model.number="form.sampleCount"
              type="number"
              min="0"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">合格数 <span class="text-red-500">*</span></label>
            <input
              v-model.number="form.qualifiedCount"
              type="number"
              min="0"
              :max="form.sampleCount"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">平均重量(g)</label>
            <input
              v-model.number="form.avgWeight"
              type="number"
              step="0.01"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">最小重量(g)</label>
            <input
              v-model.number="form.minWeight"
              type="number"
              step="0.01"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">最大重量(g)</label>
            <input
              v-model.number="form.maxWeight"
              type="number"
              step="0.01"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">外观结果</label>
            <select
              v-model="form.appearanceResult"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
            >
              <option value="pass">通过</option>
              <option value="fail">不通过</option>
              <option value="pending">待检</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">透明度结果</label>
            <select
              v-model="form.transparencyResult"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
            >
              <option value="pass">通过</option>
              <option value="fail">不通过</option>
              <option value="pending">待检</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">结论</label>
            <select
              v-model="form.conclusion"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
            >
              <option value="qualified">合格</option>
              <option value="unqualified">不合格</option>
              <option value="pending">待检验</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">检验员 <span class="text-red-500">*</span></label>
            <input
              v-model="form.inspector"
              type="text"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
              placeholder="请输入检验员姓名"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">检验日期</label>
            <input
              v-model="form.inspectDate"
              type="date"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              v-model="form.remark"
              rows="3"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors resize-none"
              placeholder="请输入备注信息"
            ></textarea>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showModal = false"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSave"
            class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm"
          >
            {{ isEditing ? '更新' : '保存' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      v-model:visible="showDeleteConfirm"
      title="确认删除"
      width="420px"
      :close-on-click-overlay="false"
    >
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-800">确定要删除该检验记录吗？</p>
          <p class="text-sm text-slate-500 mt-1">删除后数据将无法恢复，请确认操作。</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="confirmDelete"
            class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            确认删除
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
