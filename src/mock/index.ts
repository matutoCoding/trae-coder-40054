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

const generateId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const mockSuppliers: Supplier[] = [
  {
    id: 'S001',
    name: '华润聚酯材料有限公司',
    contact: '张经理',
    phone: '13800138001',
    address: '江苏省苏州市工业园区星湖街200号',
    status: 'active',
    createdAt: '2025-01-15'
  },
  {
    id: 'S002',
    name: '浙江万凯新材料股份有限公司',
    contact: '李总',
    phone: '13900139002',
    address: '浙江省海宁市尖山新区滨海路28号',
    status: 'active',
    createdAt: '2025-02-20'
  },
  {
    id: 'S003',
    name: '珠海华润包装材料有限公司',
    contact: '王工',
    phone: '13700137003',
    address: '广东省珠海市金湾区红旗镇',
    status: 'active',
    createdAt: '2025-03-10'
  },
  {
    id: 'S004',
    name: '江苏三房巷集团',
    contact: '赵经理',
    phone: '13600136004',
    address: '江苏省无锡市江阴市周庄镇',
    status: 'inactive',
    createdAt: '2025-04-05'
  }
]

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO20260601001',
    supplierId: 'S001',
    supplierName: '华润聚酯材料有限公司',
    spec: '32g 28口瓶坯',
    weight: 32,
    quantity: 50000,
    unitPrice: 0.45,
    totalAmount: 22500,
    orderDate: '2026-06-01',
    expectedDate: '2026-06-05',
    status: 'qualified',
    remark: '矿泉水瓶用'
  },
  {
    id: 'PO20260603002',
    supplierId: 'S002',
    supplierName: '浙江万凯新材料股份有限公司',
    spec: '28g 28口瓶坯',
    weight: 28,
    quantity: 80000,
    unitPrice: 0.42,
    totalAmount: 33600,
    orderDate: '2026-06-03',
    expectedDate: '2026-06-08',
    status: 'inspecting',
    remark: '碳酸饮料瓶用'
  },
  {
    id: 'PO20260605003',
    supplierId: 'S001',
    supplierName: '华润聚酯材料有限公司',
    spec: '45g 30口瓶坯',
    weight: 45,
    quantity: 30000,
    unitPrice: 0.62,
    totalAmount: 18600,
    orderDate: '2026-06-05',
    expectedDate: '2026-06-10',
    status: 'delivered',
    remark: '食用油瓶用'
  },
  {
    id: 'PO20260610004',
    supplierId: 'S003',
    supplierName: '珠海华润包装材料有限公司',
    spec: '18g 24口瓶坯',
    weight: 18,
    quantity: 100000,
    unitPrice: 0.28,
    totalAmount: 28000,
    orderDate: '2026-06-10',
    expectedDate: '2026-06-15',
    status: 'pending',
    remark: '小瓶水用'
  },
  {
    id: 'PO20260612005',
    supplierId: 'S002',
    supplierName: '浙江万凯新材料股份有限公司',
    spec: '32g 28口瓶坯',
    weight: 32,
    quantity: 60000,
    unitPrice: 0.44,
    totalAmount: 26400,
    orderDate: '2026-06-12',
    expectedDate: '2026-06-18',
    status: 'pending',
    remark: '补单'
  },
  {
    id: 'PO20260615006',
    supplierId: 'S003',
    supplierName: '珠海华润包装材料有限公司',
    spec: '60g 38口瓶坯',
    weight: 60,
    quantity: 20000,
    unitPrice: 0.85,
    totalAmount: 17000,
    orderDate: '2026-06-15',
    expectedDate: '2026-06-20',
    status: 'rejected',
    remark: '大桶水瓶用，抽检不合格'
  }
]

