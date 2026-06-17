<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Package,
  ListTodo,
  Boxes,
  Layers,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import BaseModal from '@/components/Modal/BaseModal.vue'
import { useToast } from '@/composables/useToast'
import type { InventoryItem, WarehouseRecord } from '@/types'
import TraceabilityView from '@/components/Traceability/TraceabilityView.vue'

const store = useAppStore()
const toast = useToast()

const activeTab = ref<'inventory' | 'records' | 'flow'>('inventory')

const inventorySearch = ref('')
const inventoryStatusFilter = ref('')

const recordSearch = ref('')
const recordTypeFilter = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

const specFilter = ref('')
const flowDateStart = ref('')
const flowDateEnd = ref('')

const currentPage = ref(1)
const pageSize = ref(10)
const expandedRows = ref<string[]>([])

const showStockInModal = ref(false)
const showStockOutModal = ref(false)

const stockInForm = ref({
  specSelect: '',
  specNew: '',
  isNewSpec: false,
  quantity: 0,
  location: '',
  batchNo: '',
  operator: '',
  remark: ''
})

const stockOutForm = ref({
  spec: '',
  quantity: 0,
  operator: '',
  remark: ''
})

const getInventoryStatusText = (status: InventoryItem['status']) => {
  const statusMap: Record<InventoryItem['status'], string> = {
    normal: '正常',
    low: '库存低',
    insufficient: '不足'
  }
  return statusMap[status] || status
}

const getInventoryStatusClass = (status: InventoryItem['status']) => {
  const classMap: Record<InventoryItem['status'], string> = {
    normal: 'bg-emerald-100 text-emerald-700',
    low: 'bg-amber-100 text-amber-700',
    insufficient: 'bg-red-100 text-red-700'
  }
  return classMap[status] || 'bg-gray-100 text-gray-700'
}

const getRecordTypeText = (type: WarehouseRecord['type']) => {
  return type === 'in' ? '入库' : '出库'
}

const getRecordTypeClass = (type: WarehouseRecord['type']) => {
  return type === 'in'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-blue-100 text-blue-700'
}

const totalQuantity = computed(() => {
  return store.inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
})

const categoryCount = computed(() => {
  return store.inventoryItems.length
})

const warningCount = computed(() => {
  return store.inventoryItems.filter(item => item.status !== 'normal').length
})

const totalValue = computed(() => {
  return store.inventoryItems.reduce((sum, item) => sum + item.quantity * 1.5, 0)
})

const filteredInventory = computed(() => {
  let result = [...store.inventoryItems]

  if (inventorySearch.value) {
    const keyword = inventorySearch.value.toLowerCase()
    result = result.filter(
      item =>
        item.id.toLowerCase().includes(keyword) ||
        item.spec.toLowerCase().includes(keyword) ||
        item.location.toLowerCase().includes(keyword)
    )
  }

  if (inventoryStatusFilter.value) {
    result = result.filter(item => item.status === inventoryStatusFilter.value)
  }

  return result
})

const filteredRecords = computed(() => {
  let result = [...store.warehouseRecords]

  if (recordSearch.value) {
    const keyword = recordSearch.value.toLowerCase()
    result = result.filter(
      record =>
        record.id.toLowerCase().includes(keyword) ||
        record.spec.toLowerCase().includes(keyword) ||
        record.batchNo.toLowerCase().includes(keyword) ||
        record.operator.toLowerCase().includes(keyword)
    )
  }

  if (recordTypeFilter.value) {
    result = result.filter(record => record.type === recordTypeFilter.value)
  }

  if (dateRangeStart.value) {
    result = result.filter(record => record.date >= dateRangeStart.value)
  }

  if (dateRangeEnd.value) {
    result = result.filter(record => record.date <= dateRangeEnd.value)
  }

  return result
})

