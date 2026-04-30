'use client'

import { useState, useEffect } from 'react'
import { Droplets, MapPin, Clock, AlertTriangle, ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'

const TECHS = [
  { id: 'carlos', name: 'Carlos Martinez', initials: 'CM', color: 'bg-blue-500' },
  { id: 'dana',   name: 'Dana Lee',        initials: 'DL', color: 'bg-purple-500' },
  { id: 'phil',   name: 'Phil Torres',     initials: 'PT', color: 'bg-green-500' },
  { id: 'amy',    name: 'Amy Johnson',     initials: 'AJ', color: 'bg-orange-500' },
  { id: 'sam',    name: 'Sam Kim',         initials: 'SK', color: 'bg-pink-500' },
]

const JOBS_BY_TECH: Record<string, string[]> = {
  carlos: ['JOB-26-10021', 'JOB-26-10015'],
  dana:   ['JOB-26-10018', 'JOB-26-10020'],
  phil:   ['JOB-26-10019'],
  amy:    ['JOB-26-10017'],
  sam:    ['JOB-26-10017', 'JOB-26-10019'],
}

const ALL_JOBS = [
  {
    id:         'JOB-26-10021',
    title:      'Kitchen Drain Blockage — Sewage Backup',
    customer:   'Linda Chen',
    phone:      '(602) 555-0182',
    address:    '412 Cactus Wren Dr',
    city:       'Phoenix, AZ 85016',
    status:     'IN_PROGRESS',
    priority:   'EMERGENCY',
    type:       'Drain Clearing',
    window:     '8:00 – 11:00 AM',
    estHours:   3,
    notes:      'Active sewage backup from kitchen drain. Possible main line blockage. Snake and camera scope needed.',
  },
  {
    id:         'JOB-26-10015',
    title:      'Emergency Burst Pipe — No Water',
    customer:   'Derek Okafor',
    phone:      '(480) 555-0300',
    address:    '2210 W Thunderbird Rd',
    city:       'Phoenix, AZ 85023',
    status:     'SCHEDULED',
    priority:   'EMERGENCY',
    type:       'Burst Pipe',
    window:     '1:00 – 5:00 PM',
    estHours:   4,
    notes:      'Elderly resident. Complete water loss. Likely main shutoff valve failure or burst supply line.',
  },
  {
    id:         'JOB-26-10018',
    title:      'Water Heater Diagnosis',
    customer:   'Jennifer Walsh',
    phone:      '(480) 555-0501',
    address:    '55 Palo Verde Ct',
    city:       'Mesa, AZ 85201',
    status:     'ASSESSMENT',
    priority:   'MEDIUM',
    type:       'Water Heater',
    window:     '10:00 AM – 12:00 PM',
    estHours:   2,
    notes:      'No hot water. 8-year-old Bradford White 40-gal gas. Check pilot and thermocouple.',
  },
  {
    id:         'JOB-26-10020',
    title:      'Annual Plumbing Inspection',
    customer:   'Robert Martinez',
    phone:      '(480) 555-0234',
    address:    '88 Desert Sage Ln',
    city:       'Scottsdale, AZ 85251',
    status:     'SCHEDULED',
    priority:   'MEDIUM',
    type:       'Maintenance',
    window:     '2:00 – 4:00 PM',
    estHours:   2,
    notes:      'Annual maintenance contract. 3 rental units. Check fixtures, supply lines, water heater.',
  },
  {
    id:         'JOB-26-10019',
    title:      'Full Repiping — Commercial',
    customer:   'Sunrise Commercial',
    phone:      '(623) 555-0091',
    address:    '1200 E Apache Blvd',
    city:       'Tempe, AZ 85281',
    status:     'QUOTED',
    priority:   'HIGH',
    type:       'Repiping',
    window:     'All Day',
    estHours:   14,
    notes:      'Full PEX repipe of Building B. Galvanized supply lines failing. Quote approved pending scheduling.',
  },
  {
    id:         'JOB-26-10017',
    title:      'Sewer Line Hydro-Jet Clean',
    customer:   'Westgate Shopping Center',
    phone:      '(623) 555-0050',
    address:    '6751 N Sunset Blvd',
    city:       'Glendale, AZ 85305',
    status:     'COMPLETED',
    priority:   'LOW',
    type:       'Hydro-Jetting',
    window:     'Completed',
    estHours:   24,
    notes:      'All 4 main sewer lines hydro-jetted and camera scoped.',
  },
]

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: 'bg-orange-500/20 text-orange-300',
  SCHEDULED:   'bg-blue-500/20 text-blue-300',
  ASSESSMENT:  'bg-purple-500/20 text-purple-300',
  QUOTED:      'bg-yellow-500/20 text-yellow-300',
  COMPLETED:   'bg-green-500/20 text-green-300',
}

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  SCHEDULED:   'Scheduled',
  ASSESSMENT:  'Assessment',
  QUOTED:      'Quoted',
  COMPLETED:   'Completed',
}

