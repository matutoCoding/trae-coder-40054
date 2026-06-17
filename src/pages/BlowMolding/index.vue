<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Play,
  Pause,
  Settings,
  TrendingUp,
  Activity,
  Zap,
  Gauge,
  Thermometer,
  Sliders,
  ChevronLeft,
  ChevronRight,
  List,
  LineChart,
  Plus,
  Trash2,
  CheckCircle,
  RotateCcw,
  Edit,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { BlowMoldingRecord } from '@/types'
import BaseModal from '@/components/Modal/BaseModal.vue'
import { useToast } from '@/composables/useToast'
import TraceabilityView from '@/components/Traceability/TraceabilityView.vue'

const store = useAppStore()
const toast = useToast()

const activeTab = ref<'records' | 'chart'>('records')
const currentPage = ref(1)
const pageSize = ref(5)
const searchKeyword = ref('')
const statusFilter = ref('')
const expandedRows = ref<string[]>([])

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const showCreateFromQualifiedModal = ref(false)
const showAddRecordModal = ref(false)
const showAdjustParamsModal = ref(false)
const showDeleteConfirmModal = ref(false)

const createFromQualifiedForm = ref({
  purchaseId: '',
  machineNo: ''
})

const addRecordForm = ref({
  machineNo: '',
  moldNo: '',
  productSpec: '',
  heatingPower: 85,
  blowPressure: 2.8,
  preformTemp: 105,
  operator: ''
})

const adjustParamsForm = ref({
  id: '',
  heatingPower: 0,
  blowPressure: 0,
  preformTemp: 0
})

const deleteTargetId = ref('')

const qualifiedPurchaseOrders = computed(() =>
  store.purchaseOrders.filter(o => o.status === 'qualified')
)

const blowMoldingEquipments = computed(() =>
  store.equipments.filter(e => e.type === 'blower')
)

const runningCount = computed(() =>
  blowMoldingEquipments.value.filter(e => e.status === 'running').length
)

const maintenanceCount = computed(() =>
  blowMoldingEquipments.value.filter(e => e.status === 'maintenance').length
)

const idleCount = computed(() =>
  blowMoldingEquipments.value.filter(e => e.status === 'idle' || e.status === 'fault').length
)

const todayOutput = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.blowMoldingRecords.filter(r => r.startTime?.startsWith(today)).reduce((s, r) => s + r.output, 0)
})

const runningMachines = computed(() => store.equipments.filter(e => e.status === 'running').length)

const avgQualifiedRate = computed(() => {
  const total = store.blowMoldingRecords.reduce((s, r) => s + r.output, 0)
  const defect = store.blowMoldingRecords.reduce((s, r) => s + r.defectCount, 0)
  return total > 0 ? ((total - defect) / total * 100).toFixed(1) : '0.0'
})

const energyConsumption = computed(() =>
  (store.blowMoldingRecords.length * 125.6).toFixed(1)
)

const filteredRecords = computed(() => {
  let result = store.blowMoldingRecords

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(r =>
      r.id.toLowerCase().includes(keyword) ||
      r.machineNo.toLowerCase().includes(keyword) ||
      r.moldNo.toLowerCase().includes(keyword) ||
      r.productSpec.toLowerCase().includes(keyword) ||
      r.operator.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value)
  }

  return result
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRecords.value.length / pageSize.value))
)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'completed': return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'running': return '运行中'
    case 'completed': return '已完成'
    case 'paused': return '暂停'
    default: return status
  }
}

const getEquipmentStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-emerald-500'
    case 'maintenance': return 'bg-amber-500'
    case 'idle': return 'bg-slate-400'
    case 'fault': return 'bg-red-500'
    default: return 'bg-slate-400'
  }
}

const getEquipmentStatusText = (status: string) => {
  switch (status) {
    case 'running': return '运行中'
    case 'maintenance': return '维护中'
    case 'idle': return '空闲'
    case 'fault': return '故障'
    default: return status
  }
}

const handlePrevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const openCreateFromQualifiedModal = () => {
  createFromQualifiedForm.value = { purchaseId: '', machineNo: '' }
  showCreateFromQualifiedModal.value = true
}