const paginatedInventory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredInventory.value.slice(start, end)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const totalPages = computed(() => {
  const total = activeTab.value === 'inventory'
    ? filteredInventory.value.length
    : activeTab.value === 'records'
    ? filteredRecords.value.length
    : inventoryFlowData.value.length
  return Math.ceil(total / pageSize.value) || 1
})

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN')
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const openStockInModal = (item?: InventoryItem) => {
  stockInForm.value = {
    specSelect: item ? item.spec : '',
    specNew: '',
    isNewSpec: false,
    quantity: 0,
    location: item ? item.location : '',
    batchNo: '',
    operator: '',
    remark: ''
  }
  showStockInModal.value = true
}

const openStockOutModal = (item: InventoryItem) => {
  stockOutForm.value = {
    spec: item.spec,
    quantity: 0,
    operator: '',
    remark: ''
  }
  showStockOutModal.value = true
}

const submitStockIn = () => {
  const form = stockInForm.value
  const spec = form.isNewSpec ? form.specNew.trim() : form.specSelect
  if (!spec) {
    toast.error('请选择或输入规格')
    return
  }
  if (form.quantity <= 0) {
    toast.error('请填写有效的入库数量')
    return
  }
  if (!form.location.trim()) {
    toast.error('请填写库位')
    return
  }
  if (!form.operator.trim()) {
    toast.error('请填写操作员')
    return
  }

  store.stockIn(spec, form.quantity, form.location, form.batchNo, '', form.operator, form.remark)
  showStockInModal.value = false
  toast.success(`入库成功：${spec} x ${form.quantity}`)
}

const submitStockOut = () => {
  const form = stockOutForm.value
  if (!form.spec) {
    toast.error('请选择规格')
    return
  }
  if (form.quantity <= 0) {
    toast.error('请填写有效的出库数量')
    return
  }
  if (!form.operator.trim()) {
    toast.error('请填写操作员')
    return
  }

  const targetItem = store.inventoryItems.find(i => i.spec === form.spec)
  const result = store.stockOut(form.spec, form.quantity, targetItem?.location || '', '', '', form.operator, form.remark)

  if (!result.success) {
    const currentQty = targetItem?.quantity || 0
    toast.error(`库存不足，无法出库！当前库存仅${currentQty}只`)
    return
  }

  showStockOutModal.value = false
  toast.success(`出库成功：${form.spec} x ${form.quantity}`)
}

const resetInventoryFilters = () => {
  inventorySearch.value = ''
  inventoryStatusFilter.value = ''
  currentPage.value = 1
}

const resetRecordFilters = () => {
  recordSearch.value = ''
  recordTypeFilter.value = ''
  dateRangeStart.value = ''
  dateRangeEnd.value = ''
  currentPage.value = 1
}

interface InventoryFlowItem {
  date: string
  spec: string
  opening: number
  inQuantity: number
  outQuantity: number
  closing: number
  remark: string
}

const inventoryFlowData = computed<InventoryFlowItem[]>(() => {
  const allRecords = [...store.warehouseRecords]
  
  let filtered = allRecords
  if (flowDateStart.value) {
    filtered = filtered.filter(r => r.date >= flowDateStart.value)
  }
  if (flowDateEnd.value) {
    filtered = filtered.filter(r => r.date <= flowDateEnd.value)
  }
  if (specFilter.value) {
    filtered = filtered.filter(r => r.spec === specFilter.value)
  }
  
  const dateSpecMap = new Map<string, { inQty: number; outQty: number; remarks: string[] }>()
  const allDatesSet = new Set<string>()
  const allSpecsSet = new Set<string>()
  
  filtered.forEach(record => {
    allDatesSet.add(record.date)
    allSpecsSet.add(record.spec)
    const key = `${record.date}|${record.spec}`
    if (!dateSpecMap.has(key)) {
      dateSpecMap.set(key, { inQty: 0, outQty: 0, remarks: [] })
    }
    const data = dateSpecMap.get(key)!
    if (record.type === 'in') {
      data.inQty += record.quantity
    } else {
      data.outQty += record.quantity
    }
    if (record.remark) {
      data.remarks.push(record.remark)
    }
  })
  
  const allDates = Array.from(allDatesSet).sort()
  const allSpecs = specFilter.value ? [specFilter.value] : Array.from(allSpecsSet)
  
  const result: InventoryFlowItem[] = []
  
  allSpecs.forEach(spec => {
    const specOpeningMap = new Map<string, number>()
    let runningBalance = 0
    
    const specAllRecords = allRecords.filter(r => r.spec === spec)
    if (allDates.length > 0) {
      const firstDate = allDates[0]
      const beforeRecords = specAllRecords.filter(r => r.date < firstDate)
      beforeRecords.forEach(r => {
        if (r.type === 'in') {
          runningBalance += r.quantity
        } else {
          runningBalance -= r.quantity
        }
      })
    }
    
    allDates.forEach(date => {
      const key = `${date}|${spec}`
      const data = dateSpecMap.get(key) || { inQty: 0, outQty: 0, remarks: [] }
      
      const opening = runningBalance
      const closing = opening + data.inQty - data.outQty
      
      result.push({
        date,
        spec,
        opening,
        inQuantity: data.inQty,
        outQuantity: data.outQty,
        closing,
        remark: data.remarks.join('; ')
      })
      
      runningBalance = closing
    })
  })
  
  result.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    return a.spec.localeCompare(b.spec)
  })
  
  return result
})

