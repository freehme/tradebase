import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ClearFlow Plumbing — Field App',
  description: 'Technician field app',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
