import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Key, Phone, Map, Brain, Database } from 'lucide-react'

const INTEGRATIONS = [
  {
    icon: Phone,
    name: 'Twilio',
    desc: 'SMS & phone call management. Required for inbound communication hub.',
    keys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    status: 'NOT_CONFIGURED',
  },
  {
    icon: Map,
    name: 'Google Maps',
    desc: 'Location verification, technician tracking, and route optimization.',
    keys: ['GOOGLE_MAPS_API_KEY'],
    status: 'NOT_CONFIGURED',
  },
  {
    icon: Brain,
    name: 'Claude AI (Anthropic)',
    desc: 'AI-powered job assessment, scope estimation, and hour prediction.',
    keys: ['ANTHROPIC_API_KEY'],
    status: 'NOT_CONFIGURED',
  },
  {
    icon: Database,
    name: 'Property Records (ATTOM)',
    desc: 'Pull county/city property data: year built, permits, sq footage.',
    keys: ['ATTOM_API_KEY'],
    status: 'OPTIONAL',
  },
]

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Company */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-primary" />
            Company Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Company Name</label>
              <input className="input-field" placeholder="TradeBase Inc." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
              <input className="input-field" placeholder="(800) 555-1000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Business Address</label>
            <input className="input-field" placeholder="123 Main St, Phoenix AZ 85001" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Default Tax Rate (%)</label>
              <input className="input-field" type="number" placeholder="8.0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Invoice Net Terms (days)</label>
              <input className="input-field" type="number" placeholder="30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Default Invoice Terms & Conditions</label>
            <textarea className="input-field h-20 resize-none" placeholder="Payment due within 30 days of invoice date..." />
          </div>
          <Button size="sm">Save Company Settings</Button>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4 text-primary" />
            Integrations & API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure these integrations via environment variables in your <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> file or deployment secrets.
          </p>
          {INTEGRATIONS.map(int => {
            const Icon = int.icon
            return (
              <div key={int.name} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{int.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{int.desc}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    int.status === 'OPTIONAL'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {int.status === 'OPTIONAL' ? 'Optional' : 'Required'}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {int.keys.map(key => (
                    <div key={key} className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground font-mono">{key}</code>
                      <span className="text-[10px] text-muted-foreground">Set in .env</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'SMS alert for missed calls',          def: true },
            { label: 'Email on new job inquiry',            def: true },
            { label: 'SMS when technician goes on-site',    def: false },
            { label: 'Email overdue invoice reminders',     def: true },
            { label: 'SMS on low inventory alert',          def: true },
            { label: 'Daily summary report via email',      def: false },
          ].map(n => (
            <label key={n.label} className="flex cursor-pointer items-center justify-between">
              <span className="text-sm text-foreground">{n.label}</span>
              <input type="checkbox" defaultChecked={n.def} className="rounded" />
            </label>
          ))}
          <Button size="sm" className="mt-2">Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  )
}
