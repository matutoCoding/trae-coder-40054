<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import {
  Package,
  CheckCircle,
  ClipboardList,
  Settings,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

const outputChartRef = ref<HTMLElement>()
const qualityChartRef = ref<HTMLElement>()

let outputChart: echarts.ECharts | null = null
let qualityChart: echarts.ECharts | null = null

const statCards = [
  {
    title: '今日产量',
    value: '21,100',
    unit: '只',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    trend: '+12.5%'
  },
  {
    title: '合格率',
    value: '97.2',
    unit: '%',
    icon: CheckCircle,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    trend: '+0.4%'
  },
  {
    title: '今日检验',
    value: '3',
    unit: '批次',
    icon: ClipboardList,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    trend: '待办 8'
  },
  {
    title: '运行设备',
    value: '4',
    unit: '/7台',
    icon: Settings,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    trend: '使用率 57%'
  }
]

const pendingTasks = [
  { id: 1, title: 'PO20260610004 瓶坯检验', type: '瓶坯检验', priority: 'high', time: '待处理' },
  { id: 2, title: 'BM-02 吹瓶机每日点检', type: '设备点检', priority: 'medium', time: '今日' },
  { id: 3, title: 'BI20260617002 瓶身检测', type: '瓶身检测', priority: 'high', time: '今日' },
  { id: 4, title: '壁厚测厚仪月度校准', type: '设备点检', priority: 'low', time: '3天后' },
  { id: 5, title: '28口汽水瓶模具保养', type: '设备点检', priority: 'medium', time: '5天后' },
  { id: 6, title: 'PO20260612005 收货验收', type: '瓶坯采购', priority: 'medium', time: '明日' }
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-600'
    case 'medium': return 'bg-amber-100 text-amber-600'
    case 'low': return 'bg-green-100 text-green-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return '紧急'
    case 'medium': return '一般'
    case 'low': return '低'
    default: return ''
  }
}

onMounted(() => {
  if (outputChartRef.value) {
    outputChart = echarts.init(outputChartRef.value)
    const outputOption = {
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
        data: ['总产量', '合格产量'],
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
        data: store.dashboardStats.outputTrend.map(item => item.date),
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
      yAxis: {
        type: 'value',
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
      series: [
        {
          name: '总产量',
          type: 'line',
          smooth: true,
          data: store.dashboardStats.outputTrend.map(item => item.output),
          lineStyle: {
            color: '#0ea5e9',
            width: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(14, 165, 233, 0.25)' },
              { offset: 1, color: 'rgba(14, 165, 233, 0.02)' }
            ])
          },
          itemStyle: {
            color: '#0ea5e9'
          }
        },
        {
          name: '合格产量',
          type: 'line',
          smooth: true,
          data: store.dashboardStats.outputTrend.map(item => item.qualified),
          lineStyle: {
            color: '#10b981',
            width: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
            ])
          },
          itemStyle: {
            color: '#10b981'
          }
        }
      ]
    }
    outputChart.setOption(outputOption)
  }

  if (qualityChartRef.value) {
    qualityChart = echarts.init(qualityChartRef.value)
    const qualityOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#334155'
        },
        formatter: (params: any) => {
          return `${params[0].name}<br/>合格率：${params[0].value}%`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: store.dashboardStats.qualityTrend.map(item => item.date),
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
      yAxis: {
        type: 'value',
        min: 94,
        max: 100,
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
          fontSize: 12,
          formatter: '{value}%'
        }
      },
      series: [
        {
          type: 'bar',
          data: store.dashboardStats.qualityTrend.map(item => item.rate),
          barWidth: 24,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#34d399' },
              { offset: 1, color: '#10b981' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    }
    qualityChart.setOption(qualityOption)
  }

  window.addEventListener('resize', () => {
    outputChart?.resize()
    qualityChart?.resize()
  })
})
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
            <div class="mt-2 flex items-center gap-1">
              <TrendingUp class="w-3.5 h-3.5 text-emerald-500" />
              <span class="text-xs text-emerald-600 font-medium">{{ card.trend }}</span>
            </div>
          </div>
          <div :class="[card.bgColor, 'p-3 rounded-xl']">
            <component :is="card.icon" class="w-6 h-6 text-slate-700" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-semibold text-slate-800">产量趋势</h3>
            <p class="text-sm text-slate-500 mt-1">近7天产量统计</p>
          </div>
        </div>
        <div ref="outputChartRef" class="w-full h-72"></div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-base font-semibold text-slate-800">合格率统计</h3>
          <p class="text-sm text-slate-500 mt-1">近7天质量合格率</p>
        </div>
        <div ref="qualityChartRef" class="w-full h-72"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-semibold text-slate-800">各模块进度</h3>
            <p class="text-sm text-slate-500 mt-1">今日各业务模块完成情况</p>
          </div>
        </div>
        <div class="space-y-4">
          <div
            v-for="item in store.dashboardStats.moduleProgress"
            :key="item.name"
            class="space-y-2"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ item.name }}</span>
              <span class="text-slate-500">{{ item.completed }} / {{ item.total }}</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                :style="{ width: `${(item.completed / item.total) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-semibold text-slate-800">待办事项</h3>
            <p class="text-sm text-slate-500 mt-1">共 {{ pendingTasks.length }} 条待处理</p>
          </div>
          <button class="text-cyan-600 text-sm hover:text-cyan-700 font-medium">
            查看全部
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="task in pendingTasks"
            :key="task.id"
            class="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div class="flex items-start gap-3">
              <div class="mt-0.5">
                <AlertCircle class="w-4 h-4 text-amber-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ task.title }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-slate-500">{{ task.type }}</span>
                  <span class="text-xs text-slate-300">·</span>
                  <span class="text-xs flex items-center gap-1 text-slate-500">
                    <Clock class="w-3 h-3" />
                    {{ task.time }}
                  </span>
                </div>
              </div>
              <span
                :class="[getPriorityColor(task.priority), 'text-xs px-2 py-0.5 rounded-full font-medium']"
              >
                {{ getPriorityText(task.priority) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
