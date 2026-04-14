'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Phone,
  Users,
  ClipboardList,
  Calendar,
  Package,
  FileText,
  PiggyBank,
  Settings,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  {
    group: 'Front of House',
    items: [
      { label: 'Dashboard',       href: '/dashboard',        icon: LayoutDashboard },
      { label: 'Communications',  href: '/communications',   icon: Phone,          badge: 'LIVE' },
      { label: 'Customers',       href: '/customers',        icon: Users },
      { label: 'Jobs',            href: '/jobs',             icon: ClipboardList },
      { label: 'Scheduling',      href: '/scheduling',       icon: Calendar },
    ],
  },
  {
    group: 'Back of House',
    items: [
      { label: 'Inventory',       href: '/inventory',        icon: Package },
      { label: 'Billing',         href: '/billing',          icon: FileText },
      { label: 'Budgeting',       href: '/budgeting',        icon: PiggyBank },
    ],
  },
  {
    group: 'Admin',
    items: [
      { label: 'Team',            href: '/team',             icon: HardHat },
      { label: 'Settings',        href: '/settings',         icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 border-b border-border px-4 py-5', collapsed && 'justify-center px-2')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-none text-foreground">TradeBase</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Operations Platform</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(group => (
          <div key={group.group} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        collapsed && 'justify-center'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] font-bold text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
