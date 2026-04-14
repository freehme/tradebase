import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Twilio webhook — receives inbound SMS/calls
export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const from    = formData.get('From') as string | null
  const to      = formData.get('To') as string | null
  const body    = formData.get('Body') as string | null
  const msgSid  = formData.get('MessageSid') as string | null
  const callSid = formData.get('CallSid') as string | null

  if (!from) {
    return NextResponse.json({ error: 'Missing From' }, { status: 400 })
  }

  // Look up existing customer by phone
  const phone = from.replace(/\D/g, '').slice(-10)
  const customer = await prisma.customer.findFirst({
    where: { phone: { endsWith: phone } },
  })

  // Determine channel
  const channel = callSid ? 'PHONE_INBOUND' : 'SMS_INBOUND'

  await prisma.communication.create({
    data: {
      channel,
      status:     'PENDING',
      fromNumber: from,
      toNumber:   to ?? undefined,
      body:       body ?? undefined,
      twilioSid:  msgSid ?? callSid ?? undefined,
      customerId: customer?.id,
    },
  })

  // TwiML response for SMS
  if (!callSid) {
    const autoReply = customer
      ? `Hi ${customer.firstName}! We received your message and will respond shortly. Call us at (800) 555-1000 for urgent needs.`
      : 'Thank you for contacting us! A team member will respond shortly. For emergencies, call (800) 555-1000.'

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${autoReply}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  // TwiML response for calls
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling TradeBase. Please hold while we connect you with a team member.</Say><Enqueue>main</Enqueue></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