const handleCreateFromQualified = () => {
  const { purchaseId, machineNo } = createFromQualifiedForm.value
  if (!purchaseId) {
    toast.warning('请选择合格采购单')
    return
  }
  if (!machineNo) {
    toast.warning('请选择机台号')
    return
  }
  const result = store.createBlowMoldingFromQualified(purchaseId, machineNo)
  if (result) {
    showCreateFromQualifiedModal.value = false
    toast.success('生产记录创建成功')
  } else {
    toast.error('创建失败，请检查采购单状态')
  }
}

const openAddRecordModal = () => {
  addRecordForm.value = {
    machineNo: '',
    moldNo: '',
    productSpec: '',
    heatingPower: 85,
    blowPressure: 2.8,
    preformTemp: 105,
    operator: ''
  }
  showAddRecordModal.value = true
}

const handleAddRecord = () => {
  const f = addRecordForm.value
  if (!f.machineNo) { toast.warning('请填写机台号'); return }
  if (!f.moldNo) { toast.warning('请填写模具号'); return }
  if (!f.productSpec) { toast.warning('请填写产品规格'); return }
  if (!f.operator) { toast.warning('请填写操作员'); return }

  store.addBlowMoldingRecord({
    machineNo: f.machineNo,
    moldNo: f.moldNo,
    productSpec: f.productSpec,
    heatingPower: f.heatingPower,
    blowPressure: f.blowPressure,
    preformTemp: f.preformTemp,
    output: 0,
    defectCount: 0,
    startTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    endTime: '',
    status: 'running',
    operator: f.operator,
    remark: ''
  })
  showAddRecordModal.value = false
  toast.success('吹瓶记录新增成功')
}

const handlePause = (record: BlowMoldingRecord) => {
  store.pauseBlowMolding(record.id)
  toast.success('已停产')
}

const handleStart = (record: BlowMoldingRecord) => {
  store.startBlowMolding(record.id)
  toast.success('已复产')
}

const handleComplete = (record: BlowMoldingRecord) => {
  store.completeBlowMolding(record.id)
  toast.success('生产已完成')
}

const openAdjustParamsModal = (record: BlowMoldingRecord) => {
  adjustParamsForm.value = {
    id: record.id,
    heatingPower: record.heatingPower,
    blowPressure: record.blowPressure,
    preformTemp: record.preformTemp
  }
  showAdjustParamsModal.value = true
}

const handleAdjustParams = () => {
  const { id, ...data } = adjustParamsForm.value
  store.updateBlowMoldingRecord(id, data)
  showAdjustParamsModal.value = false
  toast.success('参数调整成功')
}

const confirmDelete = (id: string) => {
  deleteTargetId.value = id
  showDeleteConfirmModal.value = true
}

const handleDelete = () => {
  store.deleteBlowMoldingRecord(deleteTargetId.value)
  showDeleteConfirmModal.value = false
  toast.success('记录已删除')
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

const initChart = () => {
  if (!chartRef.value) return
  if (chart) chart.dispose()

  chart = echarts.init(chartRef.value)

  const timeData = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
  const heatingPowerData = [82, 85, 86, 84, 83, 85, 87, 86, 85]
  const blowPressureData = [2.7, 2.8, 2.9, 2.85, 2.8, 2.9, 3.0, 2.95, 2.9]

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#334155' }
    },
    legend: {
      data: ['加热功率(%)', '吹瓶压力(MPa)'],
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 12 }
    },
    yAxis: [
      {
        type: 'value',
        name: '加热功率(%)',
        min: 70,
        max: 100,
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 12 }
      },
      {
        type: 'value',
        name: '吹瓶压力(MPa)',
        min: 2,
        max: 4,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 12 }
      }
    ],
    series: [
      {
        name: '加热功率(%)',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: heatingPowerData,
        lineStyle: { color: '#f59e0b', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 158, 11, 0.2)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
          ])
        },
        itemStyle: { color: '#f59e0b' }
      },
      {
        name: '吹瓶压力(MPa)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: blowPressureData,
        lineStyle: { color: '#0ea5e9', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(14, 165, 233, 0.2)' },
            { offset: 1, color: 'rgba(14, 165, 233, 0.02)' }
          ])
        },
        itemStyle: { color: '#0ea5e9' }
      }
    ]
  }

  chart.setOption(option)
}

const handleResize = () => {
  chart?.resize()
}

const handleTabChange = (tab: 'records' | 'chart') => {
  activeTab.value = tab
  if (tab === 'chart') {
    nextTick(() => initChart())
  }
}

