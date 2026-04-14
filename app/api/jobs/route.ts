import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateJobNumber } from '@/lib/utils'
import { z } from 'zod'

const createJobSchema = z.object({
  title:            z.string().min(2),
  description:      z.string().optional(),
  jobType:          z.enum(['REPAIR', 'RENOVATION', 'NEW_CONSTRUCTION', 'INSPECTION', 'ESTIMATE', 'MAINTENANCE', 'EMERGENCY']),
  priority:         z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('MEDIUM'),
  customerId:       z.string().cuid(),
  createdById:      z.string().cuid(),
  street:           z.string().optional(),
  city:             z.string().optional(),
  state:            z.string().optional(),
  zip:              z.string().optional(),
  latitude:         z.number().optional(),
  longitude:        z.number().optional(),
  requestedDate:    z.string().datetime().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const priority = searchParams.get('priority')
  const page     = parseInt(searchParams.get('page') ?? '1')
  const limit    = parseInt(searchParams.get('limit') ?? '25')

  const where: Record<string, unknown> = {}
  if (status)   where.status   = status
  if (priority) where.priority = priority

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { customer: true, assignments: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({ where }),
  ])

  return NextResponse.json({ jobs, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createJobSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { requestedDate, ...data } = parsed.data

  const job = await prisma.job.create({
    data: {
      ...data,
      jobNumber:     generateJobNumber(),
      requestedDate: requestedDate ? new Date(requestedDate) : undefined,
    },
    include: { customer: true },
  })

  return NextResponse.json(job, { status: 201 })
}
