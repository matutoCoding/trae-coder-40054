<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  Search,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  ClipboardCheck,
  Droplets,
  Lock,
  Ruler,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { VolumeCheck } from '@/types'
import BaseModal from '@/components/Modal/BaseModal.vue'
import { useToast } from '@/composables/useToast'

const store = useAppStore()
const toast = useToast()

const searchKeyword = ref('')
const conclusionFilter = ref('')
const dateRange = ref({ start: '', end: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRows = ref<string[]>([])

const today = '2026-06-17'
const standardVolume = 500
const standardVolumeDeviation = 5

const showModal = ref(false)
const editingId = ref<string | null>(null)

const defaultForm = () => ({
  productSpec: '',
  sampleCount: 0,
  qualifiedCount: 0,
  avgVolume: 0,
  minVolume: 0,
  maxVolume: 0,
  bottomThickness: 0,
  sealResult: 'pending' as 'pass' | 'fail' | 'pending',
  conclusion: 'pending' as 'qualified' | 'unqualified' | 'pending',
  inspector: '',
  remark: ''
})

const form = reactive(defaultForm())

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingId.value = null
}

const modalTitle = computed(() => editingId.value ? '编辑容量校验' : '新增容量校验')

const filteredChecks = computed(() => {
  let result = store.volumeChecks

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.id.toLowerCase().includes(keyword) ||
      item.bottleInspectionId.toLowerCase().includes(keyword) ||
      item.productSpec.toLowerCase().includes(keyword)
    )
  }

  if (conclusionFilter.value) {
    result = result.filter(item => item.conclusion === conclusionFilter.value)
  }

  if (dateRange.value.start) {
    result = result.filter(item => item.checkDate >= dateRange.value.start)
  }

  if (dateRange.value.end) {
    result = result.filter(item => item.checkDate <= dateRange.value.end)
  }

  return result
})

const paginatedChecks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredChecks.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredChecks.value.length / pageSize.value))
})

const todayChecks = computed(() => {
  return store.volumeChecks.filter(item => item.checkDate === today).length
})

const volumeQualifiedRate = computed(() => {
  const completed = store.volumeChecks.filter(item => item.conclusion !== 'pending')
  if (completed.length === 0) return '0.0'
  const qualified = completed.filter(item => item.conclusion === 'qualified')
  return ((qualified.length / completed.length) * 100).toFixed(1)
})

const sealPassRate = computed(() => {
  const tested = store.volumeChecks.filter(item => item.sealResult !== 'pending')
  if (tested.length === 0) return '0.0'
  const passed = tested.filter(item => item.sealResult === 'pass')
  return ((passed.length / tested.length) * 100).toFixed(1)
})

const avgBottomThickness = computed(() => {
  if (store.volumeChecks.length === 0) return '0.00'
  const total = store.volumeChecks.reduce((sum, item) => sum + item.bottomThickness, 0)
  return (total / store.volumeChecks.length).toFixed(2)
})

