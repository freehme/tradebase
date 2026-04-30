'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Droplets, CheckCircle, Clock, Wrench, Phone, ChevronRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  emergency: { label: 'Emergency',   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  high:      { label: 'High',        color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  medium:    { label: 'Today',       color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  low:       { label: 'This Week',   color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
}

function ThankYouContent() {
  const params = useSearchParams()
  const name          = params.get('name') ?? 'there'
  const issueType     = params.get('issueType') ?? ''
  const summary       = params.get('summary') ?? ''
  const estimatedRange = params.get('estimatedRange') ?? ''
  const urgency       = (params.get('urgency') ?? 'medium').toLowerCase()
  const nextSteps     = JSON.parse(params.get('steps') ?? '[]') as string[]

  const firstName = name.split(' ')[0]
  const urgencyInfo = URGENCY_CONFIG[urgency] ?? URGENCY_CONFIG.medium

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-slate-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 shadow-md">
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none">ClearFlow Plumbing</p>
              <p className="text-xs text-slate-500">Phoenix Metro · Licensed & Insured</p>
            </div>
          </div>
          <a href="tel:6025559000" className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-600">
            <Phone className="h-3.5 w-3.5" /> (602) 555-9000
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Success banner */}
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Request Received, {firstName}!</h1>
          <p className="mt-1 text-sm text-slate-600">
            We&apos;ve reviewed your request and will have a dispatcher contact you shortly.
          </p>
        </div>

        {/* AI Analysis card */}
        {summary && (
          <div className="mb-5 rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500">
                <Droplets className="h-4 w-4 text-white" />
              </div>
              <p className="font-semibold text-slate-800">AI Assessment</p>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                INSTANT ANALYSIS
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
          </div>
        )}

        {/* Estimate + Urgency row */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {estimatedRange && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <Wrench className="mx-auto mb-2 h-6 w-6 text-sky-500" />
              <p className="text-xs text-slate-500">Estimated Time</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">{estimatedRange}</p>
            </div>
          )}
          <div className={`rounded-2xl border p-4 shadow-sm text-center ${urgencyInfo.bg} ${urgencyInfo.border}`}>
            <Clock className={`mx-auto mb-2 h-6 w-6 ${urgencyInfo.color}`} />
            <p className={`text-xs ${urgencyInfo.color} opacity-70`}>Recommended</p>
            <p className={`mt-0.5 text-xl font-bold ${urgencyInfo.color}`}>{urgencyInfo.label}</p>
          </div>
        </div>

        {/* Next steps */}
        {nextSteps.length > 0 && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 font-semibold text-slate-800">What to Expect</p>
            <div className="space-y-3">
              {nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-600 pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issue summary */}
        {issueType && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Submitted Issue</p>
            <p className="font-medium text-slate-800">{issueType}</p>
          </div>
        )}

        {/* Emergency warning */}
        {urgency === 'emergency' && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-800">This may be urgent</p>
              <p className="mt-0.5 text-sm text-red-700">
                If you have an active burst pipe, sewage backup, or no water supply, call us now for immediate dispatch.
              </p>
              <a href="tel:6025559000" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                <Phone className="h-3.5 w-3.5" /> Call for Emergency Service
              </a>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/portal"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-600"
          >
            Submit Another Request <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href="tel:6025559000"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Phone className="h-4 w-4 text-slate-500" /> Talk to a Dispatcher Now
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Confirmation email sent to the address you provided. Questions? Call (602) 555-9000.
        </p>
      </main>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Droplets className="mx-auto mb-3 h-10 w-10 animate-pulse text-sky-500" />
          <p className="text-slate-600">Loading your results...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}
