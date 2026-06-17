import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Supplier,
  PurchaseOrder,
  PreformInspection,
  BlowMoldingRecord,
  BottleInspection,
  VolumeCheck,
  WarehouseRecord,
  InventoryItem,
  Equipment,
  MaintenanceLog,
  DashboardStats
} from '@/types'
import {
  mockSuppliers,
  mockPurchaseOrders,
  mockPreformInspections,
  mockBlowMoldingRecords,
  mockBottleInspections,
  mockVolumeChecks,
  mockWarehouseRecords,
  mockInventoryItems,
  mockEquipments,
  mockMaintenanceLogs,
  mockDashboardStats
} from '@/mock'

export const useAppStore = defineStore('app', () => {
  const suppliers = ref<Supplier[]>(mockSuppliers)
  const purchaseOrders = ref<PurchaseOrder[]>(mockPurchaseOrders)
  const preformInspections = ref<PreformInspection[]>(mockPreformInspections)
  const blowMoldingRecords = ref<BlowMoldingRecord[]>(mockBlowMoldingRecords)
  const bottleInspections = ref<BottleInspection[]>(mockBottleInspections)
  const volumeChecks = ref<VolumeCheck[]>(mockVolumeChecks)
  const warehouseRecords = ref<WarehouseRecord[]>(mockWarehouseRecords)
  const inventoryItems = ref<InventoryItem[]>(mockInventoryItems)
  const equipments = ref<Equipment[]>(mockEquipments)
  const maintenanceLogs = ref<MaintenanceLog[]>(mockMaintenanceLogs)
  const dashboardStats = ref<DashboardStats>(mockDashboardStats)

  const sidebarCollapsed = ref(false)

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `S${String(suppliers.value.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0]
    }
    suppliers.value.unshift(newSupplier)
    return newSupplier
  }

  const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id'>) => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: `PO${Date.now()}`
    }
    purchaseOrders.value.unshift(newOrder)
    return newOrder
  }

  const addPreformInspection = (inspection: Omit<PreformInspection, 'id'>) => {
    const newInspection: PreformInspection = {
      ...inspection,
      id: `PI${Date.now()}`
    }
    preformInspections.value.unshift(newInspection)
    return newInspection
  }

  const addBlowMoldingRecord = (record: Omit<BlowMoldingRecord, 'id'>) => {
    const newRecord: BlowMoldingRecord = {
      ...record,
      id: `BM${Date.now()}`
    }
    blowMoldingRecords.value.unshift(newRecord)
    return newRecord
  }

  const addBottleInspection = (inspection: Omit<BottleInspection, 'id'>) => {
    const newInspection: BottleInspection = {
      ...inspection,
      id: `BI${Date.now()}`
    }
    bottleInspections.value.unshift(newInspection)
    return newInspection
  }

  const addVolumeCheck = (check: Omit<VolumeCheck, 'id'>) => {
    const newCheck: VolumeCheck = {
      ...check,
      id: `VC${Date.now()}`
    }
    volumeChecks.value.unshift(newCheck)
    return newCheck
  }

  const addWarehouseRecord = (record: Omit<WarehouseRecord, 'id'>) => {
    const newRecord: WarehouseRecord = {
      ...record,
      id: `WH${Date.now()}`
    }
    warehouseRecords.value.unshift(newRecord)
    return newRecord
  }

  const addMaintenanceLog = (log: Omit<MaintenanceLog, 'id'>) => {
    const newLog: MaintenanceLog = {
      ...log,
      id: `ML${Date.now()}`
    }
    maintenanceLogs.value.unshift(newLog)
    return newLog
  }

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    const order = purchaseOrders.value.find(o => o.id === id)
    if (order) {
      order.status = status
    }
  }

  const runningEquipments = computed(() => 
    equipments.value.filter(e => e.status === 'running').length
  )

  const pendingInspections = computed(() => 
    preformInspections.value.filter(i => i.conclusion === 'pending').length +
    bottleInspections.value.filter(i => i.conclusion === 'pending').length +
    volumeChecks.value.filter(v => v.conclusion === 'pending').length
  )

  return {
    suppliers,
    purchaseOrders,
    preformInspections,
    blowMoldingRecords,
    bottleInspections,
    volumeChecks,
    warehouseRecords,
    inventoryItems,
    equipments,
    maintenanceLogs,
    dashboardStats,
    sidebarCollapsed,
    toggleSidebar,
    addSupplier,
    addPurchaseOrder,
    addPreformInspection,
    addBlowMoldingRecord,
    addBottleInspection,
    addVolumeCheck,
    addWarehouseRecord,
    addMaintenanceLog,
    updatePurchaseOrderStatus,
    runningEquipments,
    pendingInspections
  }
})
