<script setup lang="ts">
import { computed } from 'vue'
import {
  ShoppingCart,
  ClipboardCheck,
  Flame,
  FlaskConical,
  Beaker,
  PackageOpen,
  CheckCircle,
  XCircle,
  Clock,
  Link,
  ChevronRight
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  type: 'purchase' | 'preformInspection' | 'blowMolding' | 'bottleInspection' | 'volumeCheck' | 'warehouse'
  id: string
}>()

const store = useAppStore()

const traceData = computed(() => store.getTraceability(props.type, props.id))

const getStatusClass = (status: string) => {
  if (!status) return 'bg-slate-100 text-slate-500'
  if (status === 'qualified' || status === 'pass') return 'bg-emerald-100 text-emerald-700'
  if (status === 'unqualified' || status === 'fail') return 'bg-red-100 text-red-700'
  if (status === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}

const getStatusText = (status: string) => {
  if (!status) return '暂无'
  if (status === 'qualified') return '合格'
  if (status === 'unqualified') return '不合格'
  if (status === 'pass') return '通过'
  if (status === 'fail') return '不通过'
  if (status === 'pending') return '待处理'
  return status
}

const getStatusIcon = (status: string) => {
  if (!status || status === 'pending') return Clock
  if (status === 'qualified' || status === 'pass') return CheckCircle
  return XCircle
}

const steps = computed(() => [
  {
    key: 'purchase',
    title: '瓶坯采购',
    icon: ShoppingCart,
    data: traceData.value.purchase,
    fields: [
      { label: '采购单号', value: traceData.value.purchase?.id },
      { label: '供应商', value: traceData.value.purchase?.supplierName },
      { label: '规格', value: traceData.value.purchase?.spec },
      { label: '数量', value: traceData.value.purchase?.quantity?.toLocaleString() + ' 只' },
      { label: '状态', value: traceData.value.purchase?.status, isStatus: true }
    ]
  },
  {
    key: 'preformInspection',
    title: '瓶坯检验',
    icon: ClipboardCheck,
    data: traceData.value.preformInspection,
    fields: [
      { label: '检验单号', value: traceData.value.preformInspection?.id },
      { label: '抽样数', value: traceData.value.preformInspection?.sampleCount },
      { label: '合格数', value: traceData.value.preformInspection?.qualifiedCount },
      { label: '平均重量', value: traceData.value.preformInspection?.avgWeight + ' g' },
      { label: '结论', value: traceData.value.preformInspection?.conclusion, isStatus: true }
    ]
  },
  {
    key: 'blowMolding',
    title: '加热吹瓶',
    icon: Flame,
    data: traceData.value.blowMolding,
    fields: [
      { label: '记录编号', value: traceData.value.blowMolding?.id },
      { label: '机台号', value: traceData.value.blowMolding?.machineNo },
      { label: '加热功率', value: traceData.value.blowMolding?.heatingPower + '%' },
      { label: '吹瓶压力', value: traceData.value.blowMolding?.blowPressure + ' MPa' },
      { label: '产量', value: traceData.value.blowMolding?.output?.toLocaleString() + ' 只' }
    ]
  },
  {
    key: 'bottleInspection',
    title: '瓶身检测',
    icon: FlaskConical,
    data: traceData.value.bottleInspection,
    fields: [
      { label: '检测单号', value: traceData.value.bottleInspection?.id },
      { label: '壁厚', value: traceData.value.bottleInspection?.wallThickness + ' mm' },
      { label: '螺纹', value: traceData.value.bottleInspection?.threadResult, isStatus: true },
      { label: '外观', value: traceData.value.bottleInspection?.appearanceResult, isStatus: true },
      { label: '结论', value: traceData.value.bottleInspection?.conclusion, isStatus: true }
    ]
  },
  {
    key: 'volumeCheck',
    title: '容量校验',
    icon: Beaker,
    data: traceData.value.volumeCheck,
    fields: [
      { label: '校验单号', value: traceData.value.volumeCheck?.id },
      { label: '平均容量', value: traceData.value.volumeCheck?.avgVolume + ' ml' },
      { label: '瓶底厚度', value: traceData.value.volumeCheck?.bottomThickness + ' mm' },
      { label: '密封性', value: traceData.value.volumeCheck?.sealResult, isStatus: true },
      { label: '结论', value: traceData.value.volumeCheck?.conclusion, isStatus: true }
    ]
  },
  {
    key: 'warehouse',
    title: '装箱入库',
    icon: PackageOpen,
    data: traceData.value.warehouseRecords?.length > 0 ? traceData.value.warehouseRecords[0] : null,
    fields: [
      { label: '入库数量', value: traceData.value.warehouseRecords?.reduce((s: number, r: any) => s + (r.type === 'in' ? r.quantity : 0), 0)?.toLocaleString() + ' 只' },
      { label: '出库数量', value: traceData.value.warehouseRecords?.reduce((s: number, r: any) => s + (r.type === 'out' ? r.quantity : 0), 0)?.toLocaleString() + ' 只' },
      { label: '当前库存', value: traceData.value.warehouseRecords?.length ? (traceData.value.warehouseRecords.reduce((s: number, r: any) => s + (r.type === 'in' ? r.quantity : -r.quantity), 0)).toLocaleString() + ' 只' : '-' }
    ]
  }
])
</script>

<template>
  <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
    <div class="flex items-center gap-2 mb-4">
      <Link class="w-5 h-5 text-cyan-600" />
      <h4 class="text-sm font-semibold text-slate-800">全链路追溯</h4>
    </div>
    
    <div class="relative">
      <div class="absolute left-5 top-8 bottom-0 w-0.5 bg-slate-200"></div>
      
      <div class="space-y-4">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="relative pl-12"
        >
          <div
            class="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors"
            :class="[
              step.data 
                ? (type === step.key ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-300')
                : 'bg-slate-100 border-slate-200'
            ]"
          >
            <component
              :is="step.icon"
              class="w-5 h-5"
              :class="step.data ? (type === step.key ? 'text-white' : 'text-slate-600') : 'text-slate-400'"
            />
          </div>
          
          <div
            class="rounded-lg p-3 transition-all"
            :class="[
              type === step.key 
                ? 'bg-cyan-50 border border-cyan-200 shadow-sm' 
                : step.data 
                  ? 'bg-white border border-slate-200' 
                  : 'bg-slate-50 border border-dashed border-slate-200 opacity-60'
            ]"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium" :class="step.data ? 'text-slate-800' : 'text-slate-400'">
                {{ step.title }}
              </span>
              <ChevronRight v-if="index < steps.length - 1" class="w-4 h-4 text-slate-300" />
              <span v-if="step.data && step.fields.some(f => f.isStatus)" class="ml-auto">
                <component
                  :is="getStatusIcon(step.fields.find(f => f.isStatus)?.value as string)"
                  class="w-4 h-4"
                  :class="step.fields.find(f => f.isStatus)?.value === 'qualified' || step.fields.find(f => f.isStatus)?.value === 'pass' ? 'text-emerald-500' : step.fields.find(f => f.isStatus)?.value === 'unqualified' || step.fields.find(f => f.isStatus)?.value === 'fail' ? 'text-red-500' : 'text-amber-500'"
                />
              </span>
            </div>
            
            <div v-if="step.data" class="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
              <div
                v-for="(field, fIndex) in step.fields.slice(0, 3)"
                :key="fIndex"
                class="text-xs"
              >
                <span class="text-slate-500">{{ field.label }}：</span>
                <span
                  v-if="field.isStatus"
                  :class="[getStatusClass(field.value as string), 'px-1.5 py-0.5 rounded text-xs font-medium']"
                >
                  {{ getStatusText(field.value as string) }}
                </span>
                <span v-else class="text-slate-700">{{ field.value || '-' }}</span>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400">
              暂无记录
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
