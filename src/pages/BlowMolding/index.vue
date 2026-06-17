<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import {
  Play,
  Pause,
  Clock,
  Settings,
  TrendingUp,
  Activity,
  Zap,
  Gauge,
  Thermometer,
  Eye,
  Sliders,
  Power,
  ChevronLeft,
  ChevronRight,
  List,
  LineChart
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { BlowMoldingRecord } from '@/types'

const store = useAppStore()

const activeTab = ref<'records' | 'chart'>('records')
const currentPage = ref(1)
const pageSize = ref(5)

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

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

const todayOutput = computed(() =>
  store.blowMoldingRecords
    .filter(r => r.startTime.startsWith('2026-06-17'))
    .reduce((sum, r) => sum + r.output, 0)
)

const avgQualifiedRate = computed(() => {
  const records = store.blowMoldingRecords.filter(r => r.output > 0)
  if (records.length === 0) return 0
  const totalOutput = records.reduce((sum, r) => sum + r.output, 0)
  const totalDefect = records.reduce((sum, r) => sum + r.defectCount, 0)
  return ((totalOutput - totalDefect) / totalOutput * 100).toFixed(1)
})

const energyConsumption = computed(() => {
  return (store.blowMoldingRecords.length * 125.6).toFixed(1)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return store.blowMoldingRecords.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(store.blowMoldingRecords.length / pageSize.value)
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
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const initChart = () => {
  if (!chartRef.value) return

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
      textStyle: {
        color: '#334155'
      }
    },
    legend: {
      data: ['加热功率(%)', '吹瓶压力(MPa)'],
      top: 0,
      right: 0,
      textStyle: {
        color: '#64748b',
        fontSize: 12
      }
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
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 12
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '加热功率(%)',
        min: 70,
        max: 100,
        position: 'left',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9'
          }
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 12
        }
      },
      {
        type: 'value',
        name: '吹瓶压力(MPa)',
        min: 2,
        max: 4,
        position: 'right',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 12
        }
      }
    ],
    series: [
      {
        name: '加热功率(%)',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: heatingPowerData,
        lineStyle: {
          color: '#f59e0b',
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 158, 11, 0.2)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
          ])
        },
        itemStyle: {
          color: '#f59e0b'
        }
      },
      {
        name: '吹瓶压力(MPa)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: blowPressureData,
        lineStyle: {
          color: '#0ea5e9',
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(14, 165, 233, 0.2)' },
            { offset: 1, color: 'rgba(14, 165, 233, 0.02)' }
          ])
        },
        itemStyle: {
          color: '#0ea5e9'
        }
      }
    ]
  }

  chart.setOption(option)
}

const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  if (activeTab.value === 'chart') {
    initChart()
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  chart?.dispose()
  window.removeEventListener('resize', handleResize)
})

const handleTabChange = (tab: 'records' | 'chart') => {
  activeTab.value = tab
  if (tab === 'chart') {
    setTimeout(() => {
      initChart()
    }, 100)
  }
}

const viewDetail = (record: BlowMoldingRecord) => {
  console.log('查看详情:', record.id)
}

const adjustParams = (record: BlowMoldingRecord) => {
  console.log('参数调整:', record.id)
}

const toggleProduction = (record: BlowMoldingRecord) => {
  console.log('停产/复产:', record.id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">加热吹瓶</h2>
        <p class="text-sm text-slate-500 mt-1">吹瓶生产管理与参数监控</p>
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
              <span class="text-2xl font-bold text-slate-800">{{ runningCount }}</span>
              <span class="text-sm text-slate-500">/{{ blowMoldingEquipments.length }}台</span>
            </div>
            <div class="mt-2 flex items-center gap-1">
              <Activity class="w-3.5 h-3.5 text-emerald-500" />
              <span class="text-xs text-emerald-600 font-medium">
                使用率 {{ ((runningCount / blowMoldingEquipments.length) * 100).toFixed(0) }}%
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
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-100">
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
              <tr
                v-for="record in paginatedRecords"
                :key="record.id"
                class="hover:bg-slate-50 transition-colors"
              >
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
                  <div class="flex items-center gap-2">
                    <button
                      @click="viewDetail(record)"
                      class="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      查看详情
                    </button>
                    <button
                      @click="adjustParams(record)"
                      class="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <Sliders class="w-3.5 h-3.5" />
                      参数调整
                    </button>
                    <button
                      @click="toggleProduction(record)"
                      class="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-700 font-medium"
                    >
                      <Power class="w-3.5 h-3.5" />
                      {{ record.status === 'running' ? '停产' : '复产' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <div class="text-sm text-slate-500">
            共 {{ store.blowMoldingRecords.length }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
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
  </div>
</template>
