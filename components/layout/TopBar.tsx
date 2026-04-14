'use client'

import { Bell, Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/communications':  'Communications',
  '/customers':       'Customers',
  '/jobs':            'Jobs & Projects',
  '/scheduling':      'Scheduling',
  '/inventory':       'Inventory',
  '/billing':         'Billing & Invoices',
  '/budgeting':       'Budgeting',
  '/team':            'Team',
  '/settings':        'Settings',
}

const newActions: Record<string, { label: string; href: string }> = {
  '/customers':  { label: 'New Customer', href: '/customers/new' },
  '/jobs':       { label: 'New Job',      href: '/jobs/new' },
  '/billing':    { label: 'New Invoice',  href: '/billing/new' },
  '/inventory':  { label: 'Add Item',     href: '/inventory/new' },
}

export default function TopBar() {
  const pathname = usePathname()
  const base = '/' + pathname.split('/')[1]
  const title = pageTitles[base] ?? 'TradeBase'
  const action = newActions[base]

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Quick search..."
            className="h-8 w-52 rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* Quick action */}
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            {action.label}
          </Link>
        )}

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
          AD
        </div>
      </div>
    </header>
  )
}
