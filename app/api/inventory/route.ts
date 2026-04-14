import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createItemSchema = z.object({
  sku:             z.string().min(1),
  name:            z.string().min(1),
  description:     z.string().optional(),
  category:        z.enum(['PLUMBING','ELECTRICAL','HVAC','CARPENTRY','CONCRETE','ROOFING','PAINTING','HARDWARE','TOOLS','SAFETY','OTHER']).default('OTHER'),
  unit:            z.string().default('each'),
  quantityOnHand:  z.number().nonnegative().default(0),
  reorderPoint:    z.number().nonnegative().default(0),
  reorderQty:      z.number().nonnegative().default(0),
  unitCost:        z.number().nonnegative(),
  unitPrice:       z.number().nonnegative(),
  supplier:        z.string().optional(),
  location:        z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const lowStock = searchParams.get('lowStock') === 'true'

  const where: Record<string, unknown> = { isActive: true }
  if (category) where.category = category
  if (lowStock) {
    // Items at or below reorder point
    where.quantityOnHand = { lte: prisma.inventoryItem.fields.reorderPoint }
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  // Mark low stock in response
  const enriched = items.map(item => ({
    ...item,
    available: Math.max(0, item.quantityOnHand - item.quantityReserved),
    stockStatus: item.quantityOnHand === 0 ? 'OUT_OF_STOCK'
      : item.quantityOnHand <= item.reorderPoint * 0.5 ? 'CRITICAL'
      : item.quantityOnHand <= item.reorderPoint ? 'LOW'
      : 'OK',
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createItemSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const item = await prisma.inventoryItem.create({ data: parsed.data })
  return NextResponse.json(item, { status: 201 })
}
