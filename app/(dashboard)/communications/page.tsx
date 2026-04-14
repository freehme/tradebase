'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Phone, MessageSquare, Mail, PhoneIncoming, PhoneMissed,
  PhoneOutgoing, Send, User, Clock, Search, Filter,
  Plus, RefreshCw, Volume2, ArrowRight, CheckCheck,
} from 'lucide-react'
import { formatDateTime, formatPhone } from '@/lib/utils'
import Link from 'next/link'

type Channel = 'ALL' | 'PHONE' | 'SMS' | 'EMAIL'
type Filter_ = 'ALL' | 'MISSED' | 'PENDING' | 'OPEN'

const COMMS = [
  {
    id: '1', channel: 'PHONE_INBOUND', status: 'MISSED', duration: null,
    from: '+16025550182', to: '+18005551000', body: null,
    customer: null, createdAt: new Date(Date.now() - 4 * 60000), handledBy: null,
    jobId: null,
  },
  {
    id: '2', channel: 'SMS_INBOUND', status: 'PENDING', duration: null,
    from: '+14805550234', to: '+18005551000',
    body: 'Hi, my kitchen sink is completely backed up and water is overflowing onto the floor. Can you send someone ASAP?',
    customer: { name: 'Linda Torres', id: 'c1' }, createdAt: new Date(Date.now() - 12 * 60000), handledBy: null,
    jobId: null,
  },
  {
    id: '3', channel: 'PHONE_INBOUND', status: 'COMPLETED', duration: 312,
    from: '+16235550091', to: '+18005551000', body: 'Discussed renovation quote for master bath',
    customer: { name: 'Tom Reeves', id: 'c2' }, createdAt: new Date(Date.now() - 28 * 60000), handledBy: 'Amy J.',
    jobId: 'JOB-26-10020',
  },
  {
    id: '4', channel: 'EMAIL_INBOUND', status: 'PENDING', duration: null,
    from: 'tom@tomreeves.com', to: 'office@tradebase.co',
    body: 'Following up on the bathroom renovation quote. Can we schedule the work to start next Monday?',
    customer: { name: 'Tom Reeves', id: 'c2' }, createdAt: new Date(Date.now() - 60 * 60000), handledBy: null,
    jobId: 'JOB-26-10020',
  },
  {
    id: '5', channel: 'SMS_OUTBOUND', status: 'COMPLETED', duration: null,
    from: '+18005551000', to: '+14805550234',
    body: 'Hi Linda! We received your message. A technician is available at 2pm today. Does that work for you?',
    customer: { name: 'Linda Torres', id: 'c1' }, createdAt: new Date(Date.now() - 8 * 60000), handledBy: 'System',
    jobId: null,
  },
  {
    id: '6', channel: 'PHONE_INBOUND', status: 'MISSED', duration: null,
    from: '+16025550301', to: '+18005551000', body: null,
    customer: null, createdAt: new Date(Date.now() - 45 * 60000), handledBy: null,
    jobId: null,
  },
]

const channelIcon = (ch: string) => {
  if (ch.startsWith('PHONE')) return Phone
  if (ch.startsWith('SMS'))   return MessageSquare
  return Mail
}

const channelColor = (ch: string) => {
  if (ch.startsWith('PHONE')) return 'text-emerald-400'
  if (ch.startsWith('SMS'))   return 'text-blue-400'
  return 'text-purple-400'
}

const directionIcon = (ch: string) => {
  if (ch.includes('INBOUND'))  return PhoneIncoming
  if (ch.includes('OUTBOUND')) return PhoneOutgoing
  return PhoneMissed
}

