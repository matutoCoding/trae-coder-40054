<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Package,
  Building2,
  Phone,
  MapPin,
  Truck,
  ClipboardCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import BaseModal from '@/components/Modal/BaseModal.vue'
import { useToast } from '@/composables/useToast'
import type { PurchaseOrder, Supplier } from '@/types'
import TraceabilityView from '@/components/Traceability/TraceabilityView.vue'

const store = useAppStore()
const toast = useToast()

const activeTab = ref<'orders' | 'suppliers'>('orders')

const searchKeyword = ref('')
const statusFilter = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

const currentPage = ref(1)
const pageSize = ref(10)
const expandedRows = ref<string[]>([])

const showAddModal = ref(false)

const form = reactive({
  supplierId: '',
  supplierName: '',
  spec: '',
  weight: 0,
  quantity: 0,
  unitPrice: 0,
  totalAmount: 0,
  orderDate: '',
  expectedDate: '',
  remark: ''
})

watch(() => form.supplierId, (id) => {
  const s = store.suppliers.find(s => s.id === id)
  if (s) form.supplierName = s.name
})

watch([() => form.quantity, () => form.unitPrice], () => {
  form.totalAmount = Math.round(form.quantity * form.unitPrice * 100) / 100
})

const resetForm = () => {
  form.supplierId = ''
  form.supplierName = ''
  form.spec = ''
  form.weight = 0
  form.quantity = 0
  form.unitPrice = 0
  form.totalAmount = 0
  form.orderDate = ''
  form.expectedDate = ''
  form.remark = ''
}

const getStatusText = (status: PurchaseOrder['status']) => {
  const statusMap: Record<PurchaseOrder['status'], string> = {
    pending: '待发货',
    delivered: '已到货',
    inspecting: '检验中',
    qualified: '合格',
    rejected: '不合格'
  }
  return statusMap[status] || status
}

const getStatusClass = (status: PurchaseOrder['status']) => {
  const classMap: Record<PurchaseOrder['status'], string> = {
    pending: 'bg-amber-100 text-amber-700',
    delivered: 'bg-blue-100 text-blue-700',
    inspecting: 'bg-purple-100 text-purple-700',
    qualified: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700'
  }
  return classMap[status] || 'bg-gray-100 text-gray-700'
}

const getSupplierStatusText = (status: Supplier['status']) => {
  return status === 'active' ? '启用' : '停用'
}

const getSupplierStatusClass = (status: Supplier['status']) => {
  return status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-gray-100 text-gray-500'
}

const filteredOrders = computed(() => {
  let result = [...store.purchaseOrders]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      order =>
        order.id.toLowerCase().includes(keyword) ||
        order.supplierName.toLowerCase().includes(keyword) ||
        order.spec.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter.value) {
    result = result.filter(order => order.status === statusFilter.value)
  }

  if (dateRangeStart.value) {
    result = result.filter(order => order.orderDate >= dateRangeStart.value)
  }

  if (dateRangeEnd.value) {
    result = result.filter(order => order.orderDate <= dateRangeEnd.value)
  }

  return result
})

const filteredSuppliers = computed(() => {
  if (!searchKeyword.value) {
    return store.suppliers
  }
  const keyword = searchKeyword.value.toLowerCase()
  return store.suppliers.filter(
    supplier =>
      supplier.name.toLowerCase().includes(keyword) ||
      supplier.contact.toLowerCase().includes(keyword) ||
      supplier.phone.includes(keyword)
  )
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredOrders.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / pageSize.value) || 1
})

const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const handleAddOrder = () => {
  resetForm()
  showAddModal.value = true
}

const handleSaveOrder = () => {
  if (!form.supplierId || !form.spec || !form.weight || !form.quantity) {
    toast.warning('请填写必填项')
    return
  }
  store.addPurchaseOrder({ ...form, status: 'pending', orderDate: new Date().toISOString().split('T')[0] })
  toast.success('采购单创建成功')
  showAddModal.value = false
  resetForm()
}

const handleConfirmDelivery = (order: PurchaseOrder) => {
  const result = store.deliverPurchaseOrder(order.id)
  if (result) {
    toast.success('已确认到货')
  } else {
    toast.error('确认到货失败')
  }
}

