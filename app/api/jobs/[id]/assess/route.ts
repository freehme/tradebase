import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { customer: true, attachments: true },
  })

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const propertyContext = job.countyData
    ? `Property Details from County Records: ${JSON.stringify(job.countyData)}`
    : `Property: ${[job.street, job.city, job.state, job.zip].filter(Boolean).join(', ')}`

  const prompt = `You are an expert estimator for a skilled labor company. Analyze this job request and provide a detailed assessment.

Job Type: ${job.jobType}
Job Title: ${job.title}
Description: ${job.description ?? 'No additional description'}
${propertyContext}
${job.yearBuilt ? `Year Built: ${job.yearBuilt}` : ''}
${job.sqFootage ? `Square Footage: ${job.sqFootage}` : ''}
${job.propertyType ? `Property Type: ${job.propertyType}` : ''}

Provide your assessment in the following JSON format:
{
  "summary": "Brief plain-language summary of the situation and scope",
  "scopeOfWork": "Numbered list of work steps",
  "estimatedHours": <number>,
  "laborBreakdown": { "Trade Name": <hours>, ... },
  "materialsList": ["item1", "item2", ...],
  "riskFactors": "Key risks or unknowns that could affect scope or cost",
  "recommendedTrades": ["trade1", "trade2"],
  "confidenceScore": <0-100>
}

Be precise and practical. Consider the property age, type, and description carefully.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: 'You are a skilled trades estimator. Always respond with valid JSON only, no markdown.',
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })
  }

  let aiData: Record<string, unknown>
  try {
    aiData = JSON.parse(content.text)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  // Save assessment to DB
  const assessment = await prisma.assessment.upsert({
    where: { jobId: job.id },
    create: {
      jobId:             job.id,
      aiSummary:         aiData.summary as string,
      scopeOfWork:       aiData.scopeOfWork as string,
      estimatedHours:    aiData.estimatedHours as number,
      laborBreakdown:    aiData.laborBreakdown as object,
      materialsList:     aiData.materialsList as object,
      riskFactors:       aiData.riskFactors as string,
      recommendedTrades: aiData.recommendedTrades as object,
      confidenceScore:   aiData.confidenceScore as number,
    },
    update: {
      aiSummary:         aiData.summary as string,
      scopeOfWork:       aiData.scopeOfWork as string,
      estimatedHours:    aiData.estimatedHours as number,
      laborBreakdown:    aiData.laborBreakdown as object,
      materialsList:     aiData.materialsList as object,
      riskFactors:       aiData.riskFactors as string,
      recommendedTrades: aiData.recommendedTrades as object,
      confidenceScore:   aiData.confidenceScore as number,
    },
  })

  // Update job with estimated hours
  await prisma.job.update({
    where: { id: job.id },
    data: {
      estimatedHours: aiData.estimatedHours as number,
      status: 'ASSESSMENT',
    },
  })

  return NextResponse.json(assessment)
}
