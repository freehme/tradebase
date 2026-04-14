import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createCustomerSchema = z.object({
  firstName:    z.string().min(1),
  lastName:     z.string().min(1),
  phone:        z.string().min(7),
  email:        z.string().email().optional().nullable(),
  altPhone:     z.string().optional().nullable(),
  customerType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'PROPERTY_MANAGER', 'GENERAL_CONTRACTOR']).default('RESIDENTIAL'),
  company:      z.string().optional().nullable(),
  street:       z.string().optional().nullable(),
  city:         z.string().optional().nullable(),
  state:        z.string().optional().nullable(),
  zip:          z.string().optional().nullable(),
  notes:        z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q    = searchParams.get('q')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const where = q
    ? {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' as const } },
          { lastName:  { contains: q, mode: 'insensitive' as const } },
          { phone:     { contains: q } },
          { email:     { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { jobs: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({ customers, total })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createCustomerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const customer = await prisma.customer.create({ data: parsed.data })
  return NextResponse.json(customer, { status: 201 })
}
