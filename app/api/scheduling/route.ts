import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createScheduleSchema = z.object({
  jobId:          z.string().cuid(),
  technicianId:   z.string().cuid(),
  scheduledStart: z.string().datetime(),
  scheduledEnd:   z.string().datetime(),
  arrivalWindow:  z.number().int().default(60),
  notes:          z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date        = searchParams.get('date')
  const techId      = searchParams.get('technicianId')
  const status      = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (techId)  where.technicianId = techId
  if (status)  where.status       = status
  if (date) {
    const start = new Date(date)
    const end   = new Date(date)
    end.setDate(end.getDate() + 1)
    where.scheduledStart = { gte: start, lt: end }
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      job:        { include: { customer: true } },
      technician: true,
    },
    orderBy: { scheduledStart: 'asc' },
  })

  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createScheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { scheduledStart, scheduledEnd, ...rest } = parsed.data

  // Check for schedule conflicts
  const conflict = await prisma.schedule.findFirst({
    where: {
      technicianId: rest.technicianId,
      status: { notIn: ['COMPLETED', 'NO_SHOW', 'RESCHEDULED'] },
      AND: [
        { scheduledStart: { lt: new Date(scheduledEnd) } },
        { scheduledEnd:   { gt: new Date(scheduledStart) } },
      ],
    },
  })

  if (conflict) {
    return NextResponse.json({ error: 'Schedule conflict detected', conflict }, { status: 409 })
  }

  const schedule = await prisma.schedule.create({
    data: {
      ...rest,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd:   new Date(scheduledEnd),
    },
    include: { job: true, technician: true },
  })

  // Update job status to SCHEDULED
  await prisma.job.update({
    where: { id: rest.jobId },
    data:  { status: 'SCHEDULED', scheduledStart: new Date(scheduledStart), scheduledEnd: new Date(scheduledEnd) },
  })

  return NextResponse.json(schedule, { status: 201 })
}