export const mockPreformInspections: PreformInspection[] = [
  {
    id: 'PI20260605001',
    purchaseId: 'PO20260601001',
    purchaseSpec: '32g 28口瓶坯',
    supplierName: '华润聚酯材料有限公司',
    sampleCount: 200,
    qualifiedCount: 195,
    avgWeight: 31.95,
    minWeight: 31.5,
    maxWeight: 32.4,
    appearanceResult: 'pass',
    transparencyResult: 'pass',
    conclusion: 'qualified',
    inspector: '李质检',
    inspectDate: '2026-06-05',
    remark: '重量偏差在允许范围内，外观良好'
  },
  {
    id: 'PI20260608002',
    purchaseId: 'PO20260603002',
    purchaseSpec: '28g 28口瓶坯',
    supplierName: '浙江万凯新材料股份有限公司',
    sampleCount: 250,
    qualifiedCount: 240,
    avgWeight: 27.8,
    minWeight: 27.2,
    maxWeight: 28.3,
    appearanceResult: 'pass',
    transparencyResult: 'pending',
    conclusion: 'pending',
    inspector: '王质检',
    inspectDate: '2026-06-08',
    remark: '正在检验中'
  },
  {
    id: 'PI20260610003',
    purchaseId: 'PO20260615006',
    purchaseSpec: '60g 38口瓶坯',
    supplierName: '珠海华润包装材料有限公司',
    sampleCount: 100,
    qualifiedCount: 82,
    avgWeight: 59.2,
    minWeight: 58.1,
    maxWeight: 60.5,
    appearanceResult: 'fail',
    transparencyResult: 'fail',
    conclusion: 'unqualified',
    inspector: '张质检',
    inspectDate: '2026-06-16',
    remark: '瓶坯有明显发黄，透明度不合格，做退货处理'
  }
]

export const mockBlowMoldingRecords: BlowMoldingRecord[] = [
  {
    id: 'BM20260617001',
    machineNo: 'BM-01',
    moldNo: 'M-28口-01',
    productSpec: '500ml 矿泉水瓶',
    heatingPower: 85,
    blowPressure: 2.8,
    preformTemp: 105,
    output: 12500,
    defectCount: 125,
    startTime: '2026-06-17 08:00',
    endTime: '2026-06-17 16:00',
    status: 'completed',
    operator: '陈师傅',
    remark: '正常生产'
  },
  {
    id: 'BM20260617002',
    machineNo: 'BM-02',
    moldNo: 'M-28口-02',
    productSpec: '350ml 汽水瓶',
    heatingPower: 82,
    blowPressure: 3.2,
    preformTemp: 108,
    output: 8600,
    defectCount: 95,
    startTime: '2026-06-17 08:00',
    endTime: '2026-06-17 16:00',
    status: 'running',
    operator: '刘师傅',
    remark: '生产中'
  },
  {
    id: 'BM20260617003',
    machineNo: 'BM-03',
    moldNo: 'M-30口-01',
    productSpec: '1.5L 食用油瓶',
    heatingPower: 90,
    blowPressure: 3.5,
    preformTemp: 110,
    output: 0,
    defectCount: 0,
    startTime: '2026-06-17 09:00',
    endTime: '',
    status: 'paused',
    operator: '赵师傅',
    remark: '设备调试中'
  },
  {
    id: 'BM20260616001',
    machineNo: 'BM-01',
    moldNo: 'M-28口-01',
    productSpec: '500ml 矿泉水瓶',
    heatingPower: 86,
    blowPressure: 2.9,
    preformTemp: 106,
    output: 12800,
    defectCount: 110,
    startTime: '2026-06-16 08:00',
    endTime: '2026-06-16 16:00',
    status: 'completed',
    operator: '陈师傅',
    remark: '产量达标'
  },
  {
    id: 'BM20260616002',
    machineNo: 'BM-02',
    moldNo: 'M-24口-01',
    productSpec: '250ml 小瓶水',
    heatingPower: 78,
    blowPressure: 2.6,
    preformTemp: 102,
    output: 15600,
    defectCount: 180,
    startTime: '2026-06-16 08:00',
    endTime: '2026-06-16 16:00',
    status: 'completed',
    operator: '刘师傅',
    remark: '小瓶产量高'
  }
]

