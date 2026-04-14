'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Plus, Send, DollarSign, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const INVOICES = [
  {
    id: 'inv1', num: 'INV-26-10018', job: 'JOB-26-10017', customer: 'Westside HOA',
    status: 'PAID', issueDate: new Date(Date.now() - 5 * 86400000), dueDate: new Date(Date.now() + 25 * 86400000),
    subtotal: 6700, tax: 0, total: 6700, paid: 6700, balance: 0,
  },
  {
    id: 'inv2', num: 'INV-26-10017', job: 'JOB-26-10019', customer: 'ABC Rentals LLC',
    status: 'SENT', issueDate: new Date(Date.now() - 2 * 86400000), dueDate: new Date(Date.now() + 28 * 86400000),
    subtotal: 3200, tax: 256, total: 3456, paid: 0, balance: 3456,
  },
  {
    id: 'inv3', num: 'INV-26-10016', job: 'JOB-26-10015', customer: 'Bob Chen',
    status: 'OVERDUE', issueDate: new Date(Date.now() - 40 * 86400000), dueDate: new Date(Date.now() - 10 * 86400000),
    subtotal: 8500, tax: 680, total: 9180, paid: 4000, balance: 5180,
  },
  {
    id: 'inv4', num: 'INV-26-10015', job: 'JOB-26-10020', customer: 'Tom Reeves',
    status: 'DRAFT', issueDate: new Date(), dueDate: new Date(Date.now() + 30 * 86400000),
    subtotal: 18500, tax: 1480, total: 19980, paid: 0, balance: 19980,
  },
  {
    id: 'inv5', num: 'INV-26-10014', job: 'JOB-26-10012', customer: 'Sandra Kim',
    status: 'PARTIAL', issueDate: new Date(Date.now() - 15 * 86400000), dueDate: new Date(Date.now() + 15 * 86400000),
    subtotal: 4200, tax: 336, total: 4536, paid: 2000, balance: 2536,
  },
]

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'outline' | 'default' | 'info'; icon: React.ElementType }> = {
  DRAFT:   { variant: 'outline',     icon: FileText },
  SENT:    { variant: 'info',        icon: Send },
  PARTIAL: { variant: 'warning',     icon: Clock },
  PAID:    { variant: 'success',     icon: CheckCircle },
  OVERDUE: { variant: 'destructive', icon: AlertTriangle },
  VOIDED:  { variant: 'default',     icon: FileText },
}

