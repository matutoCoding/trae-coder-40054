export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  address: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplierName: string
  spec: string
  weight: number
  quantity: number
  unitPrice: number
  totalAmount: number
  orderDate: string
  expectedDate: string
  status: 'pending' | 'delivered' | 'inspecting' | 'qualified' | 'rejected'
  remark: string
}

export interface PreformInspection {
  id: string
  purchaseId: string
  purchaseSpec: string
  supplierName: string
  sampleCount: number
  qualifiedCount: number
  avgWeight: number
  minWeight: number
  maxWeight: number
  appearanceResult: 'pass' | 'fail' | 'pending'
  transparencyResult: 'pass' | 'fail' | 'pending'
  conclusion: 'qualified' | 'unqualified' | 'pending'
  inspector: string
  inspectDate: string
  remark: string
}

export interface BlowMoldingRecord {
  id: string
  machineNo: string
  moldNo: string
  productSpec: string
  heatingPower: number
  blowPressure: number
  preformTemp: number
  output: number
  defectCount: number
  startTime: string
  endTime: string
  status: 'running' | 'completed' | 'paused'
  operator: string
  remark: string
}

export interface BottleInspection {
  id: string
  blowId: string
  machineNo: string
  productSpec: string
  sampleCount: number
  qualifiedCount: number
  wallThickness: number
  minWallThickness: number
  maxWallThickness: number
  threadResult: 'pass' | 'fail' | 'pending'
  appearanceResult: 'pass' | 'fail' | 'pending'
  transparencyResult: 'pass' | 'fail' | 'pending'
  conclusion: 'qualified' | 'unqualified' | 'pending'
  inspector: string
  inspectDate: string
  remark: string
}

export interface VolumeCheck {
  id: string
  bottleInspectionId: string
  productSpec: string
  sampleCount: number
  qualifiedCount: number
  avgVolume: number
  minVolume: number
  maxVolume: number
  bottomThickness: number
  sealResult: 'pass' | 'fail' | 'pending'
  conclusion: 'qualified' | 'unqualified' | 'pending'
  inspector: string
  checkDate: string
  remark: string
}

export interface WarehouseRecord {
  id: string
  type: 'in' | 'out'
  spec: string
  quantity: number
  unit: string
  location: string
  batchNo: string
  relatedOrderId: string
  operator: string
  date: string
  remark: string
}

export interface InventoryItem {
  id: string
  spec: string
  quantity: number
  unit: string
  location: string
  lastUpdate: string
  status: 'normal' | 'low' | 'insufficient'
}

export interface Equipment {
  id: string
  name: string
  model: string
  equipmentNo: string
  type: 'blower' | 'mold' | 'inspection' | 'other'
  installDate: string
  status: 'running' | 'maintenance' | 'fault' | 'idle'
  location: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
}

export interface MaintenanceLog {
  id: string
  equipmentId: string
  equipmentName: string
  type: 'daily' | 'weekly' | 'monthly' | 'repair' | 'cleaning'
  title: string
  content: string
  result: 'pass' | 'fail' | 'pending'
  partsReplaced: string
  operator: string
  date: string
  nextDate: string
  remark: string
}

export interface DashboardStats {
  todayOutput: number
  qualifiedRate: number
  todayInspection: number
  equipmentRunning: number
  equipmentTotal: number
  pendingTasks: number
  outputTrend: { date: string; output: number; qualified: number }[]
  qualityTrend: { date: string; rate: number }[]
  moduleProgress: { name: string; completed: number; total: number }[]
}
