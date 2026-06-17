import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
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

const STORAGE_KEY = 'pet-blow-molding-system-data'

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load from storage:', e)
  }
  return defaultValue
}

export const useAppStore = defineStore('app', () => {
  const suppliers = ref<Supplier[]>(loadFromStorage('suppliers', mockSuppliers))
  const purchaseOrders = ref<PurchaseOrder[]>(loadFromStorage('purchaseOrders', mockPurchaseOrders))
  const preformInspections = ref<PreformInspection[]>(loadFromStorage('preformInspections', mockPreformInspections))
  const blowMoldingRecords = ref<BlowMoldingRecord[]>(loadFromStorage('blowMoldingRecords', mockBlowMoldingRecords))
  const bottleInspections = ref<BottleInspection[]>(loadFromStorage('bottleInspections', mockBottleInspections))
  const volumeChecks = ref<VolumeCheck[]>(loadFromStorage('volumeChecks', mockVolumeChecks))
  const warehouseRecords = ref<WarehouseRecord[]>(loadFromStorage('warehouseRecords', mockWarehouseRecords))
  const inventoryItems = ref<InventoryItem[]>(loadFromStorage('inventoryItems', mockInventoryItems))
  const equipments = ref<Equipment[]>(loadFromStorage('equipments', mockEquipments))
  const maintenanceLogs = ref<MaintenanceLog[]>(loadFromStorage('maintenanceLogs', mockMaintenanceLogs))
  const dashboardStats = ref<DashboardStats>(loadFromStorage('dashboardStats', mockDashboardStats))

  const sidebarCollapsed = ref(false)
  const isInitialized = ref(false)

  const saveToStorage = () => {
    if (!isInitialized.value) return
    try {
      const data = {
        suppliers: suppliers.value,
        purchaseOrders: purchaseOrders.value,
        preformInspections: preformInspections.value,
        blowMoldingRecords: blowMoldingRecords.value,
        bottleInspections: bottleInspections.value,
        volumeChecks: volumeChecks.value,
        warehouseRecords: warehouseRecords.value,
        inventoryItems: inventoryItems.value,
        equipments: equipments.value,
        maintenanceLogs: maintenanceLogs.value,
        dashboardStats: dashboardStats.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save to storage:', e)
    }
  }

  const initFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.suppliers) suppliers.value = data.suppliers
        if (data.purchaseOrders) purchaseOrders.value = data.purchaseOrders
        if (data.preformInspections) preformInspections.value = data.preformInspections
        if (data.blowMoldingRecords) blowMoldingRecords.value = data.blowMoldingRecords
        if (data.bottleInspections) bottleInspections.value = data.bottleInspections
        if (data.volumeChecks) volumeChecks.value = data.volumeChecks
        if (data.warehouseRecords) warehouseRecords.value = data.warehouseRecords
        if (data.inventoryItems) inventoryItems.value = data.inventoryItems
        if (data.equipments) equipments.value = data.equipments
        if (data.maintenanceLogs) maintenanceLogs.value = data.maintenanceLogs
        if (data.dashboardStats) dashboardStats.value = data.dashboardStats
      }
    } catch (e) {
      console.warn('Failed to init from storage:', e)
    }
    isInitialized.value = true
  }

  initFromStorage()

  watch(
    [suppliers, purchaseOrders, preformInspections, blowMoldingRecords,
     bottleInspections, volumeChecks, warehouseRecords, inventoryItems,
     equipments, maintenanceLogs, dashboardStats],
    () => {
      saveToStorage()
    },
    { deep: true }
  )

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const resetAllData = () => {
    suppliers.value = [...mockSuppliers]
    purchaseOrders.value = [...mockPurchaseOrders]
    preformInspections.value = [...mockPreformInspections]
    blowMoldingRecords.value = [...mockBlowMoldingRecords]
    bottleInspections.value = [...mockBottleInspections]
    volumeChecks.value = [...mockVolumeChecks]
    warehouseRecords.value = [...mockWarehouseRecords]
    inventoryItems.value = [...mockInventoryItems]
    equipments.value = [...mockEquipments]
    maintenanceLogs.value = [...mockMaintenanceLogs]
    dashboardStats.value = { ...mockDashboardStats }
    localStorage.removeItem(STORAGE_KEY)
    isInitialized.value = true
  }

  const generateId = (prefix: string) => {
    const date = new Date()
    const dateStr = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}${dateStr}${random}`
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

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    const index = suppliers.value.findIndex(s => s.id === id)
    if (index !== -1) {
      suppliers.value[index] = { ...suppliers.value[index], ...data }
      return suppliers.value[index]
    }
    return null
  }

  const deleteSupplier = (id: string) => {
    const index = suppliers.value.findIndex(s => s.id === id)
    if (index !== -1) {
      suppliers.value.splice(index, 1)
      return true
    }
    return false
  }

  const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id'>) => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: generateId('PO')
    }
    purchaseOrders.value.unshift(newOrder)
    updateDashboardStats()
    return newOrder
  }

  const updatePurchaseOrder = (id: string, data: Partial<PurchaseOrder>) => {
    const index = purchaseOrders.value.findIndex(o => o.id === id)
    if (index !== -1) {
      purchaseOrders.value[index] = { ...purchaseOrders.value[index], ...data }
      updateDashboardStats()
      return purchaseOrders.value[index]
    }
    return null
  }

  const deletePurchaseOrder = (id: string) => {
    const index = purchaseOrders.value.findIndex(o => o.id === id)
    if (index !== -1) {
      purchaseOrders.value.splice(index, 1)
      updateDashboardStats()
      return true
    }
    return false
  }

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    const order = purchaseOrders.value.find(o => o.id === id)
    if (order) {
      order.status = status
      updateDashboardStats()
    }
  }

  const deliverPurchaseOrder = (id: string) => {
    const order = purchaseOrders.value.find(o => o.id === id)
    if (order && order.status === 'pending') {
      order.status = 'delivered'
      updateDashboardStats()
      return true
    }
    return false
  }

  const createInspectionFromPurchase = (purchaseId: string) => {
    const order = purchaseOrders.value.find(o => o.id === purchaseId)
    if (!order) return null

    order.status = 'inspecting'

    const newInspection: PreformInspection = {
      id: generateId('PI'),
      purchaseId: order.id,
      purchaseSpec: order.spec,
      supplierName: order.supplierName,
      sampleCount: 0,
      qualifiedCount: 0,
      avgWeight: order.weight,
      minWeight: order.weight * 0.95,
      maxWeight: order.weight * 1.05,
      appearanceResult: 'pending',
      transparencyResult: 'pending',
      conclusion: 'pending',
      inspector: '',
      inspectDate: new Date().toISOString().split('T')[0],
      remark: ''
    }
    preformInspections.value.unshift(newInspection)
    updateDashboardStats()
    return newInspection
  }

  const addPreformInspection = (inspection: Omit<PreformInspection, 'id'>) => {
    const newInspection: PreformInspection = {
      ...inspection,
      id: generateId('PI')
    }
    preformInspections.value.unshift(newInspection)
    updateDashboardStats()
    return newInspection
  }

  const updatePreformInspection = (id: string, data: Partial<PreformInspection>) => {
    const index = preformInspections.value.findIndex(i => i.id === id)
    if (index !== -1) {
      preformInspections.value[index] = { ...preformInspections.value[index], ...data }
      
      if (preformInspections.value[index].conclusion !== 'pending') {
        const purchaseOrder = purchaseOrders.value.find(
          o => o.id === preformInspections.value[index].purchaseId
        )
        if (purchaseOrder) {
          purchaseOrder.status = preformInspections.value[index].conclusion === 'qualified' ? 'qualified' : 'rejected'
        }
      }
      
      updateDashboardStats()
      return preformInspections.value[index]
    }
    return null
  }

  const deletePreformInspection = (id: string) => {
    const index = preformInspections.value.findIndex(i => i.id === id)
    if (index !== -1) {
      preformInspections.value.splice(index, 1)
      updateDashboardStats()
      return true
    }
    return false
  }

  const addBlowMoldingRecord = (record: Omit<BlowMoldingRecord, 'id'>) => {
    const newRecord: BlowMoldingRecord = {
      ...record,
      id: generateId('BM')
    }
    blowMoldingRecords.value.unshift(newRecord)
    updateDashboardStats()
    return newRecord
  }

  const updateBlowMoldingRecord = (id: string, data: Partial<BlowMoldingRecord>) => {
    const index = blowMoldingRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      blowMoldingRecords.value[index] = { ...blowMoldingRecords.value[index], ...data }
      updateDashboardStats()
      return blowMoldingRecords.value[index]
    }
    return null
  }

  const deleteBlowMoldingRecord = (id: string) => {
    const index = blowMoldingRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      blowMoldingRecords.value.splice(index, 1)
      updateDashboardStats()
      return true
    }
    return false
  }

  const startBlowMolding = (id: string) => {
    const record = blowMoldingRecords.value.find(r => r.id === id)
    if (record && record.status === 'paused') {
      record.status = 'running'
      const equipment = equipments.value.find(e => e.equipmentNo === record.machineNo)
      if (equipment) {
        equipment.status = 'running'
      }
      updateDashboardStats()
      return true
    }
    return false
  }

  const pauseBlowMolding = (id: string) => {
    const record = blowMoldingRecords.value.find(r => r.id === id)
    if (record && record.status === 'running') {
      record.status = 'paused'
      const equipment = equipments.value.find(e => e.equipmentNo === record.machineNo)
      if (equipment) {
        equipment.status = 'idle'
      }
      updateDashboardStats()
      return true
    }
    return false
  }

  const completeBlowMolding = (id: string) => {
    const record = blowMoldingRecords.value.find(r => r.id === id)
    if (record) {
      record.status = 'completed'
      record.endTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      const equipment = equipments.value.find(e => e.equipmentNo === record.machineNo)
      if (equipment) {
        equipment.status = 'idle'
      }
      updateDashboardStats()
      return true
    }
    return false
  }

  const createBlowMoldingFromQualified = (purchaseId: string, machineNo: string) => {
    const order = purchaseOrders.value.find(o => o.id === purchaseId)
    const inspection = preformInspections.value.find(i => i.purchaseId === purchaseId)
    
    if (!order || !inspection || inspection.conclusion !== 'qualified') {
      return null
    }

    const equipment = equipments.value.find(e => e.equipmentNo === machineNo)
    if (equipment) {
      equipment.status = 'running'
    }

    const newRecord: BlowMoldingRecord = {
      id: generateId('BM'),
      machineNo,
      moldNo: '',
      productSpec: order.spec,
      heatingPower: 85,
      blowPressure: 2.8,
      preformTemp: 105,
      output: 0,
      defectCount: 0,
      startTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      endTime: '',
      status: 'running',
      operator: '',
      remark: ''
    }
    blowMoldingRecords.value.unshift(newRecord)
    updateDashboardStats()
    return newRecord
  }

  const addBottleInspection = (inspection: Omit<BottleInspection, 'id'>) => {
    const newInspection: BottleInspection = {
      ...inspection,
      id: generateId('BI')
    }
    bottleInspections.value.unshift(newInspection)
    updateDashboardStats()
    return newInspection
  }

  const updateBottleInspection = (id: string, data: Partial<BottleInspection>) => {
    const index = bottleInspections.value.findIndex(i => i.id === id)
    if (index !== -1) {
      bottleInspections.value[index] = { ...bottleInspections.value[index], ...data }
      updateDashboardStats()
      return bottleInspections.value[index]
    }
    return null
  }

  const deleteBottleInspection = (id: string) => {
    const index = bottleInspections.value.findIndex(i => i.id === id)
    if (index !== -1) {
      bottleInspections.value.splice(index, 1)
      updateDashboardStats()
      return true
    }
    return false
  }

  const addVolumeCheck = (check: Omit<VolumeCheck, 'id'>) => {
    const newCheck: VolumeCheck = {
      ...check,
      id: generateId('VC')
    }
    volumeChecks.value.unshift(newCheck)
    updateDashboardStats()
    return newCheck
  }

  const updateVolumeCheck = (id: string, data: Partial<VolumeCheck>) => {
    const index = volumeChecks.value.findIndex(v => v.id === id)
    if (index !== -1) {
      volumeChecks.value[index] = { ...volumeChecks.value[index], ...data }
      updateDashboardStats()
      return volumeChecks.value[index]
    }
    return null
  }

  const deleteVolumeCheck = (id: string) => {
    const index = volumeChecks.value.findIndex(v => v.id === id)
    if (index !== -1) {
      volumeChecks.value.splice(index, 1)
      updateDashboardStats()
      return true
    }
    return false
  }

  const stockIn = (spec: string, quantity: number, location: string, batchNo: string, relatedOrderId: string, operator: string, remark: string = '') => {
    const existing = inventoryItems.value.find(item => item.spec === spec)
    
    if (existing) {
      existing.quantity += quantity
      existing.lastUpdate = new Date().toISOString().split('T')[0]
      if (existing.quantity > 10000) {
        existing.status = 'normal'
      } else if (existing.quantity > 1000) {
        existing.status = 'low'
      } else {
        existing.status = 'insufficient'
      }
    } else {
      const newItem: InventoryItem = {
        id: generateId('INV'),
        spec,
        quantity,
        unit: '只',
        location,
        lastUpdate: new Date().toISOString().split('T')[0],
        status: quantity > 10000 ? 'normal' : quantity > 1000 ? 'low' : 'insufficient'
      }
      inventoryItems.value.push(newItem)
    }

    const record: WarehouseRecord = {
      id: generateId('WH'),
      type: 'in',
      spec,
      quantity,
      unit: '只',
      location,
      batchNo,
      relatedOrderId,
      operator,
      date: new Date().toISOString().split('T')[0],
      remark
    }
    warehouseRecords.value.unshift(record)
    updateDashboardStats()
    return record
  }

  const stockOut = (spec: string, quantity: number, location: string, batchNo: string, relatedOrderId: string, operator: string, remark: string = '') => {
    const existing = inventoryItems.value.find(item => item.spec === spec)
    
    if (!existing || existing.quantity < quantity) {
      return { success: false, message: '库存不足，无法出库' }
    }

    existing.quantity -= quantity
    existing.lastUpdate = new Date().toISOString().split('T')[0]
    
    if (existing.quantity > 10000) {
      existing.status = 'normal'
    } else if (existing.quantity > 1000) {
      existing.status = 'low'
    } else {
      existing.status = 'insufficient'
    }

    const record: WarehouseRecord = {
      id: generateId('WH'),
      type: 'out',
      spec,
      quantity,
      unit: '只',
      location,
      batchNo,
      relatedOrderId,
      operator,
      date: new Date().toISOString().split('T')[0],
      remark
    }
    warehouseRecords.value.unshift(record)
    updateDashboardStats()
    return { success: true, record }
  }

  const addWarehouseRecord = (record: Omit<WarehouseRecord, 'id'>) => {
    const newRecord: WarehouseRecord = {
      ...record,
      id: generateId('WH')
    }
    warehouseRecords.value.unshift(newRecord)
    updateDashboardStats()
    return newRecord
  }

  const updateEquipment = (id: string, data: Partial<Equipment>) => {
    const index = equipments.value.findIndex(e => e.id === id)
    if (index !== -1) {
      equipments.value[index] = { ...equipments.value[index], ...data }
      updateDashboardStats()
      return equipments.value[index]
    }
    return null
  }

  const addMaintenanceLog = (log: Omit<MaintenanceLog, 'id'>) => {
    const newLog: MaintenanceLog = {
      ...log,
      id: generateId('ML')
    }
    maintenanceLogs.value.unshift(newLog)

    if (log.type === 'repair' || log.type === 'cleaning' || log.type === 'weekly') {
      const equipment = equipments.value.find(e => e.id === log.equipmentId)
      if (equipment) {
        equipment.lastMaintenanceDate = log.date
        if (log.nextDate) {
          equipment.nextMaintenanceDate = log.nextDate
        }
      }
    }

    return newLog
  }

  const updateMaintenanceLog = (id: string, data: Partial<MaintenanceLog>) => {
    const index = maintenanceLogs.value.findIndex(l => l.id === id)
    if (index !== -1) {
      maintenanceLogs.value[index] = { ...maintenanceLogs.value[index], ...data }
      return maintenanceLogs.value[index]
    }
    return null
  }

  const deleteMaintenanceLog = (id: string) => {
    const index = maintenanceLogs.value.findIndex(l => l.id === id)
    if (index !== -1) {
      maintenanceLogs.value.splice(index, 1)
      return true
    }
    return false
  }

  const getMaintenanceLogsByEquipment = (equipmentId: string) => {
    return maintenanceLogs.value.filter(l => l.equipmentId === equipmentId)
  }

  const updateDashboardStats = () => {
    const today = new Date().toISOString().split('T')[0]
    
    const todayRecords = blowMoldingRecords.value.filter(
      r => r.startTime && r.startTime.startsWith(today)
    )
    const todayOutput = todayRecords.reduce((sum, r) => sum + r.output, 0)
    
    const totalOutput = todayRecords.reduce((sum, r) => sum + r.output, 0)
    const totalDefect = todayRecords.reduce((sum, r) => sum + r.defectCount, 0)
    const qualifiedRate = totalOutput > 0 
      ? Math.round(((totalOutput - totalDefect) / totalOutput) * 1000) / 10 
      : 0

    const todayInspections = preformInspections.value.filter(
      i => i.inspectDate === today
    ).length + bottleInspections.value.filter(
      i => i.inspectDate === today
    ).length + volumeChecks.value.filter(
      v => v.checkDate === today
    ).length

    const runningCount = equipments.value.filter(e => e.status === 'running').length
    const totalEquipment = equipments.value.length

    const pendingCount = preformInspections.value.filter(i => i.conclusion === 'pending').length +
      bottleInspections.value.filter(i => i.conclusion === 'pending').length +
      volumeChecks.value.filter(v => v.conclusion === 'pending').length

    dashboardStats.value = {
      ...dashboardStats.value,
      todayOutput,
      qualifiedRate,
      todayInspection: todayInspections,
      equipmentRunning: runningCount,
      equipmentTotal: totalEquipment,
      pendingTasks: pendingCount
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

  const qualifiedPreformOrders = computed(() => 
    purchaseOrders.value.filter(o => o.status === 'qualified')
  )

  const runningBlowMolding = computed(() => 
    blowMoldingRecords.value.filter(r => r.status === 'running')
  )

  const completedBlowMolding = computed(() => 
    blowMoldingRecords.value.filter(r => r.status === 'completed')
  )

  const getTraceability = (type: string, id: string) => {
    const result: any = {
      purchase: null,
      preformInspection: null,
      blowMolding: null,
      bottleInspection: null,
      volumeCheck: null,
      warehouseRecords: []
    }

    switch (type) {
      case 'purchase': {
        const purchase = purchaseOrders.value.find(o => o.id === id)
        if (purchase) {
          result.purchase = purchase
          result.preformInspection = preformInspections.value.find(i => i.purchaseId === id) || null
          if (result.preformInspection) {
            result.blowMolding = blowMoldingRecords.value.find(r => r.productSpec === purchase.spec && r.startTime?.startsWith(result.preformInspection.inspectDate)) || null
            if (result.blowMolding) {
              result.bottleInspection = bottleInspections.value.find(i => i.blowId === result.blowMolding!.id) || null
              if (result.bottleInspection) {
                result.volumeCheck = volumeChecks.value.find(v => v.bottleInspectionId === result.bottleInspection!.id) || null
              }
            }
          }
          result.warehouseRecords = warehouseRecords.value.filter(r => r.spec === purchase.spec && r.relatedOrderId?.startsWith('PO'))
        }
        break
      }
      case 'preformInspection': {
        const inspection = preformInspections.value.find(i => i.id === id)
        if (inspection) {
          result.preformInspection = inspection
          result.purchase = purchaseOrders.value.find(o => o.id === inspection.purchaseId) || null
          result.blowMolding = blowMoldingRecords.value.find(r => 
            r.productSpec === inspection.purchaseSpec && 
            r.startTime?.startsWith(inspection.inspectDate)
          ) || null
          if (result.blowMolding) {
            result.bottleInspection = bottleInspections.value.find(i => i.blowId === result.blowMolding!.id) || null
            if (result.bottleInspection) {
              result.volumeCheck = volumeChecks.value.find(v => v.bottleInspectionId === result.bottleInspection!.id) || null
            }
          }
          if (result.purchase) {
            result.warehouseRecords = warehouseRecords.value.filter(r => r.spec === result.purchase.spec && r.type === 'in')
          }
        }
        break
      }
      case 'blowMolding': {
        const blow = blowMoldingRecords.value.find(r => r.id === id)
        if (blow) {
          result.blowMolding = blow
          const inspection = preformInspections.value.find(i => 
            i.purchaseSpec === blow.productSpec && 
            blow.startTime?.startsWith(i.inspectDate)
          )
          result.preformInspection = inspection || null
          if (inspection) {
            result.purchase = purchaseOrders.value.find(o => o.id === inspection.purchaseId) || null
          }
          result.bottleInspection = bottleInspections.value.find(i => i.blowId === blow.id) || null
          if (result.bottleInspection) {
            result.volumeCheck = volumeChecks.value.find(v => v.bottleInspectionId === result.bottleInspection!.id) || null
          }
          result.warehouseRecords = warehouseRecords.value.filter(r => r.spec === blow.productSpec)
        }
        break
      }
      case 'bottleInspection': {
        const bottle = bottleInspections.value.find(i => i.id === id)
        if (bottle) {
          result.bottleInspection = bottle
          result.blowMolding = blowMoldingRecords.value.find(r => r.id === bottle.blowId) || null
          if (result.blowMolding) {
            const inspection = preformInspections.value.find(i => 
              i.purchaseSpec === result.blowMolding!.productSpec && 
              result.blowMolding!.startTime?.startsWith(i.inspectDate)
            )
            result.preformInspection = inspection || null
            if (inspection) {
              result.purchase = purchaseOrders.value.find(o => o.id === inspection.purchaseId) || null
            }
          }
          result.volumeCheck = volumeChecks.value.find(v => v.bottleInspectionId === bottle.id) || null
          result.warehouseRecords = warehouseRecords.value.filter(r => r.spec === bottle.productSpec)
        }
        break
      }
      case 'volumeCheck': {
        const volume = volumeChecks.value.find(v => v.id === id)
        if (volume) {
          result.volumeCheck = volume
          result.bottleInspection = bottleInspections.value.find(i => i.id === volume.bottleInspectionId) || null
          if (result.bottleInspection) {
            result.blowMolding = blowMoldingRecords.value.find(r => r.id === result.bottleInspection!.blowId) || null
            if (result.blowMolding) {
              const inspection = preformInspections.value.find(i => 
                i.purchaseSpec === result.blowMolding!.productSpec && 
                result.blowMolding!.startTime?.startsWith(i.inspectDate)
              )
              result.preformInspection = inspection || null
              if (inspection) {
                result.purchase = purchaseOrders.value.find(o => o.id === inspection.purchaseId) || null
              }
            }
          }
          result.warehouseRecords = warehouseRecords.value.filter(r => r.spec === volume.productSpec)
        }
        break
      }
      case 'warehouse': {
        const warehouse = warehouseRecords.value.find(r => r.id === id)
        if (warehouse) {
          result.warehouseRecords = [warehouse]
          result.volumeCheck = volumeChecks.value.find(v => v.productSpec === warehouse.spec) || null
          if (result.volumeCheck) {
            result.bottleInspection = bottleInspections.value.find(i => i.id === result.volumeCheck!.bottleInspectionId) || null
            if (result.bottleInspection) {
              result.blowMolding = blowMoldingRecords.value.find(r => r.id === result.bottleInspection!.blowId) || null
              if (result.blowMolding) {
                const inspection = preformInspections.value.find(i => 
                  i.purchaseSpec === result.blowMolding!.productSpec && 
                  result.blowMolding!.startTime?.startsWith(i.inspectDate)
                )
                result.preformInspection = inspection || null
                if (inspection) {
                  result.purchase = purchaseOrders.value.find(o => o.id === inspection.purchaseId) || null
                }
              }
            }
          }
        }
        break
      }
    }

    return result
  }

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
    resetAllData,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    updatePurchaseOrderStatus,
    deliverPurchaseOrder,
    createInspectionFromPurchase,
    addPreformInspection,
    updatePreformInspection,
    deletePreformInspection,
    addBlowMoldingRecord,
    updateBlowMoldingRecord,
    deleteBlowMoldingRecord,
    startBlowMolding,
    pauseBlowMolding,
    completeBlowMolding,
    createBlowMoldingFromQualified,
    addBottleInspection,
    updateBottleInspection,
    deleteBottleInspection,
    addVolumeCheck,
    updateVolumeCheck,
    deleteVolumeCheck,
    stockIn,
    stockOut,
    addWarehouseRecord,
    updateEquipment,
    addMaintenanceLog,
    updateMaintenanceLog,
    deleteMaintenanceLog,
    getMaintenanceLogsByEquipment,
    getTraceability,
    updateDashboardStats,
    runningEquipments,
    pendingInspections,
    qualifiedPreformOrders,
    runningBlowMolding,
    completedBlowMolding
  }
})