export default function BillingPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedInv, setSelectedInv] = useState<string | null>('inv3')

  const statuses = ['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE']

  const filtered = INVOICES.filter(inv => {
    const q = search.toLowerCase()
    const m = !q || inv.customer.toLowerCase().includes(q) || inv.num.toLowerCase().includes(q)
    const s = statusFilter === 'ALL' || inv.status === statusFilter
    return m && s
  })

  const inv = INVOICES.find(i => i.id === selectedInv)

  const totalInvoiced = INVOICES.reduce((s, i) => s + i.total, 0)
  const totalCollected = INVOICES.reduce((s, i) => s + i.paid, 0)
  const totalOverdue = INVOICES.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.balance, 0)
  const totalOutstanding = INVOICES.filter(i => !['PAID', 'VOIDED'].includes(i.status)).reduce((s, i) => s + i.balance, 0)

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Invoice list */}
      <div className="flex w-80 flex-col gap-3">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Invoiced',     value: formatCurrency(totalInvoiced),   color: 'text-foreground' },
            { label: 'Collected',    value: formatCurrency(totalCollected),   color: 'text-emerald-400' },
            { label: 'Overdue',      value: formatCurrency(totalOverdue),     color: 'text-red-400' },
            { label: 'Outstanding',  value: formatCurrency(totalOutstanding), color: 'text-yellow-400' },
          ].map(s => (
            <Card key={s.label} className="p-3">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
                statusFilter === s
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {filtered.map(invoice => {
            const cfg = STATUS_CONFIG[invoice.status]
            const Icon = cfg.icon
            return (
              <button
                key={invoice.id}
                onClick={() => setSelectedInv(invoice.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selectedInv === invoice.id
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border bg-card hover:bg-accent/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{invoice.customer}</p>
                    <p className="text-[10px] text-muted-foreground">{invoice.num}</p>
                  </div>
                  <Badge variant={cfg.variant} className="text-[9px] shrink-0">{invoice.status}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{formatCurrency(invoice.total)}</span>
                  {invoice.balance > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      Due: {formatCurrency(invoice.balance)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <Button size="sm" className="w-full gap-2">
          <Plus className="h-3.5 w-3.5" /> New Invoice
        </Button>
      </div>

      {/* Invoice detail */}
      <div className="flex-1 overflow-y-auto">
        {inv ? (
          <Card className="h-full">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{inv.num}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{inv.customer} · {inv.job}</p>
                </div>
                <div className="flex gap-2">
                  {inv.status === 'DRAFT' && (
                    <Button size="sm" className="gap-1.5">
                      <Send className="h-3.5 w-3.5" /> Send Invoice
                    </Button>
                  )}
                  {['SENT', 'PARTIAL', 'OVERDUE'].includes(inv.status) && (
                    <Button size="sm" className="gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Record Payment
                    </Button>
                  )}
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">PDF</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Dates */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{formatDate(inv.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className={`font-medium ${inv.status === 'OVERDUE' ? 'text-red-400' : ''}`}>
                    {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={STATUS_CONFIG[inv.status].variant}>{inv.status}</Badge>
                </div>
              </div>

              {/* Line items */}
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Line Items</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Description', 'Category', 'Qty', 'Unit Price', 'Total'].map(h => (
                        <th key={h} className="py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { desc: 'Licensed Plumber — 8 hours', cat: 'Labor',     qty: 8,  unit: 95.00,  total: 760.00 },
                      { desc: 'Helper — 4 hours',           cat: 'Labor',     qty: 4,  unit: 55.00,  total: 220.00 },
                      { desc: 'Camera inspection',          cat: 'Service',   qty: 1,  unit: 250.00, total: 250.00 },
                      { desc: 'Drain snake (professional)', cat: 'Equipment', qty: 1,  unit: 120.00, total: 120.00 },
                      { desc: 'PVC fittings & materials',   cat: 'Materials', qty: 1,  unit: 180.00, total: 180.00 },
                    ].map((li, i) => (
                      <tr key={i} className="hover:bg-accent/20">
                        <td className="py-2.5 font-medium">{li.desc}</td>
                        <td className="py-2.5 text-xs text-muted-foreground">{li.cat}</td>
                        <td className="py-2.5">{li.qty}</td>
                        <td className="py-2.5">{formatCurrency(li.unit)}</td>
                        <td className="py-2.5 font-semibold">{formatCurrency(li.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="ml-auto max-w-xs space-y-2">
                {[
                  { label: 'Subtotal', value: formatCurrency(inv.subtotal) },
                  { label: `Tax (8%)`, value: formatCurrency(inv.tax) },
                  { label: 'Total',    value: formatCurrency(inv.total),   bold: true },
                  { label: 'Paid',     value: formatCurrency(inv.paid),    color: 'text-emerald-400' },
                  { label: 'Balance Due', value: formatCurrency(inv.balance), bold: true, color: inv.balance > 0 ? 'text-red-400' : 'text-emerald-400' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between border-t border-border pt-2">
                    <span className={`text-sm ${row.bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{row.label}</span>
                    <span className={`text-sm ${row.bold ? 'font-bold' : ''} ${row.color ?? 'text-foreground'}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Payment history */}
              {inv.paid > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">Payment History</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <div>
                        <p className="font-medium">Check #4421</p>
                        <p className="text-xs text-muted-foreground">{formatDate(new Date(Date.now() - 10 * 86400000))}</p>
                      </div>
                      <p className="font-bold text-emerald-400">{formatCurrency(inv.paid)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select an invoice to view details
          </div>
        )}
      </div>
    </div>
  )
}
