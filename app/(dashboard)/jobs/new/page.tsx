'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Wrench, Home, Building2, MapPin, Clock, Brain,
  Upload, X, CheckCircle, AlertTriangle, ArrowRight,
  RefreshCw, FileText, Camera, Image as ImageIcon, File as FileIcon,
} from 'lucide-react'

type UploadedFile = { name: string; url: string; size: number; type: string; preview?: string }

type Step = 'customer' | 'location' | 'job-type' | 'assessment' | 'schedule'

const JOB_TYPES = [
  { id: 'REPAIR',        label: 'Repair',        icon: Wrench,   desc: 'Fix an existing problem' },
  { id: 'RENOVATION',    label: 'Renovation',    icon: Home,     desc: 'Upgrade or remodel space' },
  { id: 'NEW_CONSTRUCTION', label: 'Construction', icon: Building2, desc: 'New build project' },
  { id: 'MAINTENANCE',   label: 'Maintenance',   icon: CheckCircle, desc: 'Routine service' },
  { id: 'EMERGENCY',     label: 'Emergency',     icon: AlertTriangle, desc: 'Urgent — same day' },
  { id: 'INSPECTION',    label: 'Inspection',    icon: FileText, desc: 'Assess & quote only' },
]

const TRADE_TYPES = [
  'Plumbing', 'Electrical', 'Roofing', 'Carpentry',
  'Tile / Flooring', 'Drywall', 'Painting', 'Concrete', 'General',
]

const AI_ASSESSMENT = {
  summary: 'Based on the photo and description, the slip-joint nut on the P-trap has failed — likely due to corrosion on the 1987 chrome drain assembly. Water is actively pooling in the cabinet. Immediate repair needed to prevent subfloor damage.',
  scopeOfWork: '1. Remove existing P-trap assembly and inspect all slip-joint connections\n2. Check for subfloor moisture or damage beneath cabinet\n3. Install new 1-1/2" PVC P-trap with compression fittings\n4. Test all connections under full flow for 5 minutes\n5. Document with photos for customer record',
  estimatedHours: 1.5,
  laborBreakdown: { 'Licensed Plumber': 1.5 },
  riskFactors: 'Cabinet subfloor may have moisture damage if leak has been ongoing — inspect and replace if soft ($180–$420 additional). Chrome drain line above P-trap shows corrosion and may need replacement.',
  confidence: 91,
  materials: ['1-1/2" PVC P-trap assembly', 'Slip-joint washers (assorted)', 'Plumber\'s putty', 'Teflon tape', 'PVC primer & cement'],
}

const DEMO_FILES: UploadedFile[] = [
  {
    name: 'sink-pipe-leak.svg',
    url: '/demo-pipe-leak.svg',
    size: 4200,
    type: 'image/svg+xml',
    preview: '/demo-pipe-leak.svg',
  },
]