onMounted(() => {
  if (activeTab.value === 'chart') {
    nextTick(() => initChart())
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  chart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">加热吹瓶</h2>
        <p class="text-sm text-slate-500 mt-1">吹瓶生产管理与参数监控</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="openCreateFromQualifiedModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <Plus class="w-4 h-4" />
          创建生产
        </button>
        <button
          @click="openAddRecordModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Edit class="w-4 h-4" />
          新增记录
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-emerald-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">运行中</p>
            <p class="text-3xl font-bold text-emerald-600 mt-1">{{ runningCount }}</p>
            <p class="text-xs text-slate-400 mt-1">台设备</p>
          </div>
          <div class="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
            <Play class="w-6 h-6 text-emerald-500" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">维护中</p>
            <p class="text-3xl font-bold text-amber-600 mt-1">{{ maintenanceCount }}</p>
            <p class="text-xs text-slate-400 mt-1">台设备</p>
          </div>
          <div class="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
            <Settings class="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-slate-400">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">空闲</p>
            <p class="text-3xl font-bold text-slate-600 mt-1">{{ idleCount }}</p>
            <p class="text-xs text-slate-400 mt-1">台设备</p>
          </div>
          <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
            <Pause class="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      <h3 class="text-base font-semibold text-slate-800 mb-4">设备状态概览</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="equipment in blowMoldingEquipments"
          :key="equipment.id"
          class="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div :class="[getEquipmentStatusColor(equipment.status), 'w-2.5 h-2.5 rounded-full']"></div>
              <span class="font-medium text-slate-800">{{ equipment.equipmentNo }}</span>
            </div>
            <span
              :class="[
                getStatusColor(equipment.status === 'running' ? 'running' : equipment.status === 'maintenance' ? 'paused' : 'completed'),
                'text-xs px-2 py-0.5 rounded-full border'
              ]"
            >
              {{ getEquipmentStatusText(equipment.status) }}
            </span>
          </div>
          <p class="text-sm text-slate-600">{{ equipment.name }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ equipment.location }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">今日总产量</p>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800">{{ todayOutput.toLocaleString() }}</span>
              <span class="text-sm text-slate-500">只</span>
            </div>
            <div class="mt-2 flex items-center gap-1">
              <TrendingUp class="w-3.5 h-3.5 text-emerald-500" />
              <span class="text-xs text-emerald-600 font-medium">+8.2%</span>
            </div>
          </div>
          <div class="p-3 bg-blue-50 rounded-xl">
            <Activity class="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">运行设备数</p>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800">{{ runningMachines }}</span>
              <span class="text-sm text-slate-500">/{{ blowMoldingEquipments.length }}台</span>
            </div>
            <div class="mt-2 flex items-center gap-1">
              <Activity class="w-3.5 h-3.5 text-emerald-500" />
              <span class="text-xs text-emerald-600 font-medium">
                使用率 {{ blowMoldingEquipments.length > 0 ? ((runningMachines / blowMoldingEquipments.length) * 100).toFixed(0) : 0 }}%
              </span>
            </div>
          </div>
          <div class="p-3 bg-emerald-50 rounded-xl">
            <Gauge class="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">平均合格率</p>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800">{{ avgQualifiedRate }}</span>
              <span class="text-sm text-slate-500">%</span>
            </div>
            <div class="mt-2 flex items-center gap-1">
              <TrendingUp class="w-3.5 h-3.5 text-emerald-500" />
              <span class="text-xs text-emerald-600 font-medium">+0.5%</span>
            </div>
          </div>
          <div class="p-3 bg-purple-50 rounded-xl">
            <Zap class="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-500">能耗指标</p>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800">{{ energyConsumption }}</span>
              <span class="text-sm text-slate-500">kWh</span>
            </div>
            <div class="mt-2 flex items-center gap-1">
              <TrendingUp class="w-3.5 h-3.5 text-amber-500" />
              <span class="text-xs text-amber-600 font-medium">+3.1%</span>
            </div>
          </div>
          <div class="p-3 bg-amber-50 rounded-xl">
            <Thermometer class="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <div class="border-b border-slate-100 px-6">
        <div class="flex gap-6">
          <button
            @click="handleTabChange('records')"
            :class="[
              'flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'records'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
          >
            <List class="w-4 h-4" />
            生产记录
          </button>
          <button
            @click="handleTabChange('chart')"
            :class="[
              'flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'chart'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
          >
            <LineChart class="w-4 h-4" />
            参数曲线
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'records'" class="p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div class="relative flex-1 w-full sm:max-w-xs">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索编号、机台、模具、规格、操作员..."
              class="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
          <select
            v-model="statusFilter"
            class="px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
          >
            <option value="">全部状态</option>
            <option value="running">运行中</option>
            <option value="paused">暂停</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-100">
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider w-10"></th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">记录编号</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">机台号</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">模具号</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">产品规格</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">加热功率(%)</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">吹瓶压力(MPa)</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">瓶坯温度(℃)</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">产量</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">不良数</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-for="record in paginatedRecords" :key="record.id">
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-4">
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
                  <td class="py-3 px-4 text-sm font-medium text-slate-800">{{ record.id }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ record.machineNo }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ record.moldNo }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ record.productSpec }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ record.heatingPower }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ record.blowPressure }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ record.preformTemp }}</td>
                <td class="py-3 px-4 text-sm text-slate-600">{{ record.output.toLocaleString() }}</td>
                <td class="py-3 px-4 text-sm text-red-500">{{ record.defectCount }}</td>
                <td class="py-3 px-4">
                  <span
                    :class="[
                      getStatusColor(record.status),
                      'text-xs px-2.5 py-0.5 rounded-full border font-medium'
                    ]"
                  >
                    {{ getStatusText(record.status) }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-1 flex-wrap">
                    <button
                      v-if="record.status === 'running'"
                      @click="handlePause(record)"
                      class="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                    >
                      <Pause class="w-3.5 h-3.5" />
                      停产
                    </button>
                    <button
                      v-if="record.status === 'paused'"
                      @click="handleStart(record)"
                      class="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                    >
                      <RotateCcw class="w-3.5 h-3.5" />
                      复产
                    </button>
                    <button
                      v-if="record.status === 'running'"
                      @click="handleComplete(record)"
                      class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      <CheckCircle class="w-3.5 h-3.5" />
                      完成
                    </button>
                    <button
                      v-if="record.status === 'running' || record.status === 'paused'"
                      @click="openAdjustParamsModal(record)"
                      class="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium px-2 py-1 rounded hover:bg-cyan-50 transition-colors"
                    >
                      <Sliders class="w-3.5 h-3.5" />
                      参数调整
                    </button>
                    <button
                      @click="confirmDelete(record.id)"
                      class="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                      删除
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="isRowExpanded(record.id)" class="bg-slate-50">
                <td colspan="12" class="px-4 py-4">
                  <div class="pl-8">
                    <div class="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Gauge class="w-4 h-4 text-cyan-500" />
                        生产详情
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">开始时间</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.startTime || '-' }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">结束时间</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.endTime || '-' }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">操作员</p>
                          <p class="text-sm font-medium text-slate-800">{{ record.operator || '-' }}</p>
                        </div>
                        <div class="bg-cyan-50 rounded-lg p-3">
                          <p class="text-xs text-cyan-600 mb-1">状态</p>
                          <span :class="[getStatusColor(record.status), 'text-xs px-2.5 py-1 rounded-full border font-medium']">
                            {{ getStatusText(record.status) }}
                          </span>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">总产量</p>
                          <p class="text-lg font-bold text-slate-800">{{ record.output.toLocaleString() }} <span class="text-sm font-normal text-slate-500">只</span></p>
                        </div>
                        <div class="bg-red-50 rounded-lg p-3">
                          <p class="text-xs text-red-600 mb-1">不良数</p>
                          <p class="text-lg font-bold text-red-700">{{ record.defectCount }} <span class="text-sm font-normal text-red-500">只</span></p>
                        </div>
                        <div class="bg-emerald-50 rounded-lg p-3">
                          <p class="text-xs text-emerald-600 mb-1">合格率</p>
                          <p class="text-lg font-bold text-emerald-700">{{ record.output > 0 ? (((record.output - record.defectCount) / record.output) * 100).toFixed(1) : '0.0' }} <span class="text-sm font-normal text-emerald-500">%</span></p>
                        </div>
                      </div>
                      <div v-if="record.remark" class="mt-3 pt-3 border-t border-slate-100">
                        <p class="text-xs text-slate-500 mb-1">备注</p>
                        <p class="text-sm text-slate-600">{{ record.remark }}</p>
                      </div>
                      <div class="mt-4 pt-4 border-t border-slate-100">
                        <TraceabilityView type="blowMolding" :id="record.id" />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div v-if="filteredRecords.length === 0" class="py-16 text-center">
          <List class="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p class="text-sm text-slate-400">暂无生产记录</p>
        </div>

        <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <div class="text-sm text-slate-500">
            共 {{ filteredRecords.length }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handlePrevPage"
              :disabled="currentPage === 1"
              :class="[
                'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                currentPage === 1
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ page }}
            </button>
            <button
              @click="handleNextPage"
              :disabled="currentPage === totalPages"
              :class="[
                'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                currentPage === totalPages
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'chart'" class="p-6">
        <div class="mb-4">
          <h3 class="text-base font-semibold text-slate-800">参数趋势图</h3>
          <p class="text-sm text-slate-500 mt-1">加热功率与吹瓶压力实时监控</p>
        </div>
        <div ref="chartRef" class="w-full h-80"></div>
      </div>
    </div>

    <BaseModal
      v-model:visible="showCreateFromQualifiedModal"
      title="创建生产记录"
      width="520px"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">选择合格采购单</label>
          <select
            v-model="createFromQualifiedForm.purchaseId"
            class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
          >
            <option value="">请选择合格采购单</option>
            <option
              v-for="order in qualifiedPurchaseOrders"
              :key="order.id"
              :value="order.id"
            >
              {{ order.id }} - {{ order.spec }} - {{ order.supplierName }} ({{ order.quantity }}只)
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">选择机台号</label>
          <select
            v-model="createFromQualifiedForm.machineNo"
            class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
          >
            <option value="">请选择机台</option>
            <option
              v-for="eq in blowMoldingEquipments"
              :key="eq.id"
              :value="eq.equipmentNo"
            >
              {{ eq.equipmentNo }} - {{ eq.name }} ({{ getEquipmentStatusText(eq.status) }})
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showCreateFromQualifiedModal = false"
            class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleCreateFromQualified"
            class="px-4 py-2 text-sm text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            确认创建
          </button>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      v-model:visible="showAddRecordModal"
      title="新增吹瓶记录"
      width="560px"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">机台号</label>
            <select
              v-model="addRecordForm.machineNo"
              class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors bg-white"
            >
              <option value="">请选择机台</option>
              <option
                v-for="eq in blowMoldingEquipments"
                :key="eq.id"
                :value="eq.equipmentNo"
              >
                {{ eq.equipmentNo }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">模具号</label>
            <input
              v-model="addRecordForm.moldNo"
              type="text"
              placeholder="请输入模具号"
              class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">产品规格</label>
          <input
            v-model="addRecordForm.productSpec"
            type="text"
            placeholder="请输入产品规格"
            class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">加热功率(%)</label>
            <input
              v-model.number="addRecordForm.heatingPower"
              type="number"
              min="0"
              max="100"
              class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">吹瓶压力(MPa)</label>
            <input
              v-model.number="addRecordForm.blowPressure"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">瓶坯温度(℃)</label>
            <input
              v-model.number="addRecordForm.preformTemp"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">操作员</label>
          <input
            v-model="addRecordForm.operator"
            type="text"
            placeholder="请输入操作员姓名"
            class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showAddRecordModal = false"
            class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleAddRecord"
            class="px-4 py-2 text-sm text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            确认新增
          </button>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      v-model:visible="showAdjustParamsModal"
      title="参数调整"
      width="480px"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">加热功率(%)</label>
          <input
            v-model.number="adjustParamsForm.heatingPower"
            type="number"
            min="0"
            max="100"
            class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">吹瓶压力(MPa)</label>
          <input
            v-model.number="adjustParamsForm.blowPressure"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">瓶坯温度(℃)</label>
          <input
            v-model.number="adjustParamsForm.preformTemp"
            type="number"
            min="0"
            class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showAdjustParamsModal = false"
            class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleAdjustParams"
            class="px-4 py-2 text-sm text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            保存调整
          </button>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      v-model:visible="showDeleteConfirmModal"
      title="确认删除"
      width="400px"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Trash2 class="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p class="text-sm text-slate-700 font-medium">确定要删除此记录吗？</p>
          <p class="text-sm text-slate-500 mt-1">此操作不可撤销，删除后数据将无法恢复。</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showDeleteConfirmModal = false"
            class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            确认删除
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
