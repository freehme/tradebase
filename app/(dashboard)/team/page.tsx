'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Plus, Phone, Mail } from 'lucide-react'
import { formatPhone } from '@/lib/utils'

const TEAM = [
  { id: 'u1', name: 'Carlos Martinez',  role: 'TECHNICIAN', trade: 'Plumbing',   phone: '6025551001', email: 'carlos@tradebase.co',  status: 'ON_SITE',    activeJob: 'JOB-26-10021', rate: 45 },
  { id: 'u2', name: 'Dana Lee',         role: 'TECHNICIAN', trade: 'Plumbing',   phone: '4805551002', email: 'dana@tradebase.co',    status: 'EN_ROUTE',   activeJob: 'JOB-26-10015', rate: 45 },
  { id: 'u3', name: 'Phil Torres',      role: 'TECHNICIAN', trade: 'Electrical', phone: '6235551003', email: 'phil@tradebase.co',    status: 'AVAILABLE',  activeJob: null,           rate: 50 },
  { id: 'u4', name: 'Amy Johnson',      role: 'TECHNICIAN', trade: 'HVAC',       phone: '4805551004', email: 'amy@tradebase.co',     status: 'ON_SITE',    activeJob: 'JOB-26-10018', rate: 48 },
  { id: 'u5', name: 'Sam Kim',          role: 'TECHNICIAN', trade: 'General',    phone: '6025551005', email: 'sam@tradebase.co',     status: 'AVAILABLE',  activeJob: null,           rate: 38 },
  { id: 'u6', name: 'Rick Ortiz',       role: 'TECHNICIAN', trade: 'Roofing',    phone: '6235551006', email: 'rick@tradebase.co',    status: 'EN_ROUTE',   activeJob: 'JOB-26-10022', rate: 42 },
  { id: 'u7', name: 'Grace Wu',         role: 'DISPATCHER', trade: null,         phone: '4805551007', email: 'grace@tradebase.co',   status: 'OFFICE',     activeJob: null,           rate: 35 },
  { id: 'u8', name: 'Marcus Allen',     role: 'MANAGER',    trade: null,         phone: '6025551008', email: 'marcus@tradebase.co',  status: 'OFFICE',     activeJob: null,           rate: 65 },
]

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: 'success' | 'warning' | 'info' | 'outline' }> = {
  ON_SITE:   { label: 'On Site',   dot: 'bg-emerald-500 animate-pulse', badge: 'success' },
  EN_ROUTE:  { label: 'En Route',  dot: 'bg-yellow-500',                badge: 'warning' },
  AVAILABLE: { label: 'Available', dot: 'bg-blue-500',                  badge: 'info' },
  OFFICE:    { label: 'Office',    dot: 'bg-muted-foreground',          badge: 'outline' },
  OFF:       { label: 'Off',       dot: 'bg-border',                    badge: 'outline' },
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', MANAGER: 'Manager', DISPATCHER: 'Dispatcher',
  TECHNICIAN: 'Technician', SALES: 'Sales', BILLING: 'Billing',
}

export default function TeamPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const roles = ['ALL', 'TECHNICIAN', 'DISPATCHER', 'MANAGER']

  const filtered = TEAM.filter(m => {
    const q = search.toLowerCase()
    const mS = !q || m.name.toLowerCase().includes(q) || (m.trade ?? '').toLowerCase().includes(q)
    const mR = roleFilter === 'ALL' || m.role === roleFilter
    return mS && mR
  })

  const onSite    = TEAM.filter(m => m.status === 'ON_SITE').length
  const enRoute   = TEAM.filter(m => m.status === 'EN_ROUTE').length
  const available = TEAM.filter(m => m.status === 'AVAILABLE').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Staff',  value: TEAM.length,  color: 'text-foreground' },
          { label: 'On Site',      value: onSite,       color: 'text-emerald-400' },
          { label: 'En Route',     value: enRoute,      color: 'text-yellow-400' },
          { label: 'Available',    value: available,    color: 'text-blue-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team members..."
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                roleFilter === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'ALL' ? 'All' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Team Member
        </Button>
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(member => {
          const cfg = STATUS_CONFIG[member.status]
          return (
            <Card key={member.id} className="transition-colors hover:border-primary/40">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${cfg.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{ROLE_LABELS[member.role]}{member.trade ? ` · ${member.trade}` : ''}</p>
                      </div>
                      <Badge variant={cfg.badge} className="text-[9px] shrink-0">{cfg.label}</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {formatPhone(member.phone)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {member.email}
                      </div>
                    </div>
                    {member.activeJob && (
                      <div className="mt-2 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">
                        <span className="text-muted-foreground">Active: </span>
                        <span className="font-medium text-foreground">{member.activeJob}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">${member.rate}/hr</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">View</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
