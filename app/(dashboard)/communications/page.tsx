'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Phone, MessageSquare, Mail, PhoneIncoming, PhoneMissed,
  PhoneOutgoing, Send, User, Clock, Volume2, ArrowRight,
  CheckCheck, Plus, Globe, Sparkles, Wrench, Package,
  AlertTriangle, ChevronDown, ChevronUp, ImageIcon,
} from 'lucide-react'
import { formatDateTime, formatPhone } from '@/lib/utils'
import Link from 'next/link'

type Channel = 'ALL' | 'PHONE' | 'SMS' | 'EMAIL' | 'PORTAL'
type FilterType = 'ALL' | 'MISSED' | 'PENDING' | 'OPEN'

// ── Demo communications ──────────────────────────────────────────────────────

const COMMS = [
  // Portal inquiry — the star of this demo
  {
    id: 'portal-1',
    channel: 'PORTAL_INBOUND',
    status: 'PENDING',
    from: 'sarah.thompson@gmail.com',
    to: 'portal@clearflowplumbing.co',
    body: 'Water pooling under kitchen sink — pipe dripping at drain connection. Photo uploaded.',
    customer: { name: 'Sarah Thompson', id: null },
    createdAt: new Date(Date.now() - 22 * 60000),
    handledBy: null,
    jobId: null,
    portalData: {
      phone:       '(602) 555-7823',
      address:     '8834 N 32nd St, Phoenix AZ 85028',
      issueType:   'Water leak / pipe dripping',
      description: 'There is water pooling under my kitchen sink. I can see a pipe is dripping from what looks like the drain connection. The cabinet floor is soaked. Uploading a photo of what I can see under the sink.',
      photo:       'sink-leak-photo.jpg',
      ai: {
        summary:        'The uploaded photo shows an active water leak at the P-trap assembly under the kitchen sink. The compression slip joint on the P-trap outlet is clearly corroded and no longer forming a watertight seal — water is visibly dripping from the fitting. The drain pipe also shows significant hard-water mineral buildup (white calcium deposits) around the joint, suggesting this fitting has been leaking slowly for several weeks before becoming noticeable. The fix is straightforward: replace the P-trap assembly and compression fittings, flush and clear the drain, and test for leaks.',
        estimatedRange: '1.5 – 2.5 hours',
        estimatedHours: 2.0,
        urgency:        'medium',
        materials: [
          { item: 'P-Trap Assembly, PVC 1.5"',          qty: 1, unitCost: 12,   unitPrice: 28 },
          { item: 'Compression Slip Joints (2-pk)',      qty: 1, unitCost: 6,    unitPrice: 14 },
          { item: 'Pipe Thread Sealant',                 qty: 1, unitCost: 3,    unitPrice: 8 },
          { item: 'Drain Cleaning Treatment',            qty: 1, unitCost: 4,    unitPrice: 10 },
        ],
        laborBreakdown: [
          { task: 'Remove old P-trap & clean connections', hours: 0.5 },
          { task: 'Install new P-trap assembly',           hours: 0.5 },
          { task: 'Flush drain & leak test',               hours: 0.5 },
          { task: 'Document & customer walkthrough',       hours: 0.25 },
        ],
        scope: [
          'Turn off water supply valve under sink',
          'Remove and dispose of corroded P-trap assembly',
          'Clean drain stub-out and remove mineral deposits',
          'Install new PVC P-trap with new compression fittings',
          'Apply pipe thread sealant at all connections',
          'Flush drain with cleaning treatment',
          'Run water for 10 minutes — inspect all joints for leaks',
          'Dry and inspect cabinet interior for mold/damage',
        ],
        confidence: 91,
      },
    },
  },

  // Regular plumbing comms
  {
    id: '1',
    channel: 'PHONE_INBOUND',
    status: 'MISSED',
    from: '+16025550182',
    to: '+16025559000',
    body: null,
    customer: { name: 'Linda Chen', id: 'c1' },
    createdAt: new Date(Date.now() - 4 * 60000),
    handledBy: null,
    jobId: 'JOB-26-10021',
    portalData: null,
  },
  {
    id: '2',
    channel: 'SMS_INBOUND',
    status: 'PENDING',
    from: '+14805550501',
    to: '+16025559000',
    body: 'Hi, my toilet keeps backing up and there\'s a sewage smell from the bathroom. Should I stop using it? I\'m worried about damage.',
    customer: { name: 'Jennifer Walsh', id: 'c4' },
    createdAt: new Date(Date.now() - 12 * 60000),
    handledBy: null,
    jobId: 'JOB-26-10018',
    portalData: null,
  },
  {
    id: '3',
    channel: 'PHONE_INBOUND',
    status: 'MISSED',
    from: '+16235550091',
    to: '+16025559000',
    body: null,
    customer: { name: 'Sunrise Commercial', id: 'c3' },
    createdAt: new Date(Date.now() - 28 * 60000),
    handledBy: null,
    jobId: 'JOB-26-10019',
    portalData: null,
  },
  {
    id: '4',
    channel: 'EMAIL_INBOUND',
    status: 'PENDING',
    from: 'ops@westgatecenter.com',
    to: 'dispatch@clearflowplumbing.co',
    body: 'All drains in bathroom 3 are backing up and flooding the floor again. Can we get someone out before the weekend? We have a packed schedule Saturday.',
    customer: { name: 'Westgate Shopping Center', id: 'c5' },
    createdAt: new Date(Date.now() - 65 * 60000),
    handledBy: null,
    jobId: null,
    portalData: null,
  },
  {
    id: '5',
    channel: 'SMS_OUTBOUND',
    status: 'COMPLETED',
    from: '+16025559000',
    to: '+14805550501',
    body: 'Hi Jennifer! Yes — please stop using that toilet to prevent overflow. A plumber is on the way, estimated arrival in about 45 minutes. We\'ll diagnose the blockage first thing.',
    customer: { name: 'Jennifer Walsh', id: 'c4' },
    createdAt: new Date(Date.now() - 9 * 60000),
    handledBy: 'Grace W.',
    jobId: 'JOB-26-10018',
    portalData: null,
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const channelIcon = (ch: string) => {
  if (ch === 'PORTAL_INBOUND') return Globe
  if (ch.startsWith('PHONE'))  return Phone
  if (ch.startsWith('SMS'))    return MessageSquare
  return Mail
}

const channelColor = (ch: string) => {
  if (ch === 'PORTAL_INBOUND') return 'text-sky-400'
  if (ch.startsWith('PHONE'))  return 'text-emerald-400'
  if (ch.startsWith('SMS'))    return 'text-blue-400'
  return 'text-purple-400'
}

const directionIcon = (ch: string) => {
  if (ch.includes('INBOUND'))  return PhoneIncoming
  if (ch.includes('OUTBOUND')) return PhoneOutgoing
  return PhoneMissed
}

const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
  emergency: { label: 'Emergency',  color: 'text-red-400',    bg: 'bg-red-500/20' },
  high:      { label: 'High',       color: 'text-orange-400', bg: 'bg-orange-500/20' },
  medium:    { label: 'Today',      color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  low:       { label: 'This Week',  color: 'text-green-400',  bg: 'bg-green-500/20' },
}

// ── Sink leak SVG illustration ───────────────────────────────────────────────

function SinkLeakPhoto() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900" style={{ aspectRatio: '4/3' }}>
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        {/* Cabinet interior background */}
        <rect width="400" height="300" fill="#1a1208" />
        {/* Wood grain lines */}
        {[30, 80, 140, 200, 260, 330].map(y => (
          <line key={y} x1="0" y1={y} x2="400" y2={y + 5} stroke="#251a0a" strokeWidth="8" opacity="0.6" />
        ))}
        {/* Cabinet floor */}
        <rect x="0" y="240" width="400" height="60" fill="#2d1f0a" />
        {/* Water pooling on floor */}
        <ellipse cx="200" cy="265" rx="120" ry="18" fill="#1e4d8c" opacity="0.7" />
        <ellipse cx="200" cy="265" rx="95" ry="12" fill="#2563ab" opacity="0.5" />
        {/* Vertical drain pipe (white PVC) */}
        <rect x="175" y="30" width="28" height="215" rx="2" fill="#c8c8c8" />
        <rect x="178" y="30" width="4" height="215" fill="#e0e0e0" opacity="0.5" />
        <rect x="196" y="30" width="4" height="215" fill="#b0b0b0" opacity="0.4" />
        {/* P-trap bend */}
        <path d="M 175 180 Q 155 215 175 215 L 203 215 Q 223 215 203 180 Z"
              fill="#c0c0c0" stroke="#a0a0a0" strokeWidth="1" />
        {/* P-trap outlet (horizontal) */}
        <rect x="80" y="205" width="95" height="22" rx="2" fill="#b8b8b8" />
        <rect x="83" y="207" width="89" height="4" fill="#d0d0d0" opacity="0.5" />
        {/* Compression fitting joint — corroded, highlighted */}
        <rect x="165" y="202" width="18" height="28" rx="3" fill="#8b6914" />
        <rect x="167" y="204" width="14" height="24" rx="2" fill="#a07820" />
        {/* Mineral buildup (white calcium deposits) */}
        {[0, 1, 2, 3].map(i => (
          <ellipse key={i} cx={168 + i * 3} cy={215 + i * 2} rx="4" ry="2" fill="white" opacity="0.35" />
        ))}
        {/* Active drip / leak */}
        <ellipse cx="174" cy="232" rx="3" ry="4" fill="#60a5fa" opacity="0.9" />
        <ellipse cx="174" cy="240" rx="2" ry="3" fill="#3b82f6" opacity="0.8" />
        <ellipse cx="175" cy="247" rx="1.5" ry="2" fill="#2563ab" opacity="0.7" />
        {/* Water splatter on floor near drip */}
        {[[-8,2],[8,-1],[3,5],[-5,4]].map(([dx, dy], i) => (
          <ellipse key={i} cx={174 + dx} cy={262 + dy} rx="2" ry="1" fill="#60a5fa" opacity="0.5" />
        ))}
        {/* Supply lines */}
        <rect x="140" y="60" width="10" height="100" rx="4" fill="#c0c0c0" />
        <rect x="250" y="60" width="10" height="100" rx="4" fill="#c0c0c0" />
        {/* Shut-off valves */}
        <rect x="135" y="150" width="20" height="14" rx="3" fill="#888" />
        <rect x="245" y="150" width="20" height="14" rx="3" fill="#888" />
        {/* Drip annotation circle */}
        <circle cx="174" cy="232" r="18" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" opacity="0.9" />
        <line x1="192" y1="218" x2="220" y2="195" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <text x="222" y="192" fill="#ef4444" fontSize="11" fontFamily="sans-serif" fontWeight="bold">LEAK</text>
        {/* Mineral deposit annotation */}
        <circle cx="172" cy="217" r="14" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
        <line x1="158" y1="210" x2="130" y2="188" stroke="#fbbf24" strokeWidth="1.5" opacity="0.7" />
        <text x="50" y="185" fill="#fbbf24" fontSize="9" fontFamily="sans-serif">mineral</text>
        <text x="55" y="196" fill="#fbbf24" fontSize="9" fontFamily="sans-serif">buildup</text>
        {/* Photo metadata overlay at bottom */}
        <rect x="0" y="268" width="400" height="32" fill="black" opacity="0.65" />
        <text x="10" y="284" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="500">IMG_3847.jpg</text>
        <text x="10" y="295" fill="#aaa" fontSize="8.5" fontFamily="sans-serif">Submitted via ClearFlow Plumbing Portal · 2.4 MB · iPhone 15</text>
      </svg>
      {/* Red dot — LEAK indicator overlay */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Active Leak Detected
      </div>
    </div>
  )
}

// ── Portal detail panel ───────────────────────────────────────────────────────

function PortalDetailPanel({ comm, onCreateJob }: {
  comm: typeof COMMS[0]
  onCreateJob: () => void
}) {
  const [showScope, setShowScope] = useState(false)
  const ai = comm.portalData!.ai
  const urg = urgencyConfig[ai.urgency] ?? urgencyConfig.medium
  const laborCost = ai.estimatedHours * 95
  const matCost   = ai.materials.reduce((s, m) => s + m.unitPrice, 0)
  const subtotal  = laborCost + matCost
  const tax       = subtotal * 0.086

  return (
    <div className="flex h-full flex-col gap-0 overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-sky-400">
              {comm.customer!.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-foreground">{comm.customer!.name}</p>
              <p className="text-xs text-muted-foreground">
                {comm.portalData!.phone} · {comm.from}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="info" className="gap-1.5">
              <Globe className="h-3 w-3" /> Portal Submission
            </Badge>
            <button
              onClick={onCreateJob}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Create Job
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-0.5">{comm.portalData!.issueType}</span>
          <span className="rounded-full border border-border px-2 py-0.5">{comm.portalData!.address}</span>
          <span className={`rounded-full px-2 py-0.5 font-semibold ${urg.bg} ${urg.color}`}>
            {urg.label} priority
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Photo */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" /> Customer-Uploaded Photo
          </p>
          <SinkLeakPhoto />
        </div>

        {/* Customer description */}
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Customer Description</p>
          <p className="text-sm leading-relaxed text-foreground">{comm.portalData!.description}</p>
        </div>

        {/* AI Analysis */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="font-semibold text-foreground">AI Visual Analysis</p>
            <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
              {ai.confidence}% confidence
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{ai.summary}</p>

          {/* Estimate chips */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-background p-2.5 text-center">
              <Clock className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-foreground">{ai.estimatedRange}</p>
              <p className="text-[10px] text-muted-foreground">Est. Time</p>
            </div>
            <div className="rounded-lg bg-background p-2.5 text-center">
              <Wrench className="mx-auto mb-1 h-4 w-4 text-yellow-400" />
              <p className="text-xs font-bold text-foreground">${laborCost.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Labor @ $95/hr</p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${urg.bg}`}>
              <AlertTriangle className={`mx-auto mb-1 h-4 w-4 ${urg.color}`} />
              <p className={`text-xs font-bold ${urg.color}`}>{urg.label}</p>
              <p className="text-[10px] text-muted-foreground">Urgency</p>
            </div>
          </div>
        </div>

        {/* Labor breakdown */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Labor Breakdown
          </p>
          <div className="space-y-2">
            {ai.laborBreakdown.map((step, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="truncate text-sm text-foreground">{step.task}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {step.hours === 0.25 ? '15 min' : `${step.hours * 60} min`}
                </span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
              <p className="text-xs font-semibold text-foreground">Total Labor</p>
              <p className="text-sm font-bold text-foreground">{ai.estimatedHours} hrs</p>
            </div>
          </div>
        </div>

        {/* Materials */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Package className="h-3.5 w-3.5" /> Materials Required
          </p>
          <div className="space-y-2">
            {ai.materials.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-foreground">{m.item}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-foreground">${m.unitPrice}</p>
                  <p className="text-[10px] text-muted-foreground">cost ${m.unitCost}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scope of work (collapsible) */}
        <div className="rounded-xl border border-border bg-card">
          <button
            onClick={() => setShowScope(s => !s)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Scope of Work ({ai.scope.length} steps)
            </p>
            {showScope ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showScope && (
            <div className="border-t border-border px-4 pb-4 pt-3">
              <ol className="space-y-2">
                {ai.scope.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Cost estimate */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">Estimated Invoice</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Labor ({ai.estimatedHours} hrs @ $95/hr)</p>
              <p className="text-foreground">${laborCost.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Parts & materials</p>
              <p className="text-foreground">${matCost.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <p>Tax (8.6%)</p>
              <p>${tax.toFixed(2)}</p>
            </div>
            <div className="flex justify-between border-t border-emerald-500/20 pt-2">
              <p className="font-bold text-foreground">Total Estimate</p>
              <p className="text-xl font-bold text-emerald-400">${(subtotal + tax).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Reply templates */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Reply</p>
          <div className="space-y-2">
            {[
              `Hi Sarah! We received your request and can see the leak in your photo. We can have a technician at 8834 N 32nd St by ${new Date(Date.now() + 2 * 3600000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} today. Does that work?`,
              'We\'ve reviewed your photo and estimate this repair will take about 1.5–2 hours. The total cost including parts and labor should be around $285–$325.',
            ].map((t, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-2.5 text-xs text-muted-foreground">
                {t}
                <button className="mt-1.5 flex items-center gap-1 text-primary hover:underline">
                  <Send className="h-3 w-3" /> Use this reply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const [activeChannel, setActiveChannel] = useState<Channel>('ALL')
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')
  const [selected, setSelected] = useState<string | null>('portal-1')
  const [replyText, setReplyText] = useState('')
  const [jobCreated, setJobCreated] = useState(false)

  const filtered = COMMS.filter(c => {
    const chMatch = activeChannel === 'ALL'
      || (activeChannel === 'PORTAL' && c.channel === 'PORTAL_INBOUND')
      || (activeChannel === 'PHONE'  && c.channel.startsWith('PHONE'))
      || (activeChannel === 'SMS'    && c.channel.startsWith('SMS'))
      || (activeChannel === 'EMAIL'  && c.channel.startsWith('EMAIL'))
    const fMatch = activeFilter === 'ALL'
      || (activeFilter === 'MISSED'  && c.status === 'MISSED')
      || (activeFilter === 'PENDING' && c.status === 'PENDING')
      || (activeFilter === 'OPEN'    && ['PENDING', 'MISSED', 'IN_PROGRESS'].includes(c.status))
    return chMatch && fMatch
  })

  const selectedComm = COMMS.find(c => c.id === selected)

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* ── Left panel ── */}
      <div className="flex w-80 shrink-0 flex-col gap-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Missed',  value: COMMS.filter(c => c.status === 'MISSED').length,  color: 'text-red-400' },
            { label: 'Pending', value: COMMS.filter(c => c.status === 'PENDING').length, color: 'text-yellow-400' },
            { label: 'Today',   value: COMMS.length,                                     color: 'text-foreground' },
          ].map(s => (
            <Card key={s.label} className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Channel filter */}
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(['ALL', 'PHONE', 'SMS', 'EMAIL', 'PORTAL'] as Channel[]).map(ch => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-colors ${
                activeChannel === ch ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {(['ALL', 'MISSED', 'PENDING', 'OPEN'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
                activeFilter === f
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {filtered.map(comm => {
            const Icon     = channelIcon(comm.channel)
            const DirIcon  = directionIcon(comm.channel)
            const isMissed  = comm.status === 'MISSED'
            const isPending = comm.status === 'PENDING'
            const isPortal  = comm.channel === 'PORTAL_INBOUND'

            return (
              <button
                key={comm.id}
                onClick={() => setSelected(comm.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selected === comm.id
                    ? isPortal
                      ? 'border-sky-500/40 bg-sky-500/10'
                      : 'border-primary/50 bg-primary/10'
                    : 'border-border bg-card hover:bg-accent/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 rounded-lg p-1.5 ${
                    isMissed ? 'bg-red-500/10' : isPortal ? 'bg-sky-500/10' : 'bg-muted'
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${
                      isMissed ? 'text-red-400' : channelColor(comm.channel)
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-xs font-semibold ${
                        isMissed ? 'text-red-400' : isPortal ? 'text-sky-400' : 'text-foreground'
                      }`}>
                        {comm.customer?.name ?? formatPhone(comm.from ?? '')}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {Math.round((Date.now() - comm.createdAt.getTime()) / 60000)}m
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {comm.body ?? (isMissed ? 'Missed call' : '')}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        isMissed  ? 'bg-red-500/20 text-red-400' :
                        isPending ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {comm.status}
                      </span>
                      {isPortal
                        ? <Globe className="h-3 w-3 text-sky-400" />
                        : <DirIcon className="h-3 w-3 text-muted-foreground" />
                      }
                      {isPortal && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-sky-400">
                          <Sparkles className="h-2.5 w-2.5" /> AI analyzed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <Button size="sm" className="w-full gap-2">
          <Plus className="h-3.5 w-3.5" /> New Outbound
        </Button>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {selectedComm ? (
          selectedComm.channel === 'PORTAL_INBOUND' ? (
            // Portal submission detail
            <PortalDetailPanel
              comm={selectedComm}
              onCreateJob={() => setJobCreated(true)}
            />
          ) : (
            // Regular comm detail
            <>
              {/* Header */}
              <div className="shrink-0 border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {selectedComm.customer?.name
                        ? selectedComm.customer.name.split(' ').map(n => n[0]).join('')
                        : '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedComm.customer?.name ?? 'Unknown Caller'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPhone(selectedComm.from ?? selectedComm.to ?? '')}
                        {selectedComm.customer && ' · Existing customer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedComm.jobId ? (
                      <Link href={`/jobs/${selectedComm.jobId}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <ArrowRight className="h-3.5 w-3.5" /> View Job
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/jobs/new">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <Plus className="h-3.5 w-3.5" /> Create Job
                        </Button>
                      </Link>
                    )}
                    {selectedComm.customer ? (
                      <Link href={`/customers/${selectedComm.customer.id ?? '#'}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <User className="h-3.5 w-3.5" /> Customer
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" className="gap-1.5 text-xs">
                        <User className="h-3.5 w-3.5" /> Add Customer
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                      <Phone className="h-3.5 w-3.5" /> Call Back
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI suggestion for SMS/pending */}
              {selectedComm.body && selectedComm.status === 'PENDING' && (
                <div className="shrink-0 border-b border-border bg-primary/5 p-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-primary">AI Assessment</p>
                  </div>
                  <p className="text-sm text-foreground">
                    Likely <strong>main drain blockage or P-trap failure</strong> based on message context (backing up + sewage smell).
                    Recommend <strong>same-day dispatch</strong>. Stop use advice already sent.
                    Estimated labor: <strong>1.5–2 hours</strong>.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/jobs/new">
                      <Button size="sm" className="gap-1.5 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Create Job
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      Send Auto-Reply
                    </Button>
                  </div>
                </div>
              )}

              {/* Thread */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-border px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground">Conversation Thread</p>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {COMMS.filter(c =>
                    c.customer?.id && c.customer.id === selectedComm.customer?.id
                  ).map(msg => {
                    const isOut = msg.channel.includes('OUTBOUND')
                    return (
                      <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm rounded-xl px-4 py-2.5 ${
                          isOut ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                        }`}>
                          {msg.body ? (
                            <p className="text-sm">{msg.body}</p>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-3.5 w-3.5 opacity-70" />
                              <span className="text-xs opacity-70">
                                {msg.status === 'MISSED' ? 'Missed call' : `Call — ${'duration' in msg ? msg.duration : 0}s`}
                              </span>
                            </div>
                          )}
                          <p className={`mt-1 text-[10px] ${isOut ? 'opacity-70' : 'text-muted-foreground'}`}>
                            {formatDateTime(msg.createdAt)}
                            {isOut && msg.handledBy && ` · ${msg.handledBy}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reply box */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type a reply..."
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex flex-col gap-2">
                      <Button size="icon" className="h-9 w-9"><Send className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="outline" className="h-9 w-9"><CheckCheck className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      'Tech is on the way — ETA 45 min.',
                      'Can you confirm the address?',
                      'We\'ll need access to the main water shutoff.',
                    ].map(t => (
                      <button
                        key={t}
                        onClick={() => setReplyText(t)}
                        className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      >
                        {t.length > 35 ? t.slice(0, 35) + '…' : t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Select a communication to view details
          </div>
        )}
      </div>

      {/* Job created toast */}
      {jobCreated && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 shadow-lg">
          <CheckCheck className="h-4 w-4 text-emerald-400" />
          <p className="text-sm font-medium text-emerald-300">Job JOB-26-10022 created from portal inquiry</p>
          <button onClick={() => setJobCreated(false)} className="ml-2 text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}
    </div>
  )
}
