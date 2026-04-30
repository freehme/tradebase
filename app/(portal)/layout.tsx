import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ClearFlow Plumbing — Request Service',
  description: 'Submit a service request for plumbing repair, maintenance, or installation.',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50" style={{ colorScheme: 'light' }}>
      {children}
    </div>
  )
}