export const mockBottleInspections: BottleInspection[] = [
  {
    id: 'BI20260617001',
    blowId: 'BM20260617001',
    machineNo: 'BM-01',
    productSpec: '500ml 矿泉水瓶',
    sampleCount: 100,
    qualifiedCount: 96,
    wallThickness: 0.35,
    minWallThickness: 0.30,
    maxWallThickness: 0.38,
    threadResult: 'pass',
    appearanceResult: 'pass',
    transparencyResult: 'pass',
    conclusion: 'qualified',
    inspector: '李质检',
    inspectDate: '2026-06-17',
    remark: '壁厚均匀，螺纹完好'
  },
  {
    id: 'BI20260617002',
    blowId: 'BM20260617002',
    machineNo: 'BM-02',
    productSpec: '350ml 汽水瓶',
    sampleCount: 80,
    qualifiedCount: 75,
    wallThickness: 0.32,
    minWallThickness: 0.28,
    maxWallThickness: 0.36,
    threadResult: 'pass',
    appearanceResult: 'pending',
    transparencyResult: 'pending',
    conclusion: 'pending',
    inspector: '王质检',
    inspectDate: '2026-06-17',
    remark: '检验进行中'
  },
  {
    id: 'BI20260616001',
    blowId: 'BM20260616001',
    machineNo: 'BM-01',
    productSpec: '500ml 矿泉水瓶',
    sampleCount: 120,
    qualifiedCount: 115,
    wallThickness: 0.34,
    minWallThickness: 0.29,
    maxWallThickness: 0.39,
    threadResult: 'pass',
    appearanceResult: 'pass',
    transparencyResult: 'pass',
    conclusion: 'qualified',
    inspector: '李质检',
    inspectDate: '2026-06-16',
    remark: '合格'
  }
]

export const mockVolumeChecks: VolumeCheck[] = [
  {
    id: 'VC20260617001',
    bottleInspectionId: 'BI20260617001',
    productSpec: '500ml 矿泉水瓶',
    sampleCount: 50,
    qualifiedCount: 49,
    avgVolume: 502.3,
    minVolume: 498.5,
    maxVolume: 506.2,
    bottomThickness: 1.2,
    sealResult: 'pass',
    conclusion: 'qualified',
    inspector: '张质检',
    checkDate: '2026-06-17',
    remark: '容量偏差在±5ml范围内，密封良好'
  },
  {
    id: 'VC20260616001',
    bottleInspectionId: 'BI20260616001',
    productSpec: '500ml 矿泉水瓶',
    sampleCount: 60,
    qualifiedCount: 58,
    avgVolume: 501.8,
    minVolume: 497.2,
    maxVolume: 505.6,
    bottomThickness: 1.18,
    sealResult: 'pass',
    conclusion: 'qualified',
    inspector: '张质检',
    checkDate: '2026-06-16',
    remark: '合格'
  }
]