const handleToInspection = (order: PurchaseOrder) => {
  const inspection = store.createInspectionFromPurchase(order.id)
  if (inspection) {
    toast.success('已生成瓶坯检验待检任务')
  } else {
    toast.error('生成检验任务失败')
  }
}

const handleDelete = (order: PurchaseOrder) => {
  if (confirm(`确定要删除采购单 ${order.id} 吗？`)) {
    const result = store.deletePurchaseOrder(order.id)
    if (result) {
      toast.success('删除成功')
    } else {
      toast.error('删除失败')
    }
  }
}

const handleView = (order: PurchaseOrder) => {
  console.log('查看订单:', order.id)
}

const handleEdit = (order: PurchaseOrder) => {
  console.log('编辑订单:', order.id)
}

const handleViewSupplier = (supplier: Supplier) => {
  console.log('查看供应商:', supplier.id)
}

const handleEditSupplier = (supplier: Supplier) => {
  console.log('编辑供应商:', supplier.id)
}

const handleDeleteSupplier = (supplier: Supplier) => {
  if (confirm(`确定要删除供应商 ${supplier.name} 吗？`)) {
    const result = store.deleteSupplier(supplier.id)
    if (result) {
      toast.success('供应商删除成功')
    } else {
      toast.error('供应商删除失败')
    }
  }
}

