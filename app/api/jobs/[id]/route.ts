import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      customer:    true,
      assignments: { include: { user: true } },
      attachments: true,
      notes:       { include: { author: true }, orderBy: { createdAt: 'desc' } },
      schedules:   { include: { technician: true } },
      assessment:  true,
      invoice:     true,
      lineItems:   true,
    },
  })

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  const job = await prisma.job.update({
    where: { id: params.id },
    data:  body,
    include: { customer: true },
  })

  return NextResponse.json(job)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.job.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
