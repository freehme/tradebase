'use client'

import { useState, useEffect, useRef, use } from 'react'
import {
  ArrowLeft, Phone, MapPin, Clock, CheckCircle, AlertTriangle,
  PlayCircle, StopCircle, Plus, Trash2, Send, FileText, Droplets,
  ChevronRight, Wrench,
} from 'lucide-react'
import Link from 'next/link'

const ALL_JOBS: Record<string, Job> = {
  'JOB-26-10021': {
    id:         'JOB-26-10021',
    title:      'Kitchen Drain Blockage — Sewage Backup',
    customer:   'Linda Chen',
    phone:      '6025550182',
    address:    '412 Cactus Wren Dr',
    city:       'Phoenix, AZ 85016',
    status:     'IN_PROGRESS',
    priority:   'EMERGENCY',
    type:       'Drain Clearing',
    window:     '8:00 – 11:00 AM',
    estHours:   3,
    notes:      'Active sewage backup from kitchen drain. Possible main line blockage. Snake and camera scope needed.',
    laborRate:  95,
  },
  'JOB-26-10015': {
    id:         'JOB-26-10015',
    title:      'Emergency Burst Pipe — No Water',
    customer:   'Derek Okafor',
    phone:      '4805550300',
    address:    '2210 W Thunderbird Rd',
    city:       'Phoenix, AZ 85023',
    status:     'SCHEDULED',
    priority:   'EMERGENCY',
    type:       'Burst Pipe',
    window:     '1:00 – 5:00 PM',
    estHours:   4,
    notes:      'Elderly resident. Complete water loss. Likely main shutoff valve failure or burst supply line.',
    laborRate:  95,
  },
  'JOB-26-10018': {
    id:         'JOB-26-10018',
    title:      'Water Heater Diagnosis',
    customer:   'Jennifer Walsh',
    phone:      '4805550501',
    address:    '55 Palo Verde Ct',
    city:       'Mesa, AZ 85201',
    status:     'ASSESSMENT',
    priority:   'MEDIUM',
    type:       'Water Heater',
    window:     '10:00 AM – 12:00 PM',
    estHours:   2,
    notes:      'No hot water. 8-year-old Bradford White 40-gal gas. Check pilot and thermocouple.',
    laborRate:  95,
  },
  'JOB-26-10020': {
    id:         'JOB-26-10020',
    title:      'Annual Plumbing Inspection',
    customer:   'Robert Martinez',
    phone:      '4805550234',
    address:    '88 Desert Sage Ln',
    city:       'Scottsdale, AZ 85251',
    status:     'SCHEDULED',
    priority:   'MEDIUM',
    type:       'Maintenance',
    window:     '2:00 – 4:00 PM',
    estHours:   2,
    notes:      'Annual maintenance contract. 3 rental units. Check fixtures, supply lines, water heater.',
    laborRate:  95,
  },
  'JOB-26-10019': {
    id:         'JOB-26-10019',
    title:      'Full Repiping — Commercial',
    customer:   'Sunrise Commercial',
    phone:      '6235550091',
    address:    '1200 E Apache Blvd',
    city:       'Tempe, AZ 85281',
    status:     'QUOTED',
    priority:   'HIGH',
    type:       'Repiping',
    window:     'All Day',
    estHours:   14,
    notes:      'Full PEX repipe of Building B. Galvanized supply lines failing. Quote approved pending scheduling.',
    laborRate:  95,
  },
}

const QUICK_PARTS = [
  { id: 'trap',  name: 'P-Trap Assembly PVC 1.5"',     price: 28 },
  { id: 'wax',   name: 'Wax Ring Kit w/ Bolts',         price: 22 },
  { id: 'shutv', name: '1/4-Turn Shutoff Valve 3/8"',   price: 24 },
  { id: 'supln', name: 'Braided Supply Line 20"',        price: 16 },
  { id: 'pvc',   name: '1" PVC Pipe (10ft)',             price: 12 },
  { id: 'pex',   name: '3/4" PEX Tubing (100ft)',       price: 135 },
  { id: 'snake', name: 'Drain Snake Service (50ft)',     price: 95 },
  { id: 'foam',  name: 'Expanding Foam Pipe Sealant',    price: 14 },
]

