'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Plus, Phone, Mail, MapPin, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import { formatPhone } from '@/lib/utils'

const CUSTOMERS = [
  { id: 'c1', name: 'Linda Chen',                   type: 'RESIDENTIAL',      phone: '6025550182', email: 'linda.chen@gmail.com',      city: 'Phoenix',    jobs: 2, totalSpent: 485,   lastJob: 'Today' },
  { id: 'c2', name: 'Robert Martinez',              type: 'RESIDENTIAL',      phone: '4805550234', email: 'rmartinez@outlook.com',     city: 'Scottsdale', jobs: 3, totalSpent: 1240,  lastJob: '3 days ago' },
  { id: 'c3', name: 'Sunrise Commercial Properties',type: 'PROPERTY_MANAGER', phone: '6235550091', email: 'facilities@sunriseprops.com',city: 'Tempe',     jobs: 5, totalSpent: 24600, lastJob: 'Yesterday' },
  { id: 'c4', name: 'Jennifer Walsh',               type: 'RESIDENTIAL',      phone: '4805550501', email: 'jwalsh@yahoo.com',          city: 'Mesa',       jobs: 1, totalSpent: 0,     lastJob: 'Assessment' },
  { id: 'c5', name: 'Westgate Shopping Center',     type: 'COMMERCIAL',       phone: '6235550050', email: 'ops@westgatecenter.com',    city: 'Glendale',   jobs: 8, totalSpent: 18900, lastJob: 'Yesterday' },
  { id: 'c6', name: 'Derek Okafor',                 type: 'RESIDENTIAL',      phone: '4805550300', email: 'dokafor@gmail.com',         city: 'Phoenix',    jobs: 1, totalSpent: 0,     lastJob: 'Scheduled' },
]

const TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL:      'Residential',
  COMMERCIAL:       'Commercial',
  PROPERTY_MANAGER: 'Property Mgr',
  GENERAL_CONTRACTOR: 'GC',
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const types = ['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'PROPERTY_MANAGER']

  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase()
    const m = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? '').toLowerCase().includes(q)
    const t = typeFilter === 'ALL' || c.type === typeFilter
    return m && t
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'ALL' ? 'All' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <Link href="/customers/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Customer
          </Button>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} customers</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(c => (
          <Link key={c.id} href={`/customers/${c.id}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground truncate">{c.name}</p>
                      <Badge variant="outline" className="text-[9px] shrink-0">{TYPE_LABELS[c.type]}</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {formatPhone(c.phone)}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {c.city}, AZ
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{c.jobs} job{c.jobs !== 1 ? 's' : ''}</span>
                      <span className="font-semibold text-foreground">
                        {c.totalSpent > 0 ? `$${(c.totalSpent / 1000).toFixed(1)}k` : 'No spend yet'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