export default function FieldPage() {
  const [techId, setTechId] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const saved = localStorage.getItem('field-tech-id')
    if (saved) setTechId(saved)
    const h = new Date().getHours()
    if (h >= 12 && h < 17) setGreeting('Good afternoon')
    else if (h >= 17) setGreeting('Good evening')
  }, [])

  function login(id: string) {
    localStorage.setItem('field-tech-id', id)
    setTechId(id)
  }

  function logout() {
    localStorage.removeItem('field-tech-id')
    setTechId(null)
  }

  if (!techId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500">
            <Droplets className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">ClearFlow Plumbing</p>
            <p className="text-xs text-muted-foreground">Field App</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">Select your name to view today&apos;s jobs</p>

        <div className="w-full max-w-sm space-y-3">
          {TECHS.map(t => (
            <button
              key={t.id}
              onClick={() => login(t.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-accent"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}>
                {t.initials}
              </div>
              <div>
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">Plumber</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Not your name?{' '}
          <Link href="/dashboard" className="text-primary underline">Open dispatcher dashboard</Link>
        </p>
      </div>
    )
  }

  const tech = TECHS.find(t => t.id === techId)!
  const myJobIds = JOBS_BY_TECH[techId] ?? []
  const myJobs = ALL_JOBS.filter(j => myJobIds.includes(j.id))
  const activeJobs = myJobs.filter(j => j.status !== 'COMPLETED')
  const doneJobs   = myJobs.filter(j => j.status === 'COMPLETED')

  const emergencyCount = activeJobs.filter(j => j.priority === 'EMERGENCY').length

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${tech.color}`}>
              {tech.initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{tech.name}</p>
              <p className="text-xs text-muted-foreground">ClearFlow Plumbing</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
            title="Switch technician"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Greeting + date */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">{greeting}, {tech.name.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats strip */}
      <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{activeJobs.length}</p>
          <p className="text-[10px] text-muted-foreground">Today&apos;s Jobs</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${emergencyCount > 0 ? 'border-red-500/40 bg-red-500/10' : 'border-border bg-card'}`}>
          <p className={`text-xl font-bold ${emergencyCount > 0 ? 'text-red-400' : 'text-foreground'}`}>{emergencyCount}</p>
          <p className="text-[10px] text-muted-foreground">Emergency</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-green-400">{doneJobs.length}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Emergency banner */}
      {emergencyCount > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <p className="text-xs font-medium text-red-300">{emergencyCount} emergency job{emergencyCount > 1 ? 's' : ''} — respond immediately</p>
        </div>
      )}

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div className="px-4 pb-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Jobs</p>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {doneJobs.length > 0 && (
        <div className="px-4 pb-8 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Today</p>
          <div className="space-y-3 opacity-60">
            {doneJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {activeJobs.length === 0 && doneJobs.length === 0 && (
        <div className="px-4 py-16 text-center">
          <Droplets className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No jobs assigned today</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Contact dispatch for assignments</p>
        </div>
      )}
    </div>
  )
}

function JobCard({ job }: { job: typeof ALL_JOBS[0] }) {
  return (
    <Link href={`/field/job/${job.id}`}>
      <div className="rounded-2xl border border-border bg-card p-4 transition-colors active:bg-accent">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {job.priority === 'EMERGENCY' && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  <AlertTriangle className="h-2.5 w-2.5" /> URGENT
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[job.status] ?? 'bg-muted text-muted-foreground'}`}>
                {STATUS_LABEL[job.status] ?? job.status}
              </span>
            </div>
            <p className="mt-1.5 font-semibold leading-snug text-foreground">{job.title}</p>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        <p className="mb-2 text-sm font-medium text-primary">{job.customer}</p>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{job.address}, {job.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{job.window} · Est. {job.estHours} hr{job.estHours !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