export default function NewJobPage() {
  const [step, setStep] = useState<Step>('customer')
  const [jobType, setJobType] = useState('REPAIR')
  const [trades, setTrades] = useState<string[]>(['Plumbing'])
  const [description, setDescription] = useState('Water leaking from slip joint under kitchen sink — P-trap connection is loose/corroded. Water pooling in cabinet. Property built 1987.')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(DEMO_FILES)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [assessed, setAssessed] = useState(false)
  const [assessing, setAssessing] = useState(false)
  const [locationVerified, setLocationVerified] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setUploadError('')

    const form = new FormData()
    const localPreviews: string[] = []

    for (const file of Array.from(fileList)) {
      form.append('files', file)
      if (file.type.startsWith('image/')) {
        localPreviews.push(URL.createObjectURL(file))
      } else {
        localPreviews.push('')
      }
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setUploadedFiles(prev => [
        ...prev,
        ...data.files.map((f: UploadedFile, i: number) => ({ ...f, preview: localPreviews[i] })),
      ])
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [])

  const steps: Step[] = ['customer', 'location', 'job-type', 'assessment', 'schedule']
  const stepIdx = steps.indexOf(step)

  const runAssessment = () => {
    setAssessing(true)
    setTimeout(() => { setAssessing(false); setAssessed(true) }, 2200)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Step progress */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <button
              onClick={() => i <= stepIdx && setStep(s)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < stepIdx  ? 'bg-primary text-primary-foreground' :
                i === stepIdx ? 'bg-primary text-primary-foreground ring-2 ring-primary/40' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {i < stepIdx ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 ${i < stepIdx ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
        <span>Customer</span><span>Location</span><span>Job Type</span><span>Assessment</span><span>Schedule</span>
      </div>

      {/* Step: Customer */}
      {step === 'customer' && (
        <Card>
          <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">First Name</label>
                <input className="input-field" placeholder="Maria" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                <input className="input-field" placeholder="Santos" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone *</label>
              <input className="input-field" placeholder="(602) 555-0182" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input className="input-field" placeholder="maria@example.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Customer Type</label>
              <select className="input-field">
                <option>Residential</option>
                <option>Commercial</option>
                <option>Property Manager</option>
                <option>General Contractor</option>
              </select>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium text-foreground">Existing customer lookup</p>
              <p className="text-xs text-muted-foreground mt-1">Search by phone or email to link to existing customer record</p>
              <input className="input-field mt-2" placeholder="Search existing customers..." />
            </div>
            <Button onClick={() => setStep('location')} className="w-full gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Location */}
      {step === 'location' && (
        <Card>
          <CardHeader>
            <CardTitle>Job Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Street Address *</label>
              <input className="input-field" placeholder="412 Oak Street" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">City</label>
                <input className="input-field" placeholder="Phoenix" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ZIP</label>
                <input className="input-field" placeholder="85001" />
              </div>
            </div>

            {/* Map verification placeholder */}
            <div className="relative overflow-hidden rounded-lg border border-border bg-muted" style={{ height: 200 }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Google Maps verification</p>
                <Button size="sm" variant="outline" onClick={() => setLocationVerified(true)} className="gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Verify Address
                </Button>
              </div>
              {locationVerified && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified
                </div>
              )}
            </div>

            {/* County records pull */}
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">Public Property Records</p>
                  <p className="text-xs text-muted-foreground">Pull county/city records for property details</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Pull Records
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Year Built', value: '1987' },
                  { label: 'Sq. Footage', value: '2,150 sqft' },
                  { label: 'Property Type', value: 'Single Family' },
                  { label: 'Parcel #', value: '123-45-678' },
                  { label: 'Last Permit', value: '2019 – Electrical' },
                  { label: 'Zoning', value: 'R1 Residential' },
                ].map(r => (
                  <div key={r.label} className="rounded border border-border bg-background p-2">
                    <p className="text-muted-foreground">{r.label}</p>
                    <p className="font-medium text-foreground">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('customer')} className="flex-1">Back</Button>
              <Button onClick={() => setStep('job-type')} className="flex-1 gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Job Type */}
      {step === 'job-type' && (
        <Card>
          <CardHeader><CardTitle>Job Type & Description</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">Select job type</p>
              <div className="grid grid-cols-3 gap-2">
                {JOB_TYPES.map(jt => {
                  const Icon = jt.icon
                  return (
                    <button
                      key={jt.id}
                      onClick={() => setJobType(jt.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                        jobType === jt.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold">{jt.label}</span>
                      <span className="text-[10px] leading-tight">{jt.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Trade selection */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Trades needed</p>
              <div className="flex flex-wrap gap-2">
                {TRADE_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTrades(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      trades.includes(t)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description of work needed</label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Describe the issue or work required in detail..."
              />
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Photos / Files</label>

              {/* Drop zone */}
              <div
                className="relative rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5') }}
                onDragLeave={e => { e.currentTarget.classList.remove('border-primary', 'bg-primary/5') }}
                onDrop={e => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                  handleFileSelect(e.dataTransfer.files)
                }}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag & drop photos or documents here
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 20MB each</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={e => handleFileSelect(e.target.files)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" /> Browse Files
                    </Button>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-red-400">{uploadError}</p>
              )}

              {/* Uploaded file previews */}
              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="relative group rounded-lg border border-border overflow-hidden bg-muted">
                      {f.preview ? (
                        <img
                          src={f.preview}
                          alt={f.name}
                          className="h-24 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center">
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                        <p className="truncate text-[10px] text-white">{f.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles(fs => fs.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('location')} className="flex-1">Back</Button>
              <Button onClick={() => setStep('assessment')} className="flex-1 gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: AI Assessment */}
      {step === 'assessment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!assessed && !assessing && (
              <div className="text-center py-8 space-y-4">
                <Brain className="mx-auto h-12 w-12 text-primary/60" />
                <div>
                  <p className="font-semibold text-foreground">Run AI-Powered Assessment</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Claude AI will analyze the job description, photos, property records, and historical job data
                    to estimate hours, materials, and scope of work.
                  </p>
                </div>
                <Button onClick={runAssessment} className="gap-2">
                  <Brain className="h-4 w-4" /> Analyze Job
                </Button>
              </div>
            )}

            {assessing && (
              <div className="text-center py-8 space-y-3">
                <RefreshCw className="mx-auto h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing job details, photos, and property records...</p>
              </div>
            )}

            {assessed && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="text-sm font-semibold text-emerald-400">Assessment Complete</p>
                  <span className="text-xs text-emerald-400">{AI_ASSESSMENT.confidence}% confidence</span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</p>
                  <p className="text-sm text-foreground">{AI_ASSESSMENT.summary}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scope of Work</p>
                  <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted p-3 text-xs text-foreground font-mono">
                    {AI_ASSESSMENT.scopeOfWork}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Estimated Hours</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{AI_ASSESSMENT.estimatedHours}</p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(AI_ASSESSMENT.laborBreakdown).map(([trade, hrs]) => (
                        <div key={trade} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{trade}</span>
                          <span className="font-medium text-foreground">{hrs}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Materials Needed</p>
                    <ul className="mt-2 space-y-1">
                      {AI_ASSESSMENT.materials.map(m => (
                        <li key={m} className="text-xs text-foreground">• {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <p className="text-xs font-semibold text-yellow-400">Risk Factor</p>
                  <p className="mt-1 text-xs text-foreground">{AI_ASSESSMENT.riskFactors}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Override / Adjust Estimate</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Hours</label>
                      <input className="input-field" defaultValue={AI_ASSESSMENT.estimatedHours} type="number" step="0.5" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Est. Cost ($)</label>
                      <input className="input-field" defaultValue="1200" type="number" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('job-type')} className="flex-1">Back</Button>
              <Button onClick={() => setStep('schedule')} className="flex-1 gap-2" disabled={!assessed}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Schedule */}
      {step === 'schedule' && (
        <Card>
          <CardHeader><CardTitle>Schedule & Assign</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Scheduled Date</label>
                <input type="date" className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                <input type="time" className="input-field" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assign Technician</label>
              <select className="input-field">
                <option value="">— Select technician —</option>
                <option>Carlos M. (Plumbing) — Available</option>
                <option>Dana L. (Plumbing) — Available 2pm+</option>
                <option>Phil T. (Electrical) — Busy today</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select className="input-field">
                <option value="EMERGENCY">Emergency — Same day</option>
                <option value="HIGH">High — Within 24 hrs</option>
                <option value="MEDIUM" selected>Medium — Within 72 hrs</option>
                <option value="LOW">Low — Schedule when available</option>
              </select>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">Customer Confirmation</p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded" />
                Send SMS confirmation to customer
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded" />
                Send email confirmation to customer
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded" />
                Include Google Maps link to job site
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('assessment')} className="flex-1">Back</Button>
              <Button className="flex-1 gap-2">
                <CheckCircle className="h-4 w-4" /> Create Job
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