export const mockWarehouseRecords: WarehouseRecord[] = [
  {
    id: 'WH20260617001',
    type: 'in',
    spec: '500ml 矿泉水瓶',
    quantity: 12000,
    unit: '只',
    location: 'A-01-03',
    batchNo: 'B20260617001',
    relatedOrderId: 'BM20260617001',
    operator: '库管员小李',
    date: '2026-06-17',
    remark: '成品入库'
  },
  {
    id: 'WH20260617002',
    type: 'in',
    spec: '32g 28口瓶坯',
    quantity: 50000,
    unit: '只',
    location: 'B-02-01',
    batchNo: 'P20260605001',
    relatedOrderId: 'PO20260601001',
    operator: '库管员小李',
    date: '2026-06-05',
    remark: '瓶坯入库'
  },
  {
    id: 'WH20260616001',
    type: 'out',
    spec: '500ml 矿泉水瓶',
    quantity: 8000,
    unit: '只',
    location: 'A-01-03',
    batchNo: 'B20260615001',
    relatedOrderId: 'SO20260616001',
    operator: '库管员小王',
    date: '2026-06-16',
    remark: '发货给XX客户'
  }
]

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'INV001',
    spec: '500ml 矿泉水瓶',
    quantity: 25600,
    unit: '只',
    location: 'A-01-03',
    lastUpdate: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'INV002',
    spec: '350ml 汽水瓶',
    quantity: 18200,
    unit: '只',
    location: 'A-02-01',
    lastUpdate: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'INV003',
    spec: '32g 28口瓶坯',
    quantity: 45000,
    unit: '只',
    location: 'B-02-01',
    lastUpdate: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'INV004',
    spec: '28g 28口瓶坯',
    quantity: 12000,
    unit: '只',
    location: 'B-01-02',
    lastUpdate: '2026-06-16',
    status: 'low'
  },
  {
    id: 'INV005',
    spec: '1.5L 食用油瓶',
    quantity: 500,
    unit: '只',
    location: 'A-03-01',
    lastUpdate: '2026-06-15',
    status: 'insufficient'
  },
  {
    id: 'INV006',
    spec: '18g 24口瓶坯',
    quantity: 80000,
    unit: '只',
    location: 'B-03-02',
    lastUpdate: '2026-06-10',
    status: 'normal'
  }
]

export const mockEquipments: Equipment[] = [
  {
    id: 'EQ001',
    name: '全自动吹瓶机',
    model: 'SBO-12',
    equipmentNo: 'BM-01',
    type: 'blower',
    installDate: '2024-03-15',
    status: 'running',
    location: '生产车间A区',
    lastMaintenanceDate: '2026-06-10',
    nextMaintenanceDate: '2026-07-10'
  },
  {
    id: 'EQ002',
    name: '全自动吹瓶机',
    model: 'SBO-12',
    equipmentNo: 'BM-02',
    type: 'blower',
    installDate: '2024-03-15',
    status: 'running',
    location: '生产车间A区',
    lastMaintenanceDate: '2026-06-08',
    nextMaintenanceDate: '2026-07-08'
  },
  {
    id: 'EQ003',
    name: '全自动吹瓶机',
    model: 'SBO-8',
    equipmentNo: 'BM-03',
    type: 'blower',
    installDate: '2023-08-20',
    status: 'maintenance',
    location: '生产车间B区',
    lastMaintenanceDate: '2026-06-15',
    nextMaintenanceDate: '2026-07-15'
  },
  {
    id: 'EQ004',
    name: '瓶坯检验台',
    model: 'PT-200',
    equipmentNo: 'IN-01',
    type: 'inspection',
    installDate: '2024-05-10',
    status: 'running',
    location: '质检室',
    lastMaintenanceDate: '2026-06-01',
    nextMaintenanceDate: '2026-07-01'
  },
  {
    id: 'EQ005',
    name: '壁厚测厚仪',
    model: 'TT-300',
    equipmentNo: 'IN-02',
    type: 'inspection',
    installDate: '2024-06-01',
    status: 'running',
    location: '质检室',
    lastMaintenanceDate: '2026-05-20',
    nextMaintenanceDate: '2026-06-20'
  },
  {
    id: 'M001',
    name: '28口矿泉水瓶模具',
    model: 'M-28-500',
    equipmentNo: 'M-28口-01',
    type: 'mold',
    installDate: '2024-03-15',
    status: 'running',
    location: '生产车间A区',
    lastMaintenanceDate: '2026-06-12',
    nextMaintenanceDate: '2026-07-12'
  },
  {
    id: 'M002',
    name: '28口汽水瓶模具',
    model: 'M-28-350',
    equipmentNo: 'M-28口-02',
    type: 'mold',
    installDate: '2024-09-01',
    status: 'idle',
    location: '模具仓库',
    lastMaintenanceDate: '2026-06-05',
    nextMaintenanceDate: '2026-07-05'
  }
]

