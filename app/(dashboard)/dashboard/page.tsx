import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Phone, ClipboardList, Calendar, DollarSign,
  TrendingUp, AlertTriangle, Clock, Users,
  CheckCircle, Wrench, ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

// In production these come from the DB via server actions
const stats = [
  {
    label: 'Active Jobs',
    value: '47',
    sub: '8 emergency',
    icon: ClipboardList,
    trend: '+12%',
    href: '/jobs',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Today\'s Revenue',
    value: formatCurrency(18_450),
    sub: 'vs $14,200 yesterday',
    icon: DollarSign,
    trend: '+30%',
    href: '/billing',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    label: 'Technicians On-Site',
    value: '32 / 125',
    sub: '12 en route',
    icon: Users,
    trend: '',
    href: '/scheduling',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    label: 'Open Comms',
    value: '14',
    sub: '3 missed calls',
    icon: Phone,
    trend: '',
    href: '/communications',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
]

const recentJobs = [
  { id: 'JOB-26-10021', title: 'Kitchen P-Trap Leak',    customer: 'Maria Santos',    status: 'IN_PROGRESS', priority: 'EMERGENCY', est: '$340',    type: 'REPAIR' },
  { id: 'JOB-26-10020', title: 'Master Bath Re-pipe',    customer: 'Tom Reeves',      status: 'SCHEDULED',   priority: 'MEDIUM',    est: '$4,800',  type: 'RENOVATION' },
  { id: 'JOB-26-10019', title: 'Main Line Hydro-Jet',    customer: 'ABC Rentals LLC', status: 'QUOTED',      priority: 'HIGH',      est: '$1,100',  type: 'REPAIR' },
  { id: 'JOB-26-10018', title: 'Water Heater Leak Assess', customer: 'Jennifer Park', status: 'ASSESSMENT',  priority: 'MEDIUM',    est: '—',       type: 'REPAIR' },
  { id: 'JOB-26-10017', title: 'Sewer Line Camera Scope', customer: 'Westside HOA',   status: 'COMPLETED',   priority: 'LOW',       est: '$650',    type: 'INSPECTION' },
]

const upcomingSchedule = [
  { time: '8:00 AM', job: 'JOB-26-10021', tech: 'Carlos M.', address: '412 Oak St', status: 'ON_SITE' },
  { time: '9:30 AM', job: 'JOB-26-10015', tech: 'Dana L.',   address: '88 Maple Ave', status: 'EN_ROUTE' },
  { time: '11:00 AM', job: 'JOB-26-10019', tech: 'Phil T.',  address: '1200 Commerce Dr', status: 'CONFIRMED' },
  { time: '1:00 PM', job: 'JOB-26-10018', tech: 'Amy J.',    address: '55 Birch Ln', status: 'CONFIRMED' },
  { time: '3:30 PM', job: 'JOB-26-10022', tech: 'Sam K.',    address: '900 River Rd', status: 'TENTATIVE' },
]

const statusColors: Record<string, string> = {
  INQUIRY:     'info',
  ASSESSMENT:  'default',
  QUOTED:      'warning',
  APPROVED:    'success',
  SCHEDULED:   'info',
  IN_PROGRESS: 'warning',
  COMPLETED:   'success',
  CANCELLED:   'destructive',
}

const scheduleColors: Record<string, string> = {
  ON_SITE:   'text-emerald-400',
  EN_ROUTE:  'text-yellow-400',
  CONFIRMED: 'text-blue-400',
  TENTATIVE: 'text-muted-foreground',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${s.bg}`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                  </div>
                  {s.trend && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      {s.trend} vs last week
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Alert banner for emergencies */}
      <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
        <p className="text-sm text-red-300">
          <span className="font-semibold">2 Emergency jobs</span> require immediate dispatch —{' '}
          <Link href="/jobs?filter=emergency" className="underline hover:text-red-200">
            View now
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Jobs */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Recent Jobs
            </CardTitle>
            <Link href="/jobs" className="flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Job</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Customer</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium text-muted-foreground">Est.</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map(job => (
                  <tr key={job.id} className="border-b border-border/50 hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-foreground hover:text-primary">
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.id}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{job.customer}</td>
                    <td className="px-3 py-3">
                      <Badge variant={statusColors[job.status] as 'info' | 'warning' | 'success' | 'destructive' | 'default'}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-foreground">{job.est}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today's Schedule
            </CardTitle>
            <Link href="/scheduling" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Full view <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSchedule.map(s => (
              <div key={s.time} className="flex items-start gap-3">
                <div className="w-16 shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground">{s.time}</p>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{s.job}</p>
                    <span className={`text-[10px] font-bold ${scheduleColors[s.status]}`}>{s.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.tech} · {s.address}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Open communications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              Open Communications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { type: 'Missed Call',   from: '+1 (602) 555-0182', ago: '4 min ago',  color: 'text-red-400' },
              { type: 'Inbound SMS',   from: '+1 (480) 555-0234', ago: '12 min ago', color: 'text-yellow-400' },
              { type: 'Missed Call',   from: '+1 (623) 555-0091', ago: '28 min ago', color: 'text-red-400' },
              { type: 'Inbound Email', from: 'tom@example.com',   ago: '1 hr ago',   color: 'text-blue-400' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border p-2.5">
                <div>
                  <p className={`text-xs font-semibold ${c.color}`}>{c.type}</p>
                  <p className="text-xs text-muted-foreground">{c.from}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{c.ago}</p>
              </div>
            ))}
            <Link href="/communications" className="block pt-1 text-center text-xs text-primary hover:underline">
              View all communications
            </Link>
          </CardContent>
        </Card>

        {/* Inventory alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-primary" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { item: 'PVC 3/4" Pipe (10ft)', qty: '2 left', status: 'CRITICAL' },
              { item: '20A Circuit Breaker',  qty: '5 left', status: 'LOW' },
              { item: 'Drywall 4x8 Sheet',    qty: '8 left', status: 'LOW' },
              { item: 'HVAC Filter 20x25',    qty: '0 left', status: 'OUT' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border p-2.5">
                <p className="text-xs text-foreground">{a.item}</p>
                <Badge variant={a.status === 'OUT' ? 'destructive' : a.status === 'CRITICAL' ? 'destructive' : 'warning'} className="text-[10px]">
                  {a.qty}
                </Badge>
              </div>
            ))}
            <Link href="/inventory" className="block pt-1 text-center text-xs text-primary hover:underline">
              Manage inventory
            </Link>
          </CardContent>
        </Card>

        {/* Billing summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              Billing Summary (Month)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Invoiced',   value: '$142,800', color: 'text-foreground' },
              { label: 'Collected',  value: '$118,250', color: 'text-emerald-400' },
              { label: 'Overdue',    value: '$14,100',  color: 'text-red-400' },
              { label: 'Pending',    value: '$10,450',  color: 'text-yellow-400' },
            ].map(b => (
              <div key={b.label} className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className={`text-sm font-bold ${b.color}`}>{b.value}</p>
              </div>
            ))}
            <div className="mt-2 h-1.5 w-full rounded-full bg-border">
              <div className="h-1.5 w-[83%] rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs text-muted-foreground">83% collected this month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