const handleAddSupplier = () => {
  console.log('新增供应商')
}

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  dateRangeStart.value = ''
  dateRangeEnd.value = ''
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
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800">瓶坯采购管理</h2>
          <p class="text-sm text-slate-500 mt-1">管理瓶坯采购订单和供应商信息</p>
        </div>
        <button
          v-if="activeTab === 'orders'"
          @click="handleAddOrder"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm hover:shadow-md font-medium text-sm"
        >
          <Plus class="w-4 h-4" />
          新增采购
        </button>
        <button
          v-else
          @click="handleAddSupplier"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm hover:shadow-md font-medium text-sm"
        >
          <Plus class="w-4 h-4" />
          新增供应商
        </button>
      </div>

      <div class="flex gap-1 border-b border-slate-200 mb-6">
        <button
          @click="activeTab = 'orders'"
          :class="[
            'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'orders'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          ]"
        >
          <Package class="w-4 h-4" />
          采购单列表
        </button>
        <button
          @click="activeTab = 'suppliers'"
          :class="[
            'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'suppliers'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          ]"
        >
          <Building2 class="w-4 h-4" />
          供应商列表
        </button>
      </div>

      <div v-if="activeTab === 'orders'" class="space-y-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative flex-1 min-w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索采购单号、供应商、规格..."
              class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-400" />
            <select
              v-model="statusFilter"
              class="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="">全部状态</option>
              <option value="pending">待发货</option>
              <option value="delivered">已到货</option>
              <option value="inspecting">检验中</option>
              <option value="qualified">合格</option>
              <option value="rejected">不合格</option>
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
            @click="resetFilters"
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
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">采购单号</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">供应商</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">规格</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">单重(g)</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">数量</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">金额(元)</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">下单日期</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <template v-for="order in paginatedOrders" :key="order.id">
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-4">
                    <button
                      @click="toggleRowExpand(order.id)"
                      class="p-1 rounded hover:bg-slate-200 transition-colors"
                    >
                      <ChevronDown
                        v-if="!isRowExpanded(order.id)"
                        class="w-4 h-4 text-slate-400"
                      />
                      <ChevronUp
                        v-else
                        class="w-4 h-4 text-slate-400"
                      />
                    </button>
                  </td>
                <td class="px-4 py-4">
                  <span class="text-sm font-medium text-slate-800">{{ order.id }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ order.supplierName }}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ order.spec }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm text-slate-600">{{ order.weight }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm text-slate-600">{{ order.quantity.toLocaleString() }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-sm font-semibold text-slate-800">¥{{ formatAmount(order.totalAmount) }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600">{{ order.orderDate }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[getStatusClass(order.status), 'text-xs px-2.5 py-1 rounded-full font-medium']"
                  >
                    {{ getStatusText(order.status) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      v-if="order.status === 'pending'"
                      @click="handleConfirmDelivery(order)"
                      class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      title="确认到货"
                    >
                      <Truck class="w-3.5 h-3.5" />
                      确认到货
                    </button>
                    <button
                      v-if="order.status === 'delivered'"
                      @click="handleToInspection(order)"
                      class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                      title="转检验"
                    >
                      <ClipboardCheck class="w-3.5 h-3.5" />
                      转检验
                    </button>
                    <button
                      @click="handleView(order)"
                      class="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleEdit(order)"
                      class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleDelete(order)"
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="isRowExpanded(order.id)" class="bg-slate-50">
                <td colspan="10" class="px-4 py-4">
                  <div class="pl-8">
                    <div class="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Package class="w-4 h-4 text-cyan-500" />
                        采购详情
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">预计到货日期</p>
                          <p class="text-sm font-medium text-slate-800">{{ order.expectedDate || '-' }}</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">单重</p>
                          <p class="text-sm font-medium text-slate-800">{{ order.weight }} g</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-xs text-slate-500 mb-1">总金额</p>
                          <p class="text-sm font-medium text-slate-800">¥{{ formatAmount(order.totalAmount) }}</p>
                        </div>
                        <div class="bg-cyan-50 rounded-lg p-3">
                          <p class="text-xs text-cyan-600 mb-1">状态</p>
                          <span :class="[getStatusClass(order.status), 'text-xs px-2.5 py-1 rounded-full font-medium']">
                            {{ getStatusText(order.status) }}
                          </span>
                        </div>
                      </div>
                      <div v-if="order.remark" class="mt-3 pt-3 border-t border-slate-100">
                        <p class="text-xs text-slate-500 mb-1">备注</p>
                        <p class="text-sm text-slate-600">{{ order.remark }}</p>
                      </div>
                      <div class="mt-4 pt-4 border-t border-slate-100">
                        <TraceabilityView type="purchase" :id="order.id" />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              </template>
              <tr v-if="paginatedOrders.length === 0">
                <td colspan="10" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <Package class="w-12 h-12 text-slate-300" />
                    <p class="text-sm text-slate-400">暂无采购单数据</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="text-sm text-slate-500">
            共 <span class="font-medium text-slate-700">{{ filteredOrders.length }}</span> 条记录
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

      <div v-else class="space-y-4">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索供应商名称、联系人、电话..."
            class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">供应商名称</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">联系人</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">电话</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">地址</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="supplier in filteredSuppliers"
                :key="supplier.id"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                      <Building2 class="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-800">{{ supplier.name }}</p>
                      <p class="text-xs text-slate-400">{{ supplier.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-slate-600">{{ supplier.contact }}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <Phone class="w-3.5 h-3.5 text-slate-400" />
                    <span class="text-sm text-slate-600">{{ supplier.phone }}</span>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-start gap-2 max-w-xs">
                    <MapPin class="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span class="text-sm text-slate-600 line-clamp-1">{{ supplier.address }}</span>
                  </div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[getSupplierStatusClass(supplier.status), 'text-xs px-2.5 py-1 rounded-full font-medium']"
                  >
                    {{ getSupplierStatusText(supplier.status) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="handleViewSupplier(supplier)"
                      class="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleEditSupplier(supplier)"
                      class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleDeleteSupplier(supplier)"
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredSuppliers.length === 0">
                <td colspan="6" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <Building2 class="w-12 h-12 text-slate-300" />
                    <p class="text-sm text-slate-400">暂无供应商数据</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <BaseModal v-model:visible="showAddModal" title="新增采购单" width="640px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">供应商 <span class="text-red-500">*</span></label>
            <select
              v-model="form.supplierId"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="">请选择供应商</option>
              <option v-for="s in store.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">规格 <span class="text-red-500">*</span></label>
            <input
              v-model="form.spec"
              type="text"
              placeholder="如: 28mm PCO1810"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">单重(g) <span class="text-red-500">*</span></label>
            <input
              v-model.number="form.weight"
              type="number"
              min="0"
              step="0.01"
              placeholder="请输入单重"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">数量 <span class="text-red-500">*</span></label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              placeholder="请输入数量"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">单价(元)</label>
            <input
              v-model.number="form.unitPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="请输入单价"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">总金额(元)</label>
            <input
              :value="form.totalAmount"
              type="text"
              readonly
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">预计到货日期</label>
            <input
              v-model="form.expectedDate"
              type="date"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
          <textarea
            v-model="form.remark"
            rows="3"
            placeholder="请输入备注信息"
            class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showAddModal = false"
            class="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSaveOrder"
            class="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm font-medium"
          >
            保存
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
