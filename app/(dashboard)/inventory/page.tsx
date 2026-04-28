'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Plus, AlertTriangle, TrendingDown, Package, ArrowUpDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Category = 'ALL' | 'PLUMBING' | 'TOOLS' | 'HARDWARE' | 'ELECTRICAL' | 'HVAC' | 'CARPENTRY'

const ITEMS = [
  { id: 'I001', sku: 'PLM-PVC-075',  name: 'PVC Pipe 3/4" (10ft)',      cat: 'PLUMBING', unit: 'each',  qty: 2,  reserved: 2,  reorderPt: 10, unitCost: 4.50,   unitPrice: 9.00,   supplier: 'Ferguson' },
  { id: 'I002', sku: 'PLM-PTR-112',  name: 'P-Trap Assembly 1-1/2"',    cat: 'PLUMBING', unit: 'each',  qty: 3,  reserved: 1,  reorderPt: 12, unitCost: 8.75,   unitPrice: 19.00,  supplier: 'Ferguson' },
  { id: 'I003', sku: 'PLM-BLL-075',  name: 'Ball Valve 3/4" Brass',     cat: 'PLUMBING', unit: 'each',  qty: 8,  reserved: 2,  reorderPt: 15, unitCost: 14.50,  unitPrice: 32.00,  supplier: 'Ferguson' },
  { id: 'I004', sku: 'PLM-SHK-ADJ',  name: 'Drain Snake 50ft Power',    cat: 'TOOLS',    unit: 'each',  qty: 0,  reserved: 0,  reorderPt: 2,  unitCost: 320.00, unitPrice: 0,      supplier: 'Ridgid' },
  { id: 'I005', sku: 'PLM-PTR-075',  name: 'P-Trap Assembly 3/4"',      cat: 'PLUMBING', unit: 'each',  qty: 24, reserved: 3,  reorderPt: 10, unitCost: 7.50,   unitPrice: 18.00,  supplier: 'Ferguson' },
  { id: 'I006', sku: 'PLM-COP-058',  name: 'Copper Pipe 5/8" (10ft)',   cat: 'PLUMBING', unit: 'each',  qty: 12, reserved: 4,  reorderPt: 8,  unitCost: 22.00,  unitPrice: 48.00,  supplier: 'Ferguson' },
  { id: 'I007', sku: 'PLM-WXR-KIT',  name: 'Wax Ring & Bolt Kit',       cat: 'PLUMBING', unit: 'kit',   qty: 18, reserved: 0,  reorderPt: 10, unitCost: 5.25,   unitPrice: 12.00,  supplier: 'Ferguson' },
  { id: 'I008', sku: 'TLS-CAM-SNK',  name: 'Sewer Camera 100ft',        cat: 'TOOLS',    unit: 'each',  qty: 2,  reserved: 1,  reorderPt: 1,  unitCost: 1800.00,unitPrice: 0,      supplier: 'Ridgid' },
]

const stockLevel = (item: typeof ITEMS[0]) => {
  if (item.qty === 0)                         return { label: 'Out of Stock', variant: 'destructive' as const }
  if (item.qty <= item.reorderPt * 0.5)      return { label: 'Critical',     variant: 'destructive' as const }
  if (item.qty <= item.reorderPt)             return { label: 'Low Stock',    variant: 'warning' as const }
  return                                             { label: 'In Stock',     variant: 'success' as const }
}

const available = (item: typeof ITEMS[0]) => Math.max(0, item.qty - item.reserved)

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<Category>('ALL')

  const cats: Category[] = ['ALL', 'PLUMBING', 'TOOLS', 'HARDWARE', 'ELECTRICAL', 'HVAC', 'CARPENTRY']

  const filtered = ITEMS.filter(item => {
    const q = search.toLowerCase()
    const mSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    const mCat = cat === 'ALL' || item.cat === cat
    return mSearch && mCat
  })

  const alerts = ITEMS.filter(i => i.qty <= i.reorderPt)
  const totalValue = ITEMS.reduce((s, i) => s + i.qty * i.unitCost, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total SKUs',      value: ITEMS.length,                                                  color: 'text-foreground' },
          { label: 'Low / Out',       value: alerts.length,                                                 color: 'text-red-400' },
          { label: 'Inventory Value', value: formatCurrency(totalValue),                                    color: 'text-emerald-400' },
          { label: 'Reserved Items',  value: ITEMS.reduce((s, i) => s + i.reserved, 0),                    color: 'text-yellow-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low stock alert */}
      {alerts.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">{alerts.length} items need reordering</p>
            <p className="text-xs text-muted-foreground mt-1">
              {alerts.map(i => i.name).join(' · ')}
            </p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto shrink-0 text-xs">
            Generate PO
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                cat === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['SKU', 'Item Name', 'Category', 'On Hand', 'Available', 'Reserved', 'Unit Cost', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const { label, variant } = stockLevel(item)
                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.unit} · {item.supplier}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.cat}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{item.qty}</td>
                    <td className="px-4 py-3">
                      <span className={available(item) === 0 ? 'text-red-400 font-bold' : 'text-foreground font-semibold'}>
                        {available(item)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.reserved}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(item.unitCost)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={variant}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Edit</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Adjust</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