type LineItem = { id: string; description: string; qty: number; price: number }
type Job = {
  id: string; title: string; customer: string; phone: string; address: string; city: string
  status: string; priority: string; type: string; window: string; estHours: number; notes: string; laborRate: number
}

type FieldStatus = 'not_started' | 'en_route' | 'on_site' | 'in_progress' | 'done'

const FIELD_FLOW: FieldStatus[] = ['not_started', 'en_route', 'on_site', 'in_progress', 'done']
const FIELD_LABELS: Record<FieldStatus, string> = {
  not_started: 'Start Job',
  en_route:    'Mark Arrived',
  on_site:     'Start Work',
  in_progress: 'Finish Job',
  done:        'Completed',
}
const FIELD_STATUS_LABELS: Record<FieldStatus, string> = {
  not_started: 'Not Started',
  en_route:    'En Route',
  on_site:     'On Site',
  in_progress: 'In Progress',
  done:        'Complete',
}

export default function FieldJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const job = ALL_JOBS[id]

  const [fieldStatus, setFieldStatus] = useState<FieldStatus>('not_started')
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [showPartsModal, setShowPartsModal] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceSent, setInvoiceSent] = useState(false)
  const [customPart, setCustomPart] = useState({ name: '', price: '' })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(`field-job-${id}`)
    if (saved) {
      const data = JSON.parse(saved)
      setFieldStatus(data.fieldStatus ?? 'not_started')
      setElapsedSecs(data.elapsedSecs ?? 0)
      setNoteText(data.noteText ?? '')
      setLineItems(data.lineItems ?? [])
      if (data.timerRunning && data.timerStart) {
        setTimerRunning(true)
        setStartTime(data.timerStart)
      }
    }
  }, [id])

  useEffect(() => {
    if (timerRunning && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedSecs(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning, startTime])

  function save(updates: Record<string, unknown>) {
    const current = JSON.parse(localStorage.getItem(`field-job-${id}`) ?? '{}')
    localStorage.setItem(`field-job-${id}`, JSON.stringify({ ...current, ...updates }))
  }

  function advanceStatus() {
    const idx = FIELD_FLOW.indexOf(fieldStatus)
    if (idx >= FIELD_FLOW.length - 1) return
    const next = FIELD_FLOW[idx + 1]
    setFieldStatus(next)
    save({ fieldStatus: next })
    if (next === 'in_progress' && !timerRunning) {
      const now = Date.now()
      setStartTime(now)
      setTimerRunning(true)
      save({ timerRunning: true, timerStart: now })
    }
    if (next === 'done') {
      setTimerRunning(false)
      save({ timerRunning: false })
      setShowInvoice(true)
    }
  }

  function toggleTimer() {
    if (timerRunning) {
      setTimerRunning(false)
      save({ timerRunning: false, elapsedSecs })
    } else {
      const now = Date.now() - elapsedSecs * 1000
      setStartTime(now)
      setTimerRunning(true)
      save({ timerRunning: true, timerStart: now })
    }
  }

  function addPart(part: typeof QUICK_PARTS[0]) {
    const item: LineItem = { id: crypto.randomUUID(), description: part.name, qty: 1, price: part.price }
    const updated = [...lineItems, item]
    setLineItems(updated)
    save({ lineItems: updated })
    setShowPartsModal(false)
  }

  function addCustomPart() {
    if (!customPart.name || !customPart.price) return
    const item: LineItem = { id: crypto.randomUUID(), description: customPart.name, qty: 1, price: parseFloat(customPart.price) }
    const updated = [...lineItems, item]
    setLineItems(updated)
    save({ lineItems: updated })
    setCustomPart({ name: '', price: '' })
    setShowPartsModal(false)
  }

  function removePart(itemId: string) {
    const updated = lineItems.filter(li => li.id !== itemId)
    setLineItems(updated)
    save({ lineItems: updated })
  }

  function saveNote() {
    save({ noteText })
  }

  const hoursLogged = elapsedSecs / 3600
  const laborTotal  = Math.ceil(hoursLogged * 10) / 10 * (job?.laborRate ?? 95)
  const partsTotal  = lineItems.reduce((s, li) => s + li.qty * li.price, 0)
  const subtotal    = laborTotal + partsTotal
  const tax         = subtotal * 0.086
  const total       = subtotal + tax

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Job not found. <Link href="/field" className="ml-2 text-primary underline">Back</Link>
      </div>
    )
  }

  if (invoiceSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Invoice Sent!</h1>
        <p className="mb-1 text-muted-foreground">
          Invoice for <span className="font-semibold text-foreground">{job.customer}</span> has been sent.
        </p>
        <p className="mb-8 text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
        <Link
          href="/field"
          className="rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to My Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Link href="/field" className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{job.id}</p>
          <p className="text-xs text-muted-foreground">{job.type}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {job.priority === 'EMERGENCY' && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
              <AlertTriangle className="h-2.5 w-2.5" /> URGENT
            </span>
          )}
          <Droplets className="h-5 w-5 text-sky-400" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Job title + status */}
        <div>
          <h1 className="text-lg font-bold leading-tight text-foreground">{job.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${fieldStatus === 'done' ? 'bg-green-500' : fieldStatus === 'in_progress' ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'}`} />
            <p className="text-sm font-medium text-muted-foreground">{FIELD_STATUS_LABELS[fieldStatus]}</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0">
          {FIELD_FLOW.slice(1).map((step, i) => {
            const currentIdx = FIELD_FLOW.indexOf(fieldStatus)
            const stepIdx = i + 1
            const done = currentIdx > stepIdx
            const active = currentIdx === stepIdx
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {done ? '✓' : i + 1}
                </div>
                {i < 3 && <div className={`h-0.5 flex-1 ${done ? 'bg-green-500' : 'bg-muted'}`} />}
              </div>
            )
          })}
        </div>
        <div className="flex text-[10px] text-muted-foreground">
          {(['En Route', 'On Site', 'Working', 'Done'] as const).map(l => (
            <p key={l} className="flex-1 text-center">{l}</p>
          ))}
        </div>

        {/* Customer info */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
          <p className="font-semibold text-foreground">{job.customer}</p>
          <div className="mt-2 space-y-1.5">
            <a href={`tel:${job.phone}`} className="flex items-center gap-2 text-sm text-primary">
              <Phone className="h-3.5 w-3.5" />
              {job.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(job.address + ', ' + job.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {job.address}, {job.city}
            </a>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {job.window} · Est. {job.estHours} hrs
            </div>
          </div>
        </div>

        {/* Job notes */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Notes</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{job.notes}</p>
        </div>

        {/* Timer */}
        {(fieldStatus === 'in_progress' || fieldStatus === 'on_site' || fieldStatus === 'done') && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Time on Job</p>
            <div className="mb-3 text-center">
              <p className="font-mono text-3xl font-bold text-foreground">{fmt(elapsedSecs)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(elapsedSecs / 3600).toFixed(2)} hrs · ${(Math.ceil(elapsedSecs / 360) / 10 * (job.laborRate)).toFixed(2)} labor
              </p>
            </div>
            {fieldStatus !== 'done' && (
              <button
                onClick={toggleTimer}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ${
                  timerRunning
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-primary/20 text-primary'
                }`}
              >
                {timerRunning ? <StopCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                {timerRunning ? 'Pause Timer' : 'Resume Timer'}
              </button>
            )}
          </div>
        )}

        {/* Parts & Materials */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parts & Materials</p>
            {fieldStatus !== 'done' && (
              <button
                onClick={() => setShowPartsModal(true)}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                <Plus className="h-3 w-3" /> Add Part
              </button>
            )}
          </div>

          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parts added yet</p>
          ) : (
            <div className="space-y-2">
              {lineItems.map(li => (
                <div key={li.id} className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="flex-1 text-sm text-foreground">{li.description}</p>
                  <p className="text-sm font-medium text-foreground">${(li.qty * li.price).toFixed(2)}</p>
                  {fieldStatus !== 'done' && (
                    <button onClick={() => removePart(li.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Field notes */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field Notes</p>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onBlur={saveNote}
            placeholder="What did you find? What did you do? Any follow-up needed?"
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Sticky bottom action */}
      {fieldStatus !== 'done' ? (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card px-4 pb-safe pt-3 pb-5">
          <div className="mx-auto max-w-md">
            <button
              onClick={advanceStatus}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground active:opacity-80"
            >
              {fieldStatus === 'in_progress' ? (
                <><CheckCircle className="h-5 w-5" /> Finish Job & Generate Invoice</>
              ) : (
                <><ChevronRight className="h-5 w-5" /> {FIELD_LABELS[fieldStatus]}</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card px-4 pb-safe pt-3 pb-5">
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setShowInvoice(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-base font-bold text-white active:opacity-80"
            >
              <FileText className="h-5 w-5" /> Review & Send Invoice
            </button>
          </div>
        </div>
      )}

      {/* Parts modal */}
      {showPartsModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60">
          <div className="w-full rounded-t-3xl bg-card p-4 pb-8 max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-foreground">Add Part or Material</p>
              <button onClick={() => setShowPartsModal(false)} className="rounded-lg p-1 text-muted-foreground hover:text-foreground text-lg">✕</button>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Common Plumbing Parts</p>
            <div className="mb-4 space-y-2">
              {QUICK_PARTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => addPart(p)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors active:bg-accent"
                >
                  <p className="text-sm text-foreground">{p.name}</p>
                  <p className="text-sm font-semibold text-primary">${p.price}</p>
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Item</p>
            <div className="flex gap-2">
              <input
                value={customPart.name}
                onChange={e => setCustomPart(p => ({ ...p, name: e.target.value }))}
                placeholder="Description"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={customPart.price}
                onChange={e => setCustomPart(p => ({ ...p, price: e.target.value }))}
                placeholder="$"
                type="number"
                className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={addCustomPart}
                className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60">
          <div className="w-full rounded-t-3xl bg-card p-4 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Invoice Preview</p>
                <p className="text-xs text-muted-foreground">{job.customer} · {job.id}</p>
              </div>
              <button onClick={() => setShowInvoice(false)} className="rounded-lg p-1 text-muted-foreground hover:text-foreground text-lg">✕</button>
            </div>

            {/* Invoice header */}
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-sky-500/10 p-3">
              <Droplets className="h-6 w-6 text-sky-400" />
              <div>
                <p className="font-semibold text-foreground">ClearFlow Plumbing</p>
                <p className="text-xs text-muted-foreground">Phoenix, AZ · (602) 555-9000</p>
              </div>
            </div>

            {/* Line items */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</p>
              </div>

              {elapsedSecs > 0 && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Labor — {job.type}</p>
                    <p className="text-xs text-muted-foreground">{(elapsedSecs / 3600).toFixed(2)} hrs × ${job.laborRate}/hr</p>
                  </div>
                  <p className="text-sm font-medium text-foreground">${laborTotal.toFixed(2)}</p>
                </div>
              )}

              {lineItems.map(li => (
                <div key={li.id} className="flex items-center justify-between">
                  <p className="text-sm text-foreground">{li.description}</p>
                  <p className="text-sm font-medium text-foreground">${(li.qty * li.price).toFixed(2)}</p>
                </div>
              ))}

              {elapsedSecs === 0 && lineItems.length === 0 && (
                <p className="py-2 text-center text-sm text-muted-foreground">No items yet — add time and parts above</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Subtotal</p>
                <p className="text-foreground">${subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Tax (8.6%)</p>
                <p className="text-foreground">${tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <p className="font-bold text-foreground">Total Due</p>
                <p className="text-xl font-bold text-primary">${total.toFixed(2)}</p>
              </div>
            </div>

            {noteText && (
              <div className="mt-3 rounded-xl bg-muted/40 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Field Notes</p>
                <p className="text-sm text-foreground">{noteText}</p>
              </div>
            )}

            <button
              onClick={() => setInvoiceSent(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-base font-bold text-white active:opacity-80"
            >
              <Send className="h-5 w-5" /> Send Invoice to Customer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