const paginatedFlow = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return inventoryFlowData.value.slice(start, end)
})

const flowSummary = computed(() => {
  const data = inventoryFlowData.value
  const totalIn = data.reduce((sum, item) => sum + item.inQuantity, 0)
  const totalOut = data.reduce((sum, item) => sum + item.outQuantity, 0)
  const finalClosing = data.length > 0 ? data[data.length - 1].closing : 0
  return { totalIn, totalOut, finalClosing }
})

const resetFlowFilters = () => {
  specFilter.value = ''
  flowDateStart.value = ''
  flowDateEnd.value = ''
  currentPage.value = 1
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
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

const handleTabChange = (tab: 'inventory' | 'records' | 'flow') => {
  activeTab.value = tab
  currentPage.value = 1
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800">装箱入库管理</h2>
          <p class="text-sm text-slate-500 mt-1">管理库存信息和出入库记录</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="openStockOutModal({ spec: '' } as any)"
            class="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            <ArrowUpFromLine class="w-4 h-4" />
            出库
          </button>
          <button
            @click="openStockInModal()"
            class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm hover:shadow-md font-medium text-sm"
          >
            <ArrowDownToLine class="w-4 h-4" />
            入库
          </button>
        </div>
      </div>

      <div class="flex gap-1 border-b border-slate-200 mb-6">
        <button
          @click="handleTabChange('inventory')"
          :class="[
            'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'inventory'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          ]"
        >
          <Boxes class="w-4 h-4" />
          库存查询
        </button>
        <button
          @click="handleTabChange('records')"
          :class="[
            'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'records'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          ]"
        >
          <ListTodo class="w-4 h-4" />
          出入库记录
        </button>
        <button
          @click="handleTabChange('flow')"
          :class="[
            'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'flow'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          ]"
        >
          <TrendingUp class="w-4 h-4" />
          库存流水
        </button>
      </div>

      <div v-if="activeTab === 'inventory'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">总库存数量</p>
                <p class="text-2xl font-bold text-slate-800 mt-2">{{ formatNumber(totalQuantity) }}</p>
                <p class="text-xs text-slate-400 mt-1">单位：只</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-cyan-500 bg-opacity-20 flex items-center justify-center">
                <Boxes class="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">库存品类数</p>
                <p class="text-2xl font-bold text-slate-800 mt-2">{{ categoryCount }}</p>
                <p class="text-xs text-slate-400 mt-1">种物料</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-emerald-500 bg-opacity-20 flex items-center justify-center">
                <Layers class="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">库存预警数</p>
                <p class="text-2xl font-bold text-slate-800 mt-2">{{ warningCount }}</p>
                <p class="text-xs text-slate-400 mt-1">需关注</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-amber-500 bg-opacity-20 flex items-center justify-center">
                <AlertTriangle class="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">库存总值</p>
                <p class="text-2xl font-bold text-slate-800 mt-2">¥{{ formatAmount(totalValue) }}</p>
                <p class="text-xs text-slate-400 mt-1">估算价值</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-violet-500 bg-opacity-20 flex items-center justify-center">
                <DollarSign class="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <div class="relative flex-1 min-w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="inventorySearch"
              type="text"
              placeholder="搜索物料编号、规格、库位..."
              class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-400" />
            <select
              v-model="inventoryStatusFilter"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="">全部状态</option>
              <option value="normal">正常</option>
              <option value="low">库存低</option>
              <option value="insufficient">不足</option>
            </select>
          </div>

          <button
            @click="resetInventoryFilters"
            class="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            重置
          </button>
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">物料编号</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">规格型号</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">库存数量</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">单位</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">库位</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">最后更新</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="item in paginatedInventory"
                :key="item.id"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-4">
                  <span class="text-sm font-medium text-slate-800">{{ item.id }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ item.spec }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm font-semibold text-slate-800">{{ formatNumber(item.quantity) }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-500">{{ item.unit }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ item.location }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[getInventoryStatusClass(item.status), 'text-xs px-2.5 py-1 rounded-full font-medium']"
                  >
                    {{ getInventoryStatusText(item.status) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-500">{{ item.lastUpdate }}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      @click="openStockInModal(item)"
                      class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="入库"
                    >
                      <ArrowDownToLine class="w-4 h-4" />
                    </button>
                    <button
                      @click="openStockOutModal(item)"
                      class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="出库"
                    >
                      <ArrowUpFromLine class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="paginatedInventory.length === 0">
                <td colspan="8" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <Package class="w-12 h-12 text-slate-300" />
                    <p class="text-sm text-slate-400">暂无库存数据</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="text-sm text-slate-500">
            共 <span class="font-medium text-slate-700">{{ filteredInventory.length }}</span> 条记录
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'p-2 rounded-lg text-sm transition-colors',
                currentPage === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <template v-for="page in totalPages" :key="page">
              <button
                v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
                @click="goToPage(page)"
                :class="[
                  'min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                {{ page }}
              </button>
              <span
                v-else-if="page === currentPage - 2 || page === currentPage + 2"
                class="px-2 text-slate-400"
              >
                ...
              </span>
            </template>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'p-2 rounded-lg text-sm transition-colors',
                currentPage === totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'records'" class="space-y-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative flex-1 min-w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="recordSearch"
              type="text"
              placeholder="搜索单据号、规格、批次号、操作人..."
              class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-400" />
            <select
              v-model="recordTypeFilter"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="">全部类型</option>
              <option value="in">入库</option>
              <option value="out">出库</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <input
              v-model="dateRangeStart"
              type="date"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <span class="text-slate-400 text-sm">至</span>
            <input
              v-model="dateRangeEnd"
              type="date"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <button
            @click="resetRecordFilters"
            class="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            重置
          </button>
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">单据号</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">类型</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">规格</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">数量</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">单位</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">库位</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">批次号</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">操作人</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">日期</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <template v-for="record in paginatedRecords" :key="record.id">
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-4">
                    <button
                      @click="toggleRowExpand(record.id)"
                      class="p-1 rounded hover:bg-slate-200 transition-colors"
                    >
                      <ChevronDown
                        v-if="!isRowExpanded(record.id)"
                        class="w-4 h-4 text-slate-400"
                      />
                      <ChevronUp
                        v-else
                        class="w-4 h-4 text-slate-400"
                      />
                    </button>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm font-medium text-slate-800">{{ record.id }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[getRecordTypeClass(record.type), 'text-xs px-2.5 py-1 rounded-full font-medium']"
                  >
                    {{ getRecordTypeText(record.type) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ record.spec }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm font-semibold text-slate-800">{{ formatNumber(record.quantity) }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-500">{{ record.unit }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ record.location }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ record.batchNo }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ record.operator }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-500">{{ record.date }}</span>
                </td>
              </tr>
              <tr v-if="isRowExpanded(record.id)" class="bg-slate-50">
                <td colspan="10" class="px-4 py-4">
                  <div class="pl-8">
                    <div class="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <ListTodo class="w-4 h-4 text-cyan-500" />
                        出入库详情
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">单据号</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.id }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">类型</p>
                          <span :class="[getRecordTypeClass(record.type), 'text-xs px-2.5 py-1 rounded-full font-medium']">
                            {{ getRecordTypeText(record.type) }}
                          </span>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">规格</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.spec }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">数量</p>
                          <p class="text-sm font-medium text-slate-800">{{ formatNumber(record.quantity) }} {{ record.unit }}</p>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">库位</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.location || '-' }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">批次号</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.batchNo || '-' }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">操作人</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.operator || '-' }}</p>
                        </div>
                      </div>
                      <div v-if="record.remark" class="mt-3 pt-3 border-t border-slate-100">
                        <p class="text-xs text-slate-500 mb-1">备注</p>
                        <p class="text-sm text-slate-600">{{ record.remark }}</p>
                      </div>
                      <div class="mt-4 pt-4 border-t border-slate-100">
                        <TraceabilityView type="warehouse" :id="record.id" />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              </template>
              <tr v-if="paginatedRecords.length === 0">
                <td colspan="10" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <ListTodo class="w-12 h-12 text-slate-300" />
                    <p class="text-sm text-slate-400">暂无出入库记录</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="text-sm text-slate-500">
            共 <span class="font-medium text-slate-700">{{ filteredRecords.length }}</span> 条记录
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'p-2 rounded-lg text-sm transition-colors',
                currentPage === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <template v-for="page in totalPages" :key="page">
              <button
                v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
                @click="goToPage(page)"
                :class="[
                  'min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                {{ page }}
              </button>
              <span
                v-else-if="page === currentPage - 2 || page === currentPage + 2"
                class="px-2 text-slate-400"
              >
                ...
              </span>
            </template>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'p-2 rounded-lg text-sm transition-colors',
                currentPage === totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'flow'" class="space-y-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-400" />
            <select
              v-model="specFilter"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white min-w-48"
            >
              <option value="">全部规格</option>
              <option v-for="item in store.inventoryItems" :key="item.id" :value="item.spec">
                {{ item.spec }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <input
              v-model="flowDateStart"
              type="date"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <span class="text-slate-400 text-sm">至</span>
            <input
              v-model="flowDateEnd"
              type="date"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <button
            @click="currentPage = 1"
            class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm text-sm font-medium"
          >
            <Search class="w-4 h-4" />
            查询
          </button>

          <button
            @click="resetFlowFilters"
            class="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw class="w-4 h-4" />
            重置
          </button>
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">日期</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">规格</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">期初数量</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">入库数量</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">出库数量</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">结存数量</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">备注</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="(item, index) in paginatedFlow"
                :key="`${item.date}-${item.spec}-${index}`"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ item.date }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm font-medium text-slate-800">{{ item.spec }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm font-semibold text-slate-800">{{ formatNumber(item.opening) }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm font-semibold text-emerald-600">{{ formatNumber(item.inQuantity) }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm font-semibold text-blue-600">{{ formatNumber(item.outQuantity) }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span
                    :class="[
                      'text-sm font-semibold',
                      item.closing < 1000 ? 'text-red-600' : 'text-slate-800'
                    ]"
                  >
                    {{ formatNumber(item.closing) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-500">{{ item.remark || '-' }}</span>
                </td>
              </tr>
              <tr v-if="paginatedFlow.length === 0">
                <td colspan="7" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <TrendingUp class="w-12 h-12 text-slate-300" />
                    <p class="text-sm text-slate-400">暂无库存流水数据</p>
                  </div>
                </td>
              </tr>
              <tr v-if="inventoryFlowData.length > 0" class="bg-slate-50 font-semibold">
                <td class="px-4 py-4 text-sm text-slate-700" colspan="2">
                  <span class="flex items-center gap-2">
                    <TrendingDown class="w-4 h-4 text-slate-500" />
                    合计
                  </span>
                </td>
                <td class="px-4 py-4 text-right text-sm text-slate-700">-</td>
                <td class="px-4 py-4 text-right text-sm text-emerald-600">{{ formatNumber(flowSummary.totalIn) }}</td>
                <td class="px-4 py-4 text-right text-sm text-blue-600">{{ formatNumber(flowSummary.totalOut) }}</td>
                <td class="px-4 py-4 text-right">
                  <span
                    :class="[
                      'text-sm',
                      flowSummary.finalClosing < 1000 ? 'text-red-600' : 'text-slate-800'
                    ]"
                  >
                    {{ formatNumber(flowSummary.finalClosing) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-slate-500">最终结存</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="text-sm text-slate-500">
            共 <span class="font-medium text-slate-700">{{ inventoryFlowData.length }}</span> 条记录
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'p-2 rounded-lg text-sm transition-colors',
                currentPage === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <template v-for="page in totalPages" :key="page">
              <button
                v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
                @click="goToPage(page)"
                :class="[
                  'min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                {{ page }}
              </button>
              <span
                v-else-if="page === currentPage - 2 || page === currentPage + 2"
                class="px-2 text-slate-400"
              >
                ...
              </span>
            </template>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'p-2 rounded-lg text-sm transition-colors',
                currentPage === totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model:visible="showStockInModal" title="新增入库" width="560px">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">规格选择方式</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="stockInForm.isNewSpec" :value="false" class="accent-cyan-500" />
              <span class="text-sm text-slate-600">选择已有规格</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="stockInForm.isNewSpec" :value="true" class="accent-cyan-500" />
              <span class="text-sm text-slate-600">输入新规格</span>
            </label>
          </div>
        </div>

        <div v-if="!stockInForm.isNewSpec">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">选择规格</label>
          <select
            v-model="stockInForm.specSelect"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
          >
            <option value="">请选择规格</option>
            <option v-for="item in store.inventoryItems" :key="item.id" :value="item.spec">
              {{ item.spec }}（库存：{{ item.quantity }} {{ item.unit }}）
            </option>
          </select>
        </div>

        <div v-else>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">新规格名称</label>
          <input
            v-model="stockInForm.specNew"
            type="text"
            placeholder="请输入新规格型号"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">入库数量</label>
            <input
              v-model.number="stockInForm.quantity"
              type="number"
              min="1"
              placeholder="请输入数量"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">库位</label>
            <input
              v-model="stockInForm.location"
              type="text"
              placeholder="请输入库位"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">批次号</label>
            <input
              v-model="stockInForm.batchNo"
              type="text"
              placeholder="请输入批次号"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">操作员</label>
            <input
              v-model="stockInForm.operator"
              type="text"
              placeholder="请输入操作员"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
          <textarea
            v-model="stockInForm.remark"
            rows="2"
            placeholder="选填"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showStockInModal = false"
            class="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="submitStockIn"
            class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm font-medium"
          >
            确认入库
          </button>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model:visible="showStockOutModal" title="新增出库" width="560px">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">选择规格</label>
          <select
            v-model="stockOutForm.spec"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
          >
            <option value="">请选择规格</option>
            <option v-for="item in store.inventoryItems" :key="item.id" :value="item.spec">
              {{ item.spec }}（库存：{{ item.quantity }} {{ item.unit }}）
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">出库数量</label>
          <input
            v-model.number="stockOutForm.quantity"
            type="number"
            min="1"
            placeholder="请输入数量"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">操作员</label>
          <input
            v-model="stockOutForm.operator"
            type="text"
            placeholder="请输入操作员"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
          <textarea
            v-model="stockOutForm.remark"
            rows="2"
            placeholder="选填"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showStockOutModal = false"
            class="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="submitStockOut"
            class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm font-medium"
          >
            确认出库
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
