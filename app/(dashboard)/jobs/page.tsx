'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search, Filter, Plus, MapPin, Clock, User,
  AlertTriangle, ChevronRight, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const JOBS = [
  {
    id: 'JOB-26-10021', title: 'Kitchen Pipe Burst', type: 'REPAIR', status: 'IN_PROGRESS', priority: 'EMERGENCY',
    customer: 'Maria Santos', address: '412 Oak St, Phoenix AZ 85001',
    estimatedHours: 4, estimatedCost: 2400, scheduledStart: new Date(),
    tech: 'Carlos M.', createdAt: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: 'JOB-26-10020', title: 'Master Bath Renovation', type: 'RENOVATION', status: 'SCHEDULED', priority: 'MEDIUM',
    customer: 'Tom Reeves', address: '88 Maple Ave, Scottsdale AZ 85251',
    estimatedHours: 120, estimatedCost: 18500, scheduledStart: new Date(Date.now() + 2 * 86400000),
    tech: 'Dana L.', createdAt: new Date(Date.now() - 5 * 86400000),
  },
  {
    id: 'JOB-26-10019', title: 'Panel Upgrade 200A', type: 'REPAIR', status: 'QUOTED', priority: 'HIGH',
    customer: 'ABC Rentals LLC', address: '1200 Commerce Dr, Tempe AZ 85281',
    estimatedHours: 8, estimatedCost: 3200, scheduledStart: null,
    tech: null, createdAt: new Date(Date.now() - 1 * 86400000),
  },
  {
    id: 'JOB-26-10018', title: 'HVAC Full Replacement', type: 'REPAIR', status: 'ASSESSMENT', priority: 'MEDIUM',
    customer: 'Jennifer Park', address: '55 Birch Ln, Mesa AZ 85201',
    estimatedHours: null, estimatedCost: null, scheduledStart: null,
    tech: null, createdAt: new Date(Date.now() - 3 * 3600000),
  },
  {
    id: 'JOB-26-10017', title: 'Roof Repair Section B', type: 'REPAIR', status: 'COMPLETED', priority: 'LOW',
    customer: 'Westside HOA', address: '900 River Rd, Glendale AZ 85301',
    estimatedHours: 16, estimatedCost: 6700, scheduledStart: new Date(Date.now() - 1 * 86400000),
    tech: 'Phil T.', createdAt: new Date(Date.now() - 7 * 86400000),
  },
  {
    id: 'JOB-26-10016', title: 'Bathroom Tile Work', type: 'RENOVATION', status: 'INQUIRY', priority: 'LOW',
    customer: 'Sandra Kim', address: '22 Elm St, Chandler AZ 85224',
    estimatedHours: null, estimatedCost: null, scheduledStart: null,
    tech: null, createdAt: new Date(Date.now() - 30 * 60000),
  },
]

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'destructive' | 'outline' | 'secondary' }> = {
  INQUIRY:     { label: 'Inquiry',     variant: 'info' },
  ASSESSMENT:  { label: 'Assessment',  variant: 'default' },
  QUOTED:      { label: 'Quoted',      variant: 'warning' },
  APPROVED:    { label: 'Approved',    variant: 'success' },
  SCHEDULED:   { label: 'Scheduled',  variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED:   { label: 'Completed',   variant: 'success' },
  CANCELLED:   { label: 'Cancelled',   variant: 'destructive' },
  INVOICED:    { label: 'Invoiced',    variant: 'default' },
  PAID:        { label: 'Paid',        variant: 'success' },
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW:       'text-slate-400',
  MEDIUM:    'text-yellow-400',
  HIGH:      'text-orange-400',
  EMERGENCY: 'text-red-400',
}

const STATUSES = ['ALL', 'INQUIRY', 'ASSESSMENT', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filtered = JOBS.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.customer.toLowerCase().includes(q) || j.id.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'ALL' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, customers, ID..."
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto">
          {STATUSES.slice(0, 5).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'ALL' ? 'All Jobs' : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <Link href="/jobs/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Job
          </Button>
        </Link>
      </div>

      {/* Job count */}
      <p className="text-xs text-muted-foreground">{filtered.length} job{filtered.length !== 1 ? 's' : ''}</p>

      {/* Jobs list */}
      <div className="space-y-2">
        {filtered.map(job => {
          const cfg = STATUS_CONFIG[job.status]
          return (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Priority indicator */}
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      job.priority === 'EMERGENCY' ? 'bg-red-500 animate-pulse' :
                      job.priority === 'HIGH'      ? 'bg-orange-500' :
                      job.priority === 'MEDIUM'    ? 'bg-yellow-500' : 'bg-slate-500'
                    }`} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{job.title}</p>
                            {job.priority === 'EMERGENCY' && (
                              <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                <AlertTriangle className="h-3 w-3" /> EMERGENCY
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{job.id} · {job.type}</p>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {job.customer}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {job.address}
                        </span>
                        {job.estimatedHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {job.estimatedHours} hrs
                          </span>
                        )}
                        {job.estimatedCost && (
                          <span className="font-medium text-foreground">{formatCurrency(job.estimatedCost)}</span>
                        )}
                        {job.tech && (
                          <span className="flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" /> {job.tech}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
