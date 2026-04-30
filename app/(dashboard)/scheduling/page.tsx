'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft, ChevronRight, MapPin, Clock,
  User, Phone, CheckCircle, Navigation, AlertTriangle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 7am–5pm

const TECHS = [
  { id: 't1', name: 'Carlos M.',  trade: 'Plumbing',         color: 'bg-blue-500' },
  { id: 't2', name: 'Dana L.',    trade: 'Plumbing',         color: 'bg-indigo-500' },
  { id: 't3', name: 'Phil T.',    trade: 'Plumbing',         color: 'bg-cyan-500' },
  { id: 't4', name: 'Amy J.',     trade: 'Drain Specialist', color: 'bg-emerald-500' },
  { id: 't5', name: 'Sam K.',     trade: 'Plumbing',         color: 'bg-purple-500' },
  { id: 't6', name: 'Rick O.',    trade: 'Pipe Fitting',     color: 'bg-orange-500' },
]

const JOBS_TODAY = [
  {
    id: 'JOB-26-10021', title: 'Kitchen P-Trap Leak', customer: 'Maria Santos',
    address: '412 Oak St, Phoenix', techId: 't1', startHour: 8, durationHours: 1.5,
    status: 'ON_SITE', priority: 'EMERGENCY', phone: '(602) 555-0182',
    lat: 33.45, lng: -112.07,
  },
  {
    id: 'JOB-26-10015', title: 'Water Heater Replacement', customer: 'Bob Chen',
    address: '88 Maple Ave, Scottsdale', techId: 't2', startHour: 9, durationHours: 3,
    status: 'EN_ROUTE', priority: 'HIGH', phone: '(480) 555-0234',
    lat: 33.49, lng: -111.93,
  },
  {
    id: 'JOB-26-10019', title: 'Main Line Hydro-Jetting', customer: 'ABC Rentals',
    address: '1200 Commerce Dr, Tempe', techId: 't3', startHour: 11, durationHours: 3,
    status: 'CONFIRMED', priority: 'HIGH', phone: '(623) 555-0091',
    lat: 33.43, lng: -111.94,
  },
  {
    id: 'JOB-26-10018', title: 'Water Heater Leak Assess', customer: 'Jennifer Park',
    address: '55 Birch Ln, Mesa', techId: 't4', startHour: 13, durationHours: 2,
    status: 'CONFIRMED', priority: 'MEDIUM', phone: '(480) 555-0501',
    lat: 33.42, lng: -111.83,
  },
  {
    id: 'JOB-26-10022', title: 'Slab Leak Detection', customer: 'Westside HOA',
    address: '900 River Rd, Glendale', techId: 't6', startHour: 15, durationHours: 2.5,
    status: 'TENTATIVE', priority: 'LOW', phone: '(623) 555-0050',
    lat: 33.53, lng: -112.19,
  },
]

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'info' | 'outline' | 'default'> = {
  ON_SITE:   'success',
  EN_ROUTE:  'warning',
  CONFIRMED: 'info',
  TENTATIVE: 'outline',
  COMPLETED: 'success',
  NO_SHOW:   'default',
}

const STATUS_DOT: Record<string, string> = {
  ON_SITE:   'bg-emerald-500 animate-pulse',
  EN_ROUTE:  'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  TENTATIVE: 'bg-muted-foreground',
  COMPLETED: 'bg-emerald-500',
}