export default function CommunicationsPage() {
  const [activeChannel, setActiveChannel] = useState<Channel>('ALL')
  const [activeFilter, setActiveFilter] = useState<Filter_>('ALL')
  const [selected, setSelected] = useState<string | null>('2')
  const [replyText, setReplyText] = useState('')

  const filtered = COMMS.filter(c => {
    const chMatch = activeChannel === 'ALL'
      || (activeChannel === 'PHONE' && c.channel.startsWith('PHONE'))
      || (activeChannel === 'SMS'   && c.channel.startsWith('SMS'))
      || (activeChannel === 'EMAIL' && c.channel.startsWith('EMAIL'))
    const fMatch = activeFilter === 'ALL'
      || (activeFilter === 'MISSED'  && c.status === 'MISSED')
      || (activeFilter === 'PENDING' && c.status === 'PENDING')
      || (activeFilter === 'OPEN'    && ['PENDING', 'MISSED', 'IN_PROGRESS'].includes(c.status))
    return chMatch && fMatch
  })

  const selectedComm = COMMS.find(c => c.id === selected)

  const pendingCount = COMMS.filter(c => ['PENDING', 'MISSED'].includes(c.status)).length

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left panel — comm list */}
      <div className="flex w-80 flex-col gap-3">
        {/* Stats row */}
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
          {(['ALL', 'PHONE', 'SMS', 'EMAIL'] as Channel[]).map(ch => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                activeChannel === ch ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {(['ALL', 'MISSED', 'PENDING', 'OPEN'] as Filter_[]).map(f => (
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

        {/* Comm list */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {filtered.map(comm => {
            const Icon = channelIcon(comm.channel)
            const DirIcon = directionIcon(comm.channel)
            const isMissed = comm.status === 'MISSED'
            const isPending = comm.status === 'PENDING'
            return (
              <button
                key={comm.id}
                onClick={() => setSelected(comm.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selected === comm.id
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border bg-card hover:border-border/80 hover:bg-accent/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 rounded-lg p-1.5 ${isMissed ? 'bg-red-500/10' : 'bg-muted'}`}>
                    <Icon className={`h-3.5 w-3.5 ${isMissed ? 'text-red-400' : channelColor(comm.channel)}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-xs font-semibold ${isMissed ? 'text-red-400' : 'text-foreground'}`}>
                        {comm.customer?.name ?? formatPhone(comm.from ?? '')}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {Math.round((Date.now() - comm.createdAt.getTime()) / 60000)}m
                      </span>
                    </div>
                    {comm.body && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{comm.body}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        isMissed ? 'bg-red-500/20 text-red-400' :
                        isPending ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {comm.status}
                      </span>
                      <DirIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* New comm button */}
        <Button size="sm" className="w-full gap-2">
          <Plus className="h-3.5 w-3.5" /> New Outbound
        </Button>
      </div>

      {/* Right panel — conversation */}
      <div className="flex flex-1 flex-col gap-4">
        {selectedComm ? (
          <>
            {/* Header */}
            <Card className="shrink-0">
              <CardContent className="p-4">
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
                      <Link href={`/customers/${selectedComm.customer.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <User className="h-3.5 w-3.5" /> Customer
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/customers/new">
                        <Button size="sm" className="gap-1.5 text-xs">
                          <User className="h-3.5 w-3.5" /> Add Customer
                        </Button>
                      </Link>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                      <Phone className="h-3.5 w-3.5" /> Call Back
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Quick Assessment */}
            {selectedComm.body && selectedComm.status === 'PENDING' && (
              <Card className="shrink-0 border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <p className="mb-2 text-xs font-semibold text-primary">AI Assessment Suggestion</p>
                  <p className="text-sm text-foreground">
                    Based on the message, this appears to be a <strong>plumbing emergency</strong> (blocked drain / overflow).
                    Suggested response time: <strong>same-day</strong>. Estimated labor: <strong>2–4 hours</strong>.
                    Recommended trade: <strong>Licensed Plumber</strong>.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Create Emergency Job
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      Send Auto-Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message thread */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-sm">Conversation Thread</CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col p-0">
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {COMMS.filter(c =>
                    c.customer?.id === selectedComm.customer?.id ||
                    c.from === selectedComm.from ||
                    c.to === selectedComm.from
                  ).map(msg => {
                    const isOutbound = msg.channel.includes('OUTBOUND')
                    return (
                      <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm rounded-xl px-4 py-2.5 ${
                          isOutbound
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground'
                        }`}>
                          {msg.body ? (
                            <p className="text-sm">{msg.body}</p>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-3.5 w-3.5 opacity-70" />
                              <span className="text-xs opacity-70">
                                {msg.status === 'MISSED' ? 'Missed call' : `Call — ${msg.duration}s`}
                              </span>
                            </div>
                          )}
                          <p className={`mt-1 text-[10px] ${isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatDateTime(msg.createdAt)}
                            {isOutbound && msg.handledBy && ` · ${msg.handledBy}`}
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
                      <Button size="icon" className="h-9 w-9">
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-9 w-9" title="Mark complete">
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {[
                      'We\'ll have someone out within 2 hours.',
                      'Can you send photos of the issue?',
                      'What is the best time for a technician to arrive?',
                    ].map(t => (
                      <button
                        key={t}
                        onClick={() => setReplyText(t)}
                        className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      >
                        {t.length > 30 ? t.slice(0, 30) + '…' : t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Select a communication to view details
          </div>
        )}
      </div>
    </div>
  )
}
