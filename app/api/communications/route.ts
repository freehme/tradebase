import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const smsReplySchema = z.object({
  to:        z.string(),
  body:      z.string().min(1),
  jobId:     z.string().optional(),
  handledById: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const channel   = searchParams.get('channel')
  const customerId = searchParams.get('customerId')

  const where: Record<string, unknown> = {}
  if (status)     where.status     = status
  if (channel)    where.channel    = channel
  if (customerId) where.customerId = customerId

  const comms = await prisma.communication.findMany({
    where,
    include: { customer: true, handledBy: true, job: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(comms)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Handle outbound SMS via Twilio
  if (body.type === 'SMS_OUTBOUND') {
    const parsed = smsReplySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // In production: send via Twilio
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    // await twilio.messages.create({ body: parsed.data.body, from: process.env.TWILIO_PHONE_NUMBER, to: parsed.data.to })

    const comm = await prisma.communication.create({
      data: {
        channel:      'SMS_OUTBOUND',
        status:       'COMPLETED',
        toNumber:     parsed.data.to,
        fromNumber:   process.env.TWILIO_PHONE_NUMBER ?? '+18005551000',
        body:         parsed.data.body,
        jobId:        parsed.data.jobId,
        handledById:  parsed.data.handledById,
      },
    })

    return NextResponse.json(comm, { status: 201 })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