export default function SchedulingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [view, setView] = useState<'gantt' | 'map'>('gantt')

  const job = JOBS_TODAY.find(j => j.id === selectedJob)

  const offsetDay = (d: number) =>
    setSelectedDate(prev => { const n = new Date(prev); n.setDate(n.getDate() + d); return n })

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Main scheduling view */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => offsetDay(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">{formatDate(selectedDate)}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => offsetDay(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {(['gantt', 'map'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {v === 'gantt' ? 'Timeline' : 'Map View'}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {JOBS_TODAY.length} jobs · {TECHS.length} techs scheduled
          </div>
        </div>

        {view === 'gantt' ? (
          /* Gantt / Timeline */
          <Card className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
              {/* Hour header */}
              <div className="flex border-b border-border bg-muted/40 sticky top-0 z-10">
                <div className="w-36 shrink-0 border-r border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Technician
                </div>
                {HOURS.map(h => (
                  <div key={h} className="flex-1 min-w-16 border-r border-border/50 px-2 py-2 text-center text-xs text-muted-foreground">
                    {h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}
                  </div>
                ))}
              </div>

              {/* Tech rows */}
              {TECHS.map(tech => {
                const techJobs = JOBS_TODAY.filter(j => j.techId === tech.id)
                return (
                  <div key={tech.id} className="flex border-b border-border/50 hover:bg-accent/20 transition-colors min-h-[64px]">
                    <div className="w-36 shrink-0 border-r border-border px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${tech.color}`} />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{tech.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tech.trade}</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 min-w-0">
                      {techJobs.map(job => {
                        const startPct = ((job.startHour - 7) / HOURS.length) * 100
                        const widthPct = (job.durationHours / HOURS.length) * 100
                        return (
                          <button
                            key={job.id}
                            onClick={() => setSelectedJob(job.id)}
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                            className={`absolute top-2 bottom-2 rounded-md px-2 py-1 text-left text-[10px] font-semibold text-white transition-opacity hover:opacity-80 ${tech.color} ${
                              selectedJob === job.id ? 'ring-2 ring-white/50' : ''
                            }`}
                          >
                            <p className="truncate">{job.title}</p>
                            <p className="truncate opacity-80">{job.customer}</p>
                          </button>
                        )
                      })}
                      {techJobs.length === 0 && (
                        <div className="flex h-full items-center px-4">
                          <span className="text-xs text-muted-foreground italic">No jobs scheduled</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          /* Map View */
          <Card className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center space-y-3">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Google Maps — Technician Locations</p>
                <p className="text-xs text-muted-foreground">
                  Real-time GPS tracking for all {TECHS.length} technicians<br />
                  Configure GOOGLE_MAPS_API_KEY in environment variables
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {JOBS_TODAY.map(j => (
                    <div key={j.id} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[j.status]}`} />
                      {j.address.split(',')[0]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Right panel — Job detail */}
      <div className="w-72 flex flex-col gap-3">
        <Card className="shrink-0">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Status</p>
            <div className="space-y-2">
              {[
                { label: 'On Site',   count: JOBS_TODAY.filter(j => j.status === 'ON_SITE').length,   dot: 'bg-emerald-500 animate-pulse' },
                { label: 'En Route',  count: JOBS_TODAY.filter(j => j.status === 'EN_ROUTE').length,  dot: 'bg-yellow-500' },
                { label: 'Confirmed', count: JOBS_TODAY.filter(j => j.status === 'CONFIRMED').length, dot: 'bg-blue-500' },
                { label: 'Tentative', count: JOBS_TODAY.filter(j => j.status === 'TENTATIVE').length, dot: 'bg-muted-foreground' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {job ? (
          <Card className="flex-1 overflow-y-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{job.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{job.id}</p>
                </div>
                <Badge variant={STATUS_BADGE[job.status]}>{job.status.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs">
                {[
                  { icon: User,      label: 'Customer',   val: job.customer },
                  { icon: Phone,     label: 'Phone',      val: job.phone },
                  { icon: MapPin,    label: 'Address',    val: job.address },
                  { icon: Clock,     label: 'Time',       val: `${job.startHour > 12 ? job.startHour - 12 : job.startHour}:00 ${job.startHour >= 12 ? 'PM' : 'AM'} · ${job.durationHours}h` },
                ].map(r => {
                  const Icon = r.icon
                  return (
                    <div key={r.label} className="flex gap-2">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">{r.label}</p>
                        <p className="font-medium text-foreground">{r.val}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {job.priority === 'EMERGENCY' && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">Emergency priority</span>
                </div>
              )}

              <div className="space-y-2">
                <Button size="sm" className="w-full gap-2">
                  <Navigation className="h-3.5 w-3.5" /> Get Directions
                </Button>
                <Button size="sm" variant="outline" className="w-full gap-2">
                  <Phone className="h-3.5 w-3.5" /> Call Customer
                </Button>
                <Button size="sm" variant="outline" className="w-full gap-2">
                  <CheckCircle className="h-3.5 w-3.5" /> Mark Completed
                </Button>
              </div>

              {/* Customer location confirmation */}
              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Customer Confirmation</p>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  Location verified with customer
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  Arrival window confirmed (1hr)
                </label>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Click a job to view details</p>
          </Card>
        )}
      </div>
    </div>
  )
}
