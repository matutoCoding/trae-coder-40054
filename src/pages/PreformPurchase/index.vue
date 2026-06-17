<script setup lang="ts">
import { ref, computed } from 'vue'
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
  MapPin
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { PurchaseOrder, Supplier } from '@/types'

const store = useAppStore()

const activeTab = ref<'orders' | 'suppliers'>('orders')

const searchKeyword = ref('')
const statusFilter = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

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

const handleView = (order: PurchaseOrder) => {
  console.log('查看订单:', order.id)
}

const handleEdit = (order: PurchaseOrder) => {
  console.log('编辑订单:', order.id)
}

const handleDelete = (order: PurchaseOrder) => {
  if (confirm(`确定要删除采购单 ${order.id} 吗？`)) {
    const index = store.purchaseOrders.findIndex(o => o.id === order.id)
    if (index > -1) {
      store.purchaseOrders.splice(index, 1)
    }
  }
}

const handleViewSupplier = (supplier: Supplier) => {
  console.log('查看供应商:', supplier.id)
}

const handleEditSupplier = (supplier: Supplier) => {
  console.log('编辑供应商:', supplier.id)
}

const handleDeleteSupplier = (supplier: Supplier) => {
  if (confirm(`确定要删除供应商 ${supplier.name} 吗？`)) {
    const index = store.suppliers.findIndex(s => s.id === supplier.id)
    if (index > -1) {
      store.suppliers.splice(index, 1)
    }
  }
}

const handleAddOrder = () => {
  console.log('新增采购单')
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
              <tr
                v-for="order in paginatedOrders"
                :key="order.id"
                class="hover:bg-slate-50 transition-colors"
              >
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
                  <div class="flex items-center justify-center gap-2">
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
              <tr v-if="paginatedOrders.length === 0">
                <td colspan="9" class="px-4 py-12 text-center">
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
  </div>
</template>
