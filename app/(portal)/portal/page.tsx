'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Droplets, Phone, Mail, MapPin, Upload, X, FileText, Image as ImageIcon,
  Loader2, Star, Shield, Clock, CheckCircle,
} from 'lucide-react'

const ISSUE_TYPES = [
  'Drain blocked / slow draining',
  'Toilet won\'t flush / overflowing',
  'Low water pressure',
  'No hot water',
  'Water leak / pipe dripping',
  'Burst pipe emergency',
  'Water heater repair or replacement',
  'Sewer line backup',
  'Running toilet / faucet dripping',
  'New fixture installation',
  'Annual plumbing inspection',
  'Other / not sure',
]

type UploadedFile = {
  name: string
  type: string
  size: number
  dataUrl: string
}

export default function PortalPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    issueType: '', description: '',
  })
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleFiles(fileList: FileList) {
    const accepted = Array.from(fileList).filter(f =>
      f.type.startsWith('image/') || f.type === 'application/pdf'
    )
    accepted.slice(0, 3 - files.length).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        setFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: e.target?.result as string,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.issueType || !form.description) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, files: files.map(f => ({ name: f.name, type: f.type, dataUrl: f.dataUrl })) }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      const data = await res.json()
      const params = new URLSearchParams({
        name:           form.name,
        issueType:      form.issueType,
        summary:        data.summary ?? '',
        estimatedRange: data.estimatedRange ?? '',
        urgency:        data.urgency ?? '',
        steps:          JSON.stringify(data.nextSteps ?? []),
      })
      router.push(`/portal/thank-you?${params.toString()}`)
    } catch {
      setError('Something went wrong. Please try again or call us at (602) 555-9000.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-slate-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 shadow-md">
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none">ClearFlow Plumbing</p>
              <p className="text-xs text-slate-500">Phoenix Metro · Licensed & Insured</p>
            </div>
          </div>
          <a href="tel:6025559000" className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-600">
            <Phone className="h-3.5 w-3.5" /> (602) 555-9000
          </a>
        </div>
      </header>

      {/* Trust badges */}
      <div className="border-b border-sky-100 bg-sky-500 px-4 py-2">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-6 text-white">
          {[
            { icon: Star,         text: '4.9★ (1,200+ reviews)' },
            { icon: Shield,       text: 'Licensed & Bonded' },
            { icon: Clock,        text: 'Same-Day Service' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs font-medium">
              <Icon className="h-3.5 w-3.5" /> {text}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Request Plumbing Service</h1>
          <p className="mt-1 text-slate-500">
            Describe your issue and upload photos. Our AI will review it and estimate your service time — usually in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contact info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-slate-700">Your Information</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="jane@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="(602) 555-0000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Service Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    placeholder="123 Main St, Phoenix AZ"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Issue type */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">What&apos;s the Problem? *</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ISSUE_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('issueType', type)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    form.issueType === type
                      ? 'border-sky-400 bg-sky-50 font-semibold text-sky-700'
                      : 'border-slate-200 text-slate-600 hover:border-sky-200 hover:bg-sky-50/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Describe the Issue *</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Tell us more — when did it start? Any visible leaks, sounds, or odors? How old is the plumbing? This helps us send the right plumber with the right parts."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* File upload */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-slate-700">Upload Photos or Documents</p>
            <p className="mb-3 text-xs text-slate-500">Photos of your unit, error codes, or previous service records help our AI give a more accurate estimate.</p>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
              }`}
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Drop files here or click to browse</p>
              <p className="mt-0.5 text-xs text-slate-400">JPG, PNG, PDF · up to 3 files · 5MB each</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={e => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    {f.type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.dataUrl} alt={f.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <FileText className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-slate-700">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                      className="rounded-lg p-1 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* AI notice */}
          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sky-800">AI-Powered Estimate</p>
              <p className="mt-0.5 text-xs text-sky-700">
                Our system will analyze your photos and description to estimate service time and what to expect — before we even call you.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-base font-bold text-white shadow-lg shadow-sky-200 transition-colors hover:bg-sky-600 disabled:opacity-60"
          >
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing your request...</>
            ) : (
              <><CheckCircle className="h-5 w-5" /> Submit Request & Get Estimate</>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            By submitting, you agree to be contacted by ClearFlow Plumbing. We never share your information.
          </p>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 mt-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-semibold text-slate-700">ClearFlow Plumbing</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-500">
              <a href="tel:6025559000" className="hover:text-sky-500">(602) 555-9000</a>
              <span>·</span>
              <a href="mailto:service@clearflowplumbing.co" className="hover:text-sky-500">service@clearflowplumbing.co</a>
              <span>·</span>
              <span>Phoenix, AZ Metro</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
