import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateInvoiceNumber } from '@/lib/utils'
import { z } from 'zod'

const lineItemSchema = z.object({
  description: z.string(),
  category:    z.string().optional(),
  quantity:    z.number().positive(),
  unitPrice:   z.number().nonnegative(),
  total:       z.number().nonnegative(),
})

const createInvoiceSchema = z.object({
  jobId:          z.string().cuid(),
  customerId:     z.string().cuid(),
  createdById:    z.string().cuid(),
  dueDate:        z.string().datetime(),
  taxRate:        z.number().min(0).max(1).default(0),
  discount:       z.number().nonnegative().default(0),
  notes:          z.string().optional(),
  termsConditions: z.string().optional(),
  lineItems:      z.array(lineItemSchema).min(1),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status     = searchParams.get('status')
  const customerId = searchParams.get('customerId')

  const where: Record<string, unknown> = {}
  if (status)     where.status     = status
  if (customerId) where.customerId = customerId

  const invoices = await prisma.invoice.findMany({
    where,
    include: { customer: true, lineItems: true, payments: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createInvoiceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { lineItems, dueDate, taxRate, discount, ...rest } = parsed.data

  const subtotal   = lineItems.reduce((s, li) => s + li.total, 0)
  const taxAmount  = subtotal * taxRate
  const total      = subtotal + taxAmount - discount
  const balanceDue = total

  const invoice = await prisma.invoice.create({
    data: {
      ...rest,
      invoiceNumber: generateInvoiceNumber(),
      dueDate:       new Date(dueDate),
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      balanceDue,
      lineItems:     { create: lineItems },
    },
    include: { lineItems: true, customer: true },
  })

  // Update job status
  await prisma.job.update({
    where: { id: rest.jobId },
    data:  { status: 'INVOICED' },
  })

  return NextResponse.json(invoice, { status: 201 })
}