export const mockMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'ML20260617001',
    equipmentId: 'EQ001',
    equipmentName: '全自动吹瓶机 BM-01',
    type: 'daily',
    title: '每日点检',
    content: '1. 检查加热灯管是否正常\n2. 检查气压系统是否漏气\n3. 清洁设备表面\n4. 检查安全门开关',
    result: 'pass',
    partsReplaced: '',
    operator: '陈师傅',
    date: '2026-06-17',
    nextDate: '2026-06-18',
    remark: '设备运行正常'
  },
  {
    id: 'ML20260615001',
    equipmentId: 'EQ003',
    equipmentName: '全自动吹瓶机 BM-03',
    type: 'repair',
    title: '加热系统维修',
    content: '更换第3、5、7号加热灯管，检查加热变压器',
    result: 'pass',
    partsReplaced: '加热灯管 x3',
    operator: '维修组-王工',
    date: '2026-06-15',
    nextDate: '',
    remark: '维修后设备运行正常'
  },
  {
    id: 'ML20260612001',
    equipmentId: 'M001',
    equipmentName: '28口矿泉水瓶模具',
    type: 'cleaning',
    title: '模具清洁保养',
    content: '1. 拆解模具\n2. 超声波清洗型腔\n3. 检查模腔表面磨损\n4. 抛光处理\n5. 组装调试',
    result: 'pass',
    partsReplaced: '',
    operator: '模具组-李工',
    date: '2026-06-12',
    nextDate: '2026-07-12',
    remark: '模具状态良好，磨损在正常范围内'
  },
  {
    id: 'ML20260610001',
    equipmentId: 'EQ001',
    equipmentName: '全自动吹瓶机 BM-01',
    type: 'weekly',
    title: '周度维护',
    content: '1. 润滑导轨和传动部件\n2. 检查冷却水系统\n3. 清洁过滤器\n4. 紧固螺丝',
    result: 'pass',
    partsReplaced: '',
    operator: '陈师傅',
    date: '2026-06-10',
    nextDate: '2026-06-17',
    remark: '正常维护'
  },
  {
    id: 'ML20260601001',
    equipmentId: 'EQ004',
    equipmentName: '瓶坯检验台',
    type: 'monthly',
    title: '月度校准',
    content: '1. 电子秤校准\n2. 游标卡尺校准\n3. 检查照明系统',
    result: 'pass',
    partsReplaced: '',
    operator: '计量室-张工',
    date: '2026-06-01',
    nextDate: '2026-07-01',
    remark: '校准合格'
  }
]

export const mockDashboardStats: DashboardStats = {
  todayOutput: 21100,
  qualifiedRate: 97.2,
  todayInspection: 3,
  equipmentRunning: 4,
  equipmentTotal: 7,
  pendingTasks: 8,
  outputTrend: [
    { date: '6/11', output: 18500, qualified: 17900 },
    { date: '6/12', output: 20200, qualified: 19600 },
    { date: '6/13', output: 19800, qualified: 19100 },
    { date: '6/14', output: 21500, qualified: 20800 },
    { date: '6/15', output: 22000, qualified: 21400 },
    { date: '6/16', output: 28400, qualified: 27500 },
    { date: '6/17', output: 21100, qualified: 20500 }
  ],
  qualityTrend: [
    { date: '6/11', rate: 96.8 },
    { date: '6/12', rate: 97.0 },
    { date: '6/13', rate: 96.5 },
    { date: '6/14', rate: 96.7 },
    { date: '6/15', rate: 97.3 },
    { date: '6/16', rate: 96.8 },
    { date: '6/17', rate: 97.2 }
  ],
  moduleProgress: [
    { name: '瓶坯采购', completed: 4, total: 6 },
    { name: '瓶坯检验', completed: 1, total: 3 },
    { name: '加热吹瓶', completed: 2, total: 3 },
    { name: '瓶身检测', completed: 1, total: 3 },
    { name: '容量校验', completed: 1, total: 1 },
    { name: '装箱入库', completed: 2, total: 2 },
    { name: '设备点检', completed: 5, total: 7 }
  ]
}
