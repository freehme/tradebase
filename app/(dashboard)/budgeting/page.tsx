'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Plus, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const BUDGET_CATEGORIES = [
  { name: 'Labor — Plumbing',     allocated: 45000, spent: 38200, color: '#3b82f6' },
  { name: 'Labor — Electrical',   allocated: 32000, spent: 29100, color: '#8b5cf6' },
  { name: 'Labor — HVAC',         allocated: 28000, spent: 22500, color: '#10b981' },
  { name: 'Labor — General',      allocated: 40000, spent: 35800, color: '#f59e0b' },
  { name: 'Materials',            allocated: 55000, spent: 48900, color: '#ef4444' },
  { name: 'Equipment Rental',     allocated: 12000, spent: 8400,  color: '#06b6d4' },
  { name: 'Subcontractors',       allocated: 30000, spent: 31500, color: '#f97316' },
  { name: 'Vehicle & Fuel',       allocated: 8000,  spent: 6200,  color: '#84cc16' },
  { name: 'Overhead',             allocated: 15000, spent: 13100, color: '#64748b' },
]

const MONTHLY = [
  { month: 'Oct', revenue: 148000, expenses: 112000 },
  { month: 'Nov', revenue: 162000, expenses: 121000 },
  { month: 'Dec', revenue: 138000, expenses: 108000 },
  { month: 'Jan', revenue: 155000, expenses: 118000 },
  { month: 'Feb', revenue: 172000, expenses: 129000 },
  { month: 'Mar', revenue: 191000, expenses: 138000 },
  { month: 'Apr', revenue: 142800, expenses: 99700 },
]

export default function BudgetingPage() {
  const totalAllocated = BUDGET_CATEGORIES.reduce((s, c) => s + c.allocated, 0)
  const totalSpent     = BUDGET_CATEGORIES.reduce((s, c) => s + c.spent, 0)
  const overBudget     = BUDGET_CATEGORIES.filter(c => c.spent > c.allocated)
  const currentMonth   = MONTHLY[MONTHLY.length - 1]
  const prevMonth      = MONTHLY[MONTHLY.length - 2]
  const revenueChange  = ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
  const profitMargin   = ((currentMonth.revenue - currentMonth.expenses) / currentMonth.revenue) * 100

  const maxBar = Math.max(...MONTHLY.map(m => m.revenue))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Monthly Revenue',
            value: formatCurrency(currentMonth.revenue),
            sub: `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last month`,
            trend: revenueChange > 0 ? 'up' : 'down',
            color: 'text-emerald-400',
          },
          {
            label: 'Monthly Expenses',
            value: formatCurrency(currentMonth.expenses),
            sub: 'vs budget ' + formatCurrency(totalAllocated),
            trend: currentMonth.expenses > totalAllocated ? 'up' : 'down',
            color: currentMonth.expenses > totalAllocated ? 'text-red-400' : 'text-foreground',
          },
          {
            label: 'Gross Profit',
            value: formatCurrency(currentMonth.revenue - currentMonth.expenses),
            sub: `${profitMargin.toFixed(1)}% margin`,
            trend: 'up',
            color: 'text-emerald-400',
          },
          {
            label: 'Over Budget Items',
            value: String(overBudget.length),
            sub: overBudget.map(c => c.name.split(' — ')[0]).join(', '),
            trend: overBudget.length > 0 ? 'up' : 'down',
            color: overBudget.length > 0 ? 'text-red-400' : 'text-emerald-400',
          },
        ].map(kpi => {
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`mt-1 text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <div className="mt-1 flex items-center gap-1">
                  <TrendIcon className={`h-3 w-3 ${kpi.color}`} />
                  <span className="text-[10px] text-muted-foreground">{kpi.sub}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Revenue vs Expenses — Last 7 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {MONTHLY.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1 h-32">
                    <div
                      className="flex-1 rounded-t bg-primary/70 transition-all"
                      style={{ height: `${(m.revenue / maxBar) * 100}%` }}
                      title={`Revenue: ${formatCurrency(m.revenue)}`}
                    />
                    <div
                      className="flex-1 rounded-t bg-destructive/50 transition-all"
                      style={{ height: `${(m.expenses / maxBar) * 100}%` }}
                      title={`Expenses: ${formatCurrency(m.expenses)}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.month}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-primary/70 inline-block" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-destructive/50 inline-block" /> Expenses</span>
            </div>
          </CardContent>
        </Card>

        {/* Budget summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Monthly Budget</CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Budget</span>
              <span className="font-bold text-foreground">{formatCurrency(totalAllocated)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Spent to Date</span>
              <span className={`font-bold ${totalSpent > totalAllocated ? 'text-red-400' : 'text-foreground'}`}>
                {formatCurrency(totalSpent)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-border mt-2">
              <div
                className={`h-2 rounded-full transition-all ${totalSpent > totalAllocated ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, (totalSpent / totalAllocated) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {((totalSpent / totalAllocated) * 100).toFixed(1)}% of budget used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">Budget by Category</CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {BUDGET_CATEGORIES.map(cat => {
            const pct = Math.min(100, (cat.spent / cat.allocated) * 100)
            const over = cat.spent > cat.allocated
            return (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-medium text-foreground">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={over ? 'text-red-400 font-semibold' : 'text-muted-foreground'}>
                      {formatCurrency(cat.spent)}
                    </span>
                    <span className="text-muted-foreground">/ {formatCurrency(cat.allocated)}</span>
                    {over && <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">OVER</span>}
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border">
                  <div
                    className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${pct}%`, backgroundColor: over ? undefined : cat.color }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