const statCards = computed(() => [
  {
    title: '今日校验批次',
    value: todayChecks.value,
    unit: '批次',
    icon: ClipboardCheck,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    title: '容量合格率',
    value: volumeQualifiedRate.value,
    unit: '%',
    icon: Droplets,
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    title: '密封合格率',
    value: sealPassRate.value,
    unit: '%',
    icon: Lock,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600'
  },
  {
    title: '平均瓶底厚度',
    value: avgBottomThickness.value,
    unit: 'mm',
    icon: Ruler,
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
      return '待校验'
    default:
      return ''
  }
}

const getSealClass = (result: string) => {
  switch (result) {
    case 'pass':
      return 'bg-emerald-100 text-emerald-700'
    case 'fail':
      return 'bg-red-100 text-red-700'
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getSealText = (result: string) => {
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

const getQualifiedRate = (item: VolumeCheck) => {
  if (item.sampleCount === 0) return '0.0%'
  return (item.qualifiedCount / item.sampleCount * 100).toFixed(1) + '%'
}

const getVolumeDeviation = (avgVolume: number) => {
  const deviation = avgVolume - standardVolume
  return deviation >= 0 ? `+${deviation.toFixed(1)}` : deviation.toFixed(1)
}

const getVolumeDeviationColor = (avgVolume: number) => {
  const deviation = Math.abs(avgVolume - standardVolume)
  return deviation <= standardVolumeDeviation ? 'text-emerald-600' : 'text-red-600'
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

const handleAdd = () => {
  resetForm()
  showModal.value = true
}

const handleView = (item: VolumeCheck) => {
  resetForm()
  editingId.value = item.id
  Object.assign(form, {
    productSpec: item.productSpec,
    sampleCount: item.sampleCount,
    qualifiedCount: item.qualifiedCount,
    avgVolume: item.avgVolume,
    minVolume: item.minVolume,
    maxVolume: item.maxVolume,
    bottomThickness: item.bottomThickness,
    sealResult: item.sealResult,
    conclusion: item.conclusion,
    inspector: item.inspector,
    remark: item.remark
  })
  showModal.value = true
}

const handleEdit = (item: VolumeCheck) => {
  editingId.value = item.id
  Object.assign(form, {
    productSpec: item.productSpec,
    sampleCount: item.sampleCount,
    qualifiedCount: item.qualifiedCount,
    avgVolume: item.avgVolume,
    minVolume: item.minVolume,
    maxVolume: item.maxVolume,
    bottomThickness: item.bottomThickness,
    sealResult: item.sealResult,
    conclusion: item.conclusion,
    inspector: item.inspector,
    remark: item.remark
  })
  showModal.value = true
}

const handleDelete = (item: VolumeCheck) => {
  if (confirm(`确定要删除校验单 ${item.id} 吗？`)) {
    store.deleteVolumeCheck(item.id)
    toast.success('校验记录已删除')
  }
}

const handleSave = () => {
  if (!form.productSpec || !form.inspector) {
    toast.warning('请填写必填字段')
    return
  }

  if (editingId.value) {
    store.updateVolumeCheck(editingId.value, { ...form })
    toast.success('校验记录已更新')
  } else {
    store.addVolumeCheck({
      ...form,
      bottleInspectionId: '',
      checkDate: new Date().toISOString().split('T')[0]
    })
    toast.success('校验记录已添加')
  }

  showModal.value = false
  resetForm()
}

const handleModalClose = () => {
  showModal.value = false
  resetForm()
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
                placeholder="搜索校验单号、瓶检单号、产品规格..."
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
              <option value="pending">待校验</option>
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
            新增校验
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">校验单号</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">产品规格</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">抽样数</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">合格数</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">合格率</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">平均容量(ml)</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">容量偏差</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">瓶底厚度(mm)</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">密封性</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">结论</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">校验日期</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="item in paginatedChecks" :key="item.id">
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
                  <span class="text-sm text-slate-600">{{ item.productSpec }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600">{{ item.sampleCount }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600">{{ item.qualifiedCount }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm font-semibold text-cyan-600">{{ getQualifiedRate(item) }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm font-medium text-slate-700">{{ item.avgVolume }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span :class="['text-sm font-semibold', getVolumeDeviationColor(item.avgVolume)]">
                    {{ getVolumeDeviation(item.avgVolume) }} ml
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600">{{ item.bottomThickness }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full',
                      getSealClass(item.sealResult)
                    ]"
                  >
                    {{ getSealText(item.sealResult) }}
                  </span>
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
                  <span class="text-sm text-slate-600">{{ item.checkDate }}</span>
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
                <td colspan="13" class="px-4 py-4">
                  <div class="pl-8">
                    <div class="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Droplets class="w-4 h-4 text-cyan-500" />
                        容量抽检详情
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">最小容量</p>
                          <p class="text-lg font-bold text-slate-800">{{ item.minVolume }} <span class="text-sm font-normal text-slate-500">ml</span></p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">最大容量</p>
                          <p class="text-lg font-bold text-slate-800">{{ item.maxVolume }} <span class="text-sm font-normal text-slate-500">ml</span></p>
                        </div>
                        <div class="bg-cyan-50 rounded-lg p-3">
                          <p class="text-xs text-cyan-600 mb-1">平均容量</p>
                          <p class="text-lg font-bold text-cyan-700">{{ item.avgVolume }} <span class="text-sm font-normal text-cyan-500">ml</span></p>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="bg-purple-50 rounded-lg p-3">
                          <p class="text-xs text-purple-600 mb-1">瓶底厚度</p>
                          <p class="text-lg font-bold text-purple-700">{{ item.bottomThickness }} <span class="text-sm font-normal text-purple-500">mm</span></p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">合格率</p>
                          <p class="text-lg font-bold text-emerald-600">{{ getQualifiedRate(item) }}</p>
                        </div>
                      </div>
                      <div v-if="item.remark" class="pt-3 border-t border-slate-100">
                        <p class="text-xs text-slate-500 mb-1">备注</p>
                        <p class="text-sm text-slate-600">{{ item.remark }}</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="filteredChecks.length === 0" class="py-16 text-center">
        <ClipboardCheck class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-sm text-slate-400">暂无校验数据</p>
      </div>

      <div class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-slate-500">
          共 <span class="font-medium text-slate-700">{{ filteredChecks.length }}</span> 条记录
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
      :title="modalTitle"
      width="680px"
      @close="handleModalClose"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">产品规格 <span class="text-red-500">*</span></label>
          <input
            v-model="form.productSpec"
            type="text"
            placeholder="请输入产品规格"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">抽样数</label>
            <input
              v-model.number="form.sampleCount"
              type="number"
              min="0"
              placeholder="请输入抽样数"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">合格数</label>
            <input
              v-model.number="form.qualifiedCount"
              type="number"
              min="0"
              placeholder="请输入合格数"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">平均容量(ml)</label>
            <input
              v-model.number="form.avgVolume"
              type="number"
              step="0.1"
              min="0"
              placeholder="平均容量"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">最小容量(ml)</label>
            <input
              v-model.number="form.minVolume"
              type="number"
              step="0.1"
              min="0"
              placeholder="最小容量"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">最大容量(ml)</label>
            <input
              v-model.number="form.maxVolume"
              type="number"
              step="0.1"
              min="0"
              placeholder="最大容量"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">瓶底厚度(mm)</label>
            <input
              v-model.number="form.bottomThickness"
              type="number"
              step="0.01"
              min="0"
              placeholder="请输入瓶底厚度"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">密封性</label>
            <select
              v-model="form.sealResult"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
            >
              <option value="pass">通过</option>
              <option value="fail">不通过</option>
              <option value="pending">待检</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">结论</label>
            <select
              v-model="form.conclusion"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
            >
              <option value="qualified">合格</option>
              <option value="unqualified">不合格</option>
              <option value="pending">待校验</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">检验员 <span class="text-red-500">*</span></label>
            <input
              v-model="form.inspector"
              type="text"
              placeholder="请输入检验员"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
          <textarea
            v-model="form.remark"
            rows="3"
            placeholder="请输入备注信息"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors resize-none"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="handleModalClose"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSave"
            class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm"
          >
            {{ editingId ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
