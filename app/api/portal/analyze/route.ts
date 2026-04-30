import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'

interface UploadedFile {
  name: string
  type: string
  dataUrl: string
}

interface AnalysisResult {
  summary: string
  estimatedRange: string
  estimatedHours: number
  urgency: string
  nextSteps: string[]
}

const FALLBACK: AnalysisResult = {
  summary:        'Your request has been received. Our dispatcher will review the details and contact you within 1–2 hours to confirm the appointment and provide a precise estimate.',
  estimatedRange: '1–4 hours',
  estimatedHours: 2,
  urgency:        'medium',
  nextSteps: [
    'A dispatcher will call you within 1–2 hours to confirm details.',
    'We will text you when a technician is on the way.',
    'The technician will diagnose the issue and provide a firm quote on-site before any work begins.',
  ],
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, address, issueType, description, files } = body as {
    name: string; email: string; phone?: string; address?: string
    issueType: string; description: string; files: UploadedFile[]
  }

  // Save inquiry to DB (non-blocking — if DB fails, we still return AI result)
  try {
    await prisma.customerInquiry.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        address: address ?? null,
        issueType,
        description,
        attachmentPaths: files.map(f => f.name),
        status: 'NEW',
      },
    })
  } catch (err) {
    console.error('Failed to save inquiry to DB:', err)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(FALLBACK)
  }

  try {
    const client = new Anthropic({ apiKey })

    // Build message content — include image vision if files are present
    const contentParts: Anthropic.MessageParam['content'] = []

    const textPrompt = `You are a plumbing service estimator for ClearFlow Plumbing in Phoenix, AZ. A customer submitted a service request. Analyze it and respond in JSON only.

Customer: ${name}
Address: ${address ?? 'Not provided'}
Issue Type: ${issueType}
Description: ${description}

${files.length > 0 ? `Customer also uploaded ${files.length} file(s). ${files.some(f => f.type.startsWith('image/')) ? 'Analyze any images for visual clues about the plumbing issue.' : ''}` : ''}

Respond with this exact JSON structure:
{
  "summary": "2–3 sentence plain-language assessment of what's likely wrong and what the service visit will involve.",
  "estimatedRange": "e.g. '1–2 hours' or '3–5 hours'",
  "estimatedHours": <single number — midpoint estimate>,
  "urgency": "emergency | high | medium | low",
  "nextSteps": ["step 1", "step 2", "step 3"]
}

urgency rules: emergency = burst pipe, sewage backup, no water supply, or safety hazard; high = major leak or complete fixture failure; medium = reduced performance or slow drain; low = maintenance or minor issue.`

    // Add images if present
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      for (const img of imageFiles.slice(0, 2)) {
        const base64 = img.dataUrl.split(',')[1]
        const mediaType = img.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        })
      }
    }

    contentParts.push({ type: 'text', text: textPrompt })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: 'You are a plumbing service estimator. Always respond with valid JSON only. No markdown, no explanation outside the JSON object.',
      messages: [{ role: 'user', content: contentParts }],
    })

    const text = message.content[0]
    if (text.type !== 'text') return NextResponse.json(FALLBACK)

    let result: AnalysisResult
    try {
      result = JSON.parse(text.text)
    } catch {
      return NextResponse.json(FALLBACK)
    }

    // Update the inquiry with AI result
    try {
      await prisma.customerInquiry.updateMany({
        where: { email, status: 'NEW' },
        data: {
          aiSummary:      result.summary,
          estimatedHours: result.estimatedHours,
          estimatedRange: result.estimatedRange,
          urgency:        result.urgency,
        },
      })
    } catch {
      // non-critical
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('AI analysis error:', err)
    return NextResponse.json(FALLBACK)
  }
}
