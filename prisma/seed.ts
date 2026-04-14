import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tradebase.co' },
    update: {},
    create: {
      email:        'admin@tradebase.co',
      passwordHash: adminHash,
      firstName:    'Admin',
      lastName:     'User',
      role:         'ADMIN',
    },
  })

  // Manager
  const mgr = await prisma.user.upsert({
    where: { email: 'marcus@tradebase.co' },
    update: {},
    create: {
      email:        'marcus@tradebase.co',
      passwordHash: await bcrypt.hash('manager123', 10),
      firstName:    'Marcus',
      lastName:     'Allen',
      phone:        '6025551008',
      role:         'MANAGER',
    },
  })

  // Dispatcher
  const dispatcher = await prisma.user.upsert({
    where: { email: 'grace@tradebase.co' },
    update: {},
    create: {
      email:        'grace@tradebase.co',
      passwordHash: await bcrypt.hash('dispatch123', 10),
      firstName:    'Grace',
      lastName:     'Wu',
      phone:        '4805551007',
      role:         'DISPATCHER',
    },
  })

  // Technicians
  const techData = [
    { email: 'carlos@tradebase.co', first: 'Carlos', last: 'Martinez', phone: '6025551001' },
    { email: 'dana@tradebase.co',   first: 'Dana',   last: 'Lee',      phone: '4805551002' },
    { email: 'phil@tradebase.co',   first: 'Phil',   last: 'Torres',   phone: '6235551003' },
    { email: 'amy@tradebase.co',    first: 'Amy',    last: 'Johnson',  phone: '4805551004' },
    { email: 'sam@tradebase.co',    first: 'Sam',    last: 'Kim',      phone: '6025551005' },
  ]

  const techs = await Promise.all(techData.map(t =>
    prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email:        t.email,
        passwordHash: bcrypt.hashSync('tech123', 10),
        firstName:    t.first,
        lastName:     t.last,
        phone:        t.phone,
        role:         'TECHNICIAN',
      },
    })
  ))

  // Customers
  const customer1 = await prisma.customer.create({
    data: {
      firstName:    'Maria',
      lastName:     'Santos',
      phone:        '6025550182',
      email:        'maria@example.com',
      customerType: 'RESIDENTIAL',
      street:       '412 Oak St',
      city:         'Phoenix',
      state:        'AZ',
      zip:          '85001',
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      firstName:    'Tom',
      lastName:     'Reeves',
      phone:        '4805550234',
      email:        'tom@tomreeves.com',
      customerType: 'RESIDENTIAL',
      street:       '88 Maple Ave',
      city:         'Scottsdale',
      state:        'AZ',
      zip:          '85251',
    },
  })

  const customer3 = await prisma.customer.create({
    data: {
      firstName:    'ABC',
      lastName:     'Rentals',
      company:      'ABC Rentals LLC',
      phone:        '6235550091',
      email:        'ops@abcrentals.com',
      customerType: 'PROPERTY_MANAGER',
      street:       '1200 Commerce Dr',
      city:         'Tempe',
      state:        'AZ',
      zip:          '85281',
    },
  })

  // Sample job
  const job1 = await prisma.job.create({
    data: {
      jobNumber:  'JOB-26-10021',
      title:      'Kitchen Pipe Burst',
      description: 'Water overflowing from kitchen sink. P-trap may have failed. Property built 1987.',
      jobType:    'REPAIR',
      status:     'IN_PROGRESS',
      priority:   'EMERGENCY',
      customerId: customer1.id,
      createdById: admin.id,
      street:     '412 Oak St',
      city:       'Phoenix',
      state:      'AZ',
      zip:        '85001',
      yearBuilt:  1987,
      propertyType: 'Single Family',
      sqFootage:  2150,
      estimatedHours: 4,
      estimatedCost:  2400,
    },
  })

  // Sample inventory
  const inventoryItems = [
    { sku: 'PLM-PVC-075', name: 'PVC Pipe 3/4" (10ft)',  category: 'PLUMBING' as const,   unit: 'each',  quantityOnHand: 2,  reorderPoint: 10, unitCost: 4.50,  unitPrice: 9.00 },
    { sku: 'ELC-BRK-020', name: '20A Circuit Breaker',   category: 'ELECTRICAL' as const, unit: 'each',  quantityOnHand: 5,  reorderPoint: 12, unitCost: 8.25,  unitPrice: 18.00 },
    { sku: 'DRY-SHT-4x8', name: 'Drywall 4x8 Sheet',    category: 'CARPENTRY' as const,  unit: 'sheet', quantityOnHand: 8,  reorderPoint: 20, unitCost: 12.00, unitPrice: 24.00 },
    { sku: 'HVC-FLT-2025', name: 'HVAC Filter 20x25',   category: 'HVAC' as const,       unit: 'each',  quantityOnHand: 0,  reorderPoint: 15, unitCost: 6.00,  unitPrice: 14.00 },
    { sku: 'PLM-PTR-075', name: 'P-Trap Assembly 3/4"', category: 'PLUMBING' as const,   unit: 'each',  quantityOnHand: 24, reorderPoint: 10, unitCost: 7.50,  unitPrice: 18.00 },
  ]

  await Promise.all(inventoryItems.map(item =>
    prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {},
      create: { ...item },
    })
  ))

  console.log('✓ Seed complete')
  console.log('  Admin login: admin@tradebase.co / admin123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
