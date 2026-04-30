import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding ClearFlow Plumbing demo data...')

  // ── Users ────────────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tradebase.co' },
    update: {},
    create: {
      email:        'admin@tradebase.co',
      passwordHash: adminHash,
      firstName:    'Jordan',
      lastName:     'Frost',
      role:         'ADMIN',
    },
  })

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

  const [carlos, dana, phil, amy, sam] = techs

  // ── Customers ────────────────────────────────────────────────────────────────

  const c1 = await prisma.customer.create({
    data: {
      firstName:    'Linda',
      lastName:     'Chen',
      phone:        '6025550182',
      email:        'linda.chen@gmail.com',
      customerType: 'RESIDENTIAL',
      street:       '412 Cactus Wren Dr',
      city:         'Phoenix',
      state:        'AZ',
      zip:          '85016',
      notes:        'Older 1960s home with galvanized supply lines. Prefers morning appointments.',
    },
  })

  const c2 = await prisma.customer.create({
    data: {
      firstName:    'Robert',
      lastName:     'Martinez',
      phone:        '4805550234',
      email:        'rmartinez@outlook.com',
      customerType: 'RESIDENTIAL',
      street:       '88 Desert Sage Ln',
      city:         'Scottsdale',
      state:        'AZ',
      zip:          '85251',
      notes:        'Annual plumbing maintenance contract. 3 rental units on property.',
    },
  })

  const c3 = await prisma.customer.create({
    data: {
      firstName:    'Sunrise',
      lastName:     'Commercial',
      company:      'Sunrise Commercial Properties LLC',
      phone:        '6235550091',
      email:        'facilities@sunriseprops.com',
      customerType: 'PROPERTY_MANAGER',
      street:       '1200 E Apache Blvd',
      city:         'Tempe',
      state:        'AZ',
      zip:          '85281',
      notes:        'Manages 12 residential units and 2 small office buildings. Net-30 billing.',
    },
  })

  const c4 = await prisma.customer.create({
    data: {
      firstName:    'Jennifer',
      lastName:     'Walsh',
      phone:        '4805550501',
      email:        'jwalsh@yahoo.com',
      customerType: 'RESIDENTIAL',
      street:       '55 Palo Verde Ct',
      city:         'Mesa',
      state:        'AZ',
      zip:          '85201',
    },
  })

  const c5 = await prisma.customer.create({
    data: {
      firstName:    'Westgate',
      lastName:     'Center',
      company:      'Westgate Shopping Center',
      phone:        '6235550050',
      email:        'ops@westgatecenter.com',
      customerType: 'COMMERCIAL',
      street:       '6751 N Sunset Blvd',
      city:         'Glendale',
      state:        'AZ',
      zip:          '85305',
      notes:        '4 commercial restrooms, grease trap service needed quarterly. 24/7 emergency coverage.',
    },
  })

  const c6 = await prisma.customer.create({
    data: {
      firstName:    'Derek',
      lastName:     'Okafor',
      phone:        '4805550300',
      email:        'dokafor@gmail.com',
      customerType: 'RESIDENTIAL',
      street:       '2210 W Thunderbird Rd',
      city:         'Phoenix',
      state:        'AZ',
      zip:          '85023',
    },
  })

  // ── Jobs ─────────────────────────────────────────────────────────────────────

  const job1 = await prisma.job.create({
    data: {
      jobNumber:    'JOB-26-10021',
      title:        'Kitchen Drain Blockage — Sewage Backup',
      description:  'Active sewage backup from kitchen drain. Customer reports water coming up through floor drain. Possible main line blockage. Snake and camera scope needed.',
      jobType:      'REPAIR',
      status:       'IN_PROGRESS',
      priority:     'EMERGENCY',
      customerId:   c1.id,
      createdById:  admin.id,
      street:       '412 Cactus Wren Dr',
      city:         'Phoenix',
      state:        'AZ',
      zip:          '85016',
      yearBuilt:    1963,
      propertyType: 'Single Family',
      sqFootage:    1850,
      estimatedHours: 3,
      estimatedCost:  485,
    },
  })

  const job2 = await prisma.job.create({
    data: {
      jobNumber:    'JOB-26-10020',
      title:        'Annual Plumbing Inspection — 3 Units',
      description:  'Annual maintenance visit. Inspect all fixtures, supply lines, shutoff valves, and water heater. Check for slow drains and minor leaks across 3 rental units.',
      jobType:      'MAINTENANCE',
      status:       'SCHEDULED',
      priority:     'MEDIUM',
      customerId:   c2.id,
      createdById:  mgr.id,
      street:       '88 Desert Sage Ln',
      city:         'Scottsdale',
      state:        'AZ',
      zip:          '85251',
      yearBuilt:    1995,
      propertyType: 'Single Family',
      sqFootage:    2400,
      estimatedHours: 2,
      estimatedCost:  199,
      scheduledStart: new Date(Date.now() + 2 * 86400000),
      scheduledEnd:   new Date(Date.now() + 2 * 86400000 + 2 * 3600000),
    },
  })

  const job3 = await prisma.job.create({
    data: {
      jobNumber:    'JOB-26-10019',
      title:        'Full Repiping — Commercial Building',
      description:  'Failing galvanized supply lines in Building B need full PEX repipe. Low water pressure throughout and pinhole leaks reported by tenants.',
      jobType:      'REPAIR',
      status:       'QUOTED',
      priority:     'HIGH',
      customerId:   c3.id,
      createdById:  mgr.id,
      street:       '1200 E Apache Blvd',
      city:         'Tempe',
      state:        'AZ',
      zip:          '85281',
      yearBuilt:    1978,
      propertyType: 'Commercial Office',
      sqFootage:    3200,
      estimatedHours: 14,
      estimatedCost:  8400,
    },
  })

  const job4 = await prisma.job.create({
    data: {
      jobNumber:    'JOB-26-10018',
      title:        'Water Heater Diagnosis & Repair',
      description:  'No hot water. 8-year-old Bradford White 40-gal gas unit. Check pilot light, thermocouple, and gas valve before recommending replacement.',
      jobType:      'REPAIR',
      status:       'ASSESSMENT',
      priority:     'MEDIUM',
      customerId:   c4.id,
      createdById:  dispatcher.id,
      street:       '55 Palo Verde Ct',
      city:         'Mesa',
      state:        'AZ',
      zip:          '85201',
      yearBuilt:    2011,
      propertyType: 'Single Family',
      sqFootage:    1600,
    },
  })

  const job5 = await prisma.job.create({
    data: {
      jobNumber:    'JOB-26-10017',
      title:        'Main Sewer Hydro-Jet Clean — 4 Lines',
      description:  'Hydro-jet cleaning and camera scoping of all 4 main sewer lines serving the commercial restrooms. Grease and debris buildup causing recurring backups.',
      jobType:      'MAINTENANCE',
      status:       'COMPLETED',
      priority:     'LOW',
      customerId:   c5.id,
      createdById:  mgr.id,
      street:       '6751 N Sunset Blvd',
      city:         'Glendale',
      state:        'AZ',
      zip:          '85305',
      propertyType: 'Commercial Retail',
      sqFootage:    42000,
      estimatedHours: 24,
      estimatedCost:  6800,
      actualHours:    26,
      actualCost:     7200,
      scheduledStart: new Date(Date.now() - 2 * 86400000),
      completedAt:    new Date(Date.now() - 1 * 86400000),
    },
  })

  const job6 = await prisma.job.create({
    data: {
      jobNumber:    'JOB-26-10016',
      title:        'Outdoor Hose Bib Replacement',
      description:  'Customer reports outdoor hose bib leaking at handle and dripping when off. Replace with quarter-turn frost-free bib.',
      jobType:      'REPAIR',
      status:       'INQUIRY',
      priority:     'LOW',
      customerId:   c1.id,
      createdById:  dispatcher.id,
      street:       '412 Cactus Wren Dr',
      city:         'Phoenix',
      state:        'AZ',
      zip:          '85016',
    },
  })

  const job7 = await prisma.job.create({
    data: {
      jobNumber:    'JOB-26-10015',
      title:        'Emergency Burst Pipe — No Water',
      description:  'Complete water loss to property. Elderly resident inside. Likely burst supply line or main shutoff valve failure. Immediate dispatch required.',
      jobType:      'EMERGENCY',
      status:       'SCHEDULED',
      priority:     'EMERGENCY',
      customerId:   c6.id,
      createdById:  dispatcher.id,
      street:       '2210 W Thunderbird Rd',
      city:         'Phoenix',
      state:        'AZ',
      zip:          '85023',
      yearBuilt:    2000,
      sqFootage:    1400,
      estimatedHours: 4,
      estimatedCost:  650,
      scheduledStart: new Date(Date.now() + 1 * 3600000),
      scheduledEnd:   new Date(Date.now() + 5 * 3600000),
    },
  })

  // ── Job Assignments ──────────────────────────────────────────────────────────

  await prisma.jobAssignment.createMany({
    data: [
      { jobId: job1.id, userId: carlos.id, role: 'lead',      hoursLogged: 1.5 },
      { jobId: job2.id, userId: dana.id,   role: 'lead',      hoursLogged: 0 },
      { jobId: job3.id, userId: phil.id,   role: 'lead',      hoursLogged: 2 },
      { jobId: job3.id, userId: sam.id,    role: 'helper',    hoursLogged: 2 },
      { jobId: job4.id, userId: dana.id,   role: 'lead',      hoursLogged: 0 },
      { jobId: job5.id, userId: amy.id,    role: 'lead',      hoursLogged: 14 },
      { jobId: job5.id, userId: sam.id,    role: 'helper',    hoursLogged: 12 },
      { jobId: job7.id, userId: carlos.id, role: 'lead',      hoursLogged: 0 },
    ],
  })

  // ── Job Line Items (completed job) ───────────────────────────────────────────

  await prisma.jobLineItem.createMany({
    data: [
      { jobId: job5.id, description: 'Hydro-jet labor (26 hrs)',         category: 'labor',     quantity: 26, unitPrice: 95,  total: 2470 },
      { jobId: job5.id, description: 'Camera scope (4 lines)',            category: 'labor',     quantity: 4,  unitPrice: 125, total: 500 },
      { jobId: job5.id, description: 'Degreaser treatment (4 lines)',     category: 'materials', quantity: 4,  unitPrice: 38,  total: 152 },
      { jobId: job5.id, description: 'Access panel reinstall',            category: 'labor',     quantity: 4,  unitPrice: 30,  total: 120 },
      { jobId: job5.id, description: 'Clean-out plugs & hardware',        category: 'materials', quantity: 1,  unitPrice: 184, total: 184 },
    ],
  })

  // ── Notes ────────────────────────────────────────────────────────────────────

  await prisma.jobNote.createMany({
    data: [
      {
        jobId:      job1.id,
        authorId:   carlos.id,
        content:    'Arrived on site. Kitchen sink completely backed up, standing water in cabinet. Snaked 25ft — hit hard blockage. Running camera scope to identify break or root intrusion in main line.',
        isInternal: true,
      },
      {
        jobId:      job1.id,
        authorId:   dispatcher.id,
        content:    'Customer called back — says backup started 2 days ago. Same issue happened last year with a different company who cleared it but didn\'t scope.',
        isInternal: true,
      },
      {
        jobId:      job5.id,
        authorId:   amy.id,
        content:    'Job complete. All 4 sewer lines hydro-jetted and scoped. Found significant grease buildup in lines 2 and 3 — fully cleared. Recommended quarterly maintenance plan to prevent recurrence.',
        isInternal: false,
      },
    ],
  })

  // ── Schedules ────────────────────────────────────────────────────────────────

  await prisma.schedule.createMany({
    data: [
      {
        jobId:          job1.id,
        technicianId:   carlos.id,
        status:         'ON_SITE',
        scheduledStart: new Date(),
        scheduledEnd:   new Date(Date.now() + 3 * 3600000),
        actualStart:    new Date(Date.now() - 90 * 60000),
        confirmedAddress: '412 Cactus Wren Dr, Phoenix AZ 85016',
        arrivalWindow:  30,
        travelMinutes:  22,
      },
      {
        jobId:          job2.id,
        technicianId:   dana.id,
        status:         'CONFIRMED',
        scheduledStart: new Date(Date.now() + 2 * 86400000),
        scheduledEnd:   new Date(Date.now() + 2 * 86400000 + 2 * 3600000),
        arrivalWindow:  60,
      },
      {
        jobId:          job7.id,
        technicianId:   carlos.id,
        status:         'EN_ROUTE',
        scheduledStart: new Date(Date.now() + 1 * 3600000),
        scheduledEnd:   new Date(Date.now() + 5 * 3600000),
        arrivalWindow:  30,
        travelMinutes:  18,
      },
    ],
  })

  // ── Invoice for completed job ─────────────────────────────────────────────────

  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-26-00017',
      jobId:         job5.id,
      customerId:    c5.id,
      createdById:   admin.id,
      status:        'SENT',
      issueDate:     new Date(Date.now() - 86400000),
      dueDate:       new Date(Date.now() + 29 * 86400000),
      subtotal:      3426,
      taxRate:       8.6,
      taxAmount:     294.64,
      discount:      0,
      total:         3720.64,
      amountPaid:    0,
      balanceDue:    3720.64,
      termsConditions: 'Net 30. Late fee 1.5%/month after due date.',
      sentAt:        new Date(Date.now() - 86400000),
      lineItems: {
        create: [
          { description: 'Hydro-jet labor (26 hrs)',        category: 'labor',     quantity: 26, unitPrice: 95,  total: 2470 },
          { description: 'Camera scope (4 sewer lines)',    category: 'labor',     quantity: 4,  unitPrice: 125, total: 500 },
          { description: 'Degreaser treatment (4 lines)',   category: 'materials', quantity: 4,  unitPrice: 38,  total: 152 },
          { description: 'Access panel reinstall',          category: 'labor',     quantity: 4,  unitPrice: 30,  total: 120 },
          { description: 'Clean-out plugs & hardware',      category: 'materials', quantity: 1,  unitPrice: 184, total: 184 },
        ],
      },
    },
  })

  // ── Inventory ────────────────────────────────────────────────────────────────

  const inventoryItems = [
    { sku: 'PLB-TRAP-15',  name: 'P-Trap Assembly PVC 1.5"',            category: 'PLUMBING' as const, unit: 'each',  quantityOnHand: 15, reorderPoint: 10, reorderQty: 20, unitCost: 12,   unitPrice: 28,   supplier: 'Ferguson Waterworks', location: 'Shelf A1' },
    { sku: 'PLB-TRAP-20',  name: 'P-Trap Assembly PVC 2"',              category: 'PLUMBING' as const, unit: 'each',  quantityOnHand: 8,  reorderPoint: 6,  reorderQty: 12, unitCost: 14,   unitPrice: 32,   supplier: 'Ferguson Waterworks', location: 'Shelf A2' },
    { sku: 'PLB-WAXRNG',   name: 'Wax Ring Kit w/ Bolts',               category: 'PLUMBING' as const, unit: 'each',  quantityOnHand: 4,  reorderPoint: 8,  reorderQty: 15, unitCost: 8,    unitPrice: 22,   supplier: 'Home Depot',          location: 'Bin B1' },
    { sku: 'PLB-SHUTVLV',  name: '1/4-Turn Shutoff Valve 3/8"',         category: 'PLUMBING' as const, unit: 'each',  quantityOnHand: 12, reorderPoint: 15, reorderQty: 25, unitCost: 9,    unitPrice: 24,   supplier: 'Ferguson Waterworks', location: 'Bin B2' },
    { sku: 'PLB-SUPLINE',  name: 'Braided Supply Line 20"',              category: 'PLUMBING' as const, unit: 'each',  quantityOnHand: 25, reorderPoint: 15, reorderQty: 30, unitCost: 6,    unitPrice: 16,   supplier: 'Ferguson Waterworks', location: 'Bin B3' },
    { sku: 'PLB-SNAKE50',  name: 'Manual Drain Snake 50ft',              category: 'TOOLS' as const,    unit: 'each',  quantityOnHand: 3,  reorderPoint: 2,  reorderQty: 2,  unitCost: 45,   unitPrice: 0,    supplier: 'Ridgid Tools',        location: 'Shelf C1' },
    { sku: 'PLB-PVC-1IN',  name: '1" PVC Pipe Schedule 40 (10ft)',       category: 'PLUMBING' as const, unit: 'each',  quantityOnHand: 40, reorderPoint: 20, reorderQty: 20, unitCost: 4.50, unitPrice: 12,   supplier: 'Home Depot',          location: 'Shelf D1' },
    { sku: 'PLB-PEX-34',   name: '3/4" PEX Tubing A (100ft)',            category: 'PLUMBING' as const, unit: 'roll',  quantityOnHand: 0,  reorderPoint: 4,  reorderQty: 6,  unitCost: 55,   unitPrice: 135,  supplier: 'Uponor',              location: 'Shelf D2' },
    { sku: 'PLB-HWTR-40',  name: '40-Gal Water Heater Gas (Bradford)',   category: 'PLUMBING' as const, unit: 'each',  quantityOnHand: 2,  reorderPoint: 1,  reorderQty: 2,  unitCost: 485,  unitPrice: 1200, supplier: 'Bradford White',      location: 'Shelf E1' },
    { sku: 'SFT-GLOVE-LG', name: 'Nitrile Gloves Large (100-ct)',        category: 'SAFETY' as const,   unit: 'box',   quantityOnHand: 5,  reorderPoint: 3,  reorderQty: 6,  unitCost: 12,   unitPrice: 0,    supplier: 'Home Depot',          location: 'Bin F1' },
  ]

  await Promise.all(inventoryItems.map(item =>
    prisma.inventoryItem.upsert({
      where:  { sku: item.sku },
      update: {},
      create: { ...item },
    })
  ))

  // ── Communications ───────────────────────────────────────────────────────────

  await prisma.communication.createMany({
    data: [
      {
        channel:      'PHONE_INBOUND',
        status:       'MISSED',
        fromNumber:   '+16025550182',
        toNumber:     '+16025559000',
        body:         'Missed call from Linda Chen',
        customerId:   c1.id,
        handledById:  null,
        createdAt:    new Date(Date.now() - 4 * 60000),
      },
      {
        channel:      'SMS_INBOUND',
        status:       'PENDING',
        fromNumber:   '+14805550501',
        toNumber:     '+16025559000',
        body:         'Hi, my toilet keeps backing up and there\'s a sewage smell from the bathroom. Should I stop using it? I\'m worried about damage.',
        customerId:   c4.id,
        handledById:  null,
        createdAt:    new Date(Date.now() - 12 * 60000),
      },
      {
        channel:      'PHONE_INBOUND',
        status:       'MISSED',
        fromNumber:   '+16235550091',
        toNumber:     '+16025559000',
        body:         'Missed call from Sunrise Commercial',
        customerId:   c3.id,
        handledById:  null,
        createdAt:    new Date(Date.now() - 28 * 60000),
      },
      {
        channel:      'EMAIL_INBOUND',
        status:       'PENDING',
        fromEmail:    'ops@westgatecenter.com',
        toEmail:      'dispatch@clearflowplumbing.co',
        subject:      'Bathroom 3 drains all backed up again',
        body:         'All drains in bathroom 3 are backing up and flooding the floor again. Needs urgent attention before the weekend rush.',
        customerId:   c5.id,
        handledById:  null,
        createdAt:    new Date(Date.now() - 65 * 60000),
      },
    ],
  })

  // ── Portal Inquiry (with AI analysis) ──────────────────────────────────────

  await prisma.customerInquiry.create({
    data: {
      name:        'Sarah Thompson',
      email:       'sarah.thompson@gmail.com',
      phone:       '6025557823',
      address:     '8834 N 32nd St, Phoenix AZ 85028',
      issueType:   'Water leak / pipe dripping',
      description: 'There is water pooling under my kitchen sink. I can see a pipe is dripping from what looks like the drain connection. The cabinet floor is soaked. Uploading a photo of what I can see under the sink.',
      attachmentPaths: ['sink-leak-photo.jpg'],
      aiSummary:   'The uploaded photo shows an active water leak at the P-trap assembly under the kitchen sink. The compression slip joint on the P-trap outlet is clearly corroded and no longer forming a watertight seal — water is visibly dripping from the fitting. The drain pipe also shows significant hard-water mineral buildup (white calcium deposits) around the joint, suggesting this fitting has been leaking slowly for several weeks. The fix is straightforward: replace the P-trap assembly and compression fittings, flush and clear the drain, and test for leaks. No major demo or access issues visible in the photo.',
      estimatedHours: 2.0,
      estimatedRange: '1.5 – 2.5 hours',
      urgency:     'medium',
      status:      'NEW',
    },
  })

  console.log('✓ Seed complete — ClearFlow Plumbing demo data loaded')
  console.log('  Admin login: admin@tradebase.co / admin123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
