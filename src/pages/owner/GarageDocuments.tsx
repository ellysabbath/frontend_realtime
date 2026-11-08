import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Download,
  Upload,
  Users,
  Store,
  MapPin,
  Phone,
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Calendar,
} from 'lucide-react'
import { ownerApi } from '../../lib/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function GarageDocuments() {
  const { id } = useParams()
  const nav = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  const loadData = () => {
    if (!id) return
    setLoading(true)
    ownerApi
      .garageDocuments(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleDownload = async () => {
    if (!id) return
    setDownloading(true)
    try {
      const blob = await ownerApi.downloadTreaty(id)
      const url = window.URL.createObjectURL(blob as any)
      const a = document.createElement('a')
      a.href = url
      a.download = `tApp_Treaty_${data?.garage?.name?.replace(/\s+/g, '_') || 'Garage'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      setModal({
        open: true,
        type: 'error',
        title: 'Download failed',
        message: e.message || 'Could not download the treaty PDF.',
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    if (file.type !== 'application/pdf') {
      setModal({
        open: true,
        type: 'error',
        title: 'Invalid file',
        message: 'Please upload a PDF file.',
      })
      return
    }

    setUploading(true)
    try {
      await ownerApi.uploadTreaty(id, file)
      setModal({
        open: true,
        type: 'success',
        title: 'Treaty uploaded',
        message: 'Your signed treaty has been uploaded and is now pending admin review.',
      })
      loadData() // Reload to show new status
    } catch (err: any) {
      setModal({
        open: true,
        type: 'error',
        title: 'Upload failed',
        message: err.message || 'Failed to upload treaty.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const fmtDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  if (loading && !data) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    )
  }

  if (!data || !data.garage) {
    return (
      <Card className="p-10 text-center">
        <AlertTriangle size={40} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Garage not found</h2>
        <Button className="mt-4" onClick={() => nav('/owner/dashboard')}>
          Back to Dashboard
        </Button>
      </Card>
    )
  }

  const { garage, treaty, technicians } = data
  const statusColor =
    garage.status === 'active' ? 'green' : garage.status === 'pending' ? 'yellow' : 'red'

  const needsUpload = !treaty?.status || treaty?.status === 'not submitted' || treaty?.status === 'pending'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <button
            onClick={() => nav('/owner/dashboard')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {garage.name || 'Garage'} — Documents
          </h1>
          <p className="text-slate-500 mt-1">
            The full record of your garage: treaty, registration inputs, and technicians.
          </p>
        </div>
        <Badge color={statusColor as any}>
          {garage.status || 'pending'}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Store className="text-brand-600" size={20} /> Garage record
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500">Garage ID</p>
                <p className="font-mono font-bold text-slate-900">
                  {garage.garageId || 'Pending assignment'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500">Owner</p>
                <p className="font-semibold text-slate-900">
                  {garage.ownerName || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                <MapPin size={16} /> {garage.address || '—'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={16} /> {garage.primaryPhone || '—'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={16} /> {garage.email || '—'}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="text-brand-600" size={20} /> Autogenerated Treaty
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              This treaty was generated automatically when you submitted the garage registration form.
            </p>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    tApp Owner Treaty — {garage.name || 'Garage'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Generated on {fmtDate(garage.createdAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {downloading ? 'Downloading' : 'Download PDF'}
                </Button>
              </div>

              <div className={`p-4 ${needsUpload ? 'bg-yellow-50/50' : 'bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      Signed Treaty Upload
                      {!needsUpload && <CheckCircle2 size={16} className="text-green-600" />}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {needsUpload
                        ? 'Download the treaty, sign it, scan it, and upload the PDF here.'
                        : 'Your signed treaty has been uploaded and is pending review.'}
                    </p>
                  </div>
                  
                  {needsUpload ? (
                    <>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <Button
                        size="sm"
                        className="inline-flex items-center gap-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        {uploading ? 'Uploading' : 'Upload PDF'}
                      </Button>
                    </>
                  ) : (
                    <Badge color="green">Submitted</Badge>
                  )}
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Treaty ID</p>
                  <p className="font-mono text-slate-900">
                    {treaty?.id || 'Not yet generated'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-slate-900">
                    {treaty?.amount ? `${treaty.amount.toLocaleString()} TZS` : '50,000 TZS'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge
                    color={
                      treaty?.status === 'paid' || treaty?.status === 'approved'
                        ? 'green'
                        : treaty?.status === 'submitted'
                        ? 'blue'
                        : 'gray'
                    }
                  >
                    {treaty?.status || 'not submitted'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment method</p>
                  <p className="text-slate-900 uppercase">
                    {treaty?.method || '—'}
                  </p>
                </div>
                {treaty?.reference && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Reference number</p>
                    <p className="font-mono text-slate-900">{treaty.reference}</p>
                  </div>
                )}
                {treaty?.createdAt && (
                  <div className="col-span-2 flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} />
                    Submitted on {fmtDate(treaty.createdAt)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-brand-600" size={20} /> Technicians
              </h2>
              <Badge color="blue">{technicians.length}</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Every technician who applied to join this garage.
            </p>

            {technicians.length === 0 ? (
              <p className="text-sm text-slate-500">
                No technicians have joined this garage yet.
              </p>
            ) : (
              <div className="space-y-3">
                {technicians.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                  >
                    <div className="w-9 h-9 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xs">
                      {t.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {t.fullName || 'Unnamed'}
                      </p>
                      <p className="text-xs text-slate-500">{t.phone || '—'}</p>
                    </div>
                    <Badge
                      color={
                        t.status === 'active'
                          ? 'green'
                          : t.status === 'suspended'
                          ? 'red'
                          : 'yellow'
                      }
                    >
                      {t.status || 'pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="text-brand-600" size={20} /> Timeline
            </h2>
            <ol className="relative border-l border-slate-200 pl-5 space-y-4 text-sm">
              <li>
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-brand-500" />
                <p className="font-semibold text-slate-900">Garage registered</p>
                <p className="text-xs text-slate-500">{fmtDate(garage.createdAt)}</p>
              </li>
              <li>
                <span
                  className={`absolute -left-1.5 w-3 h-3 rounded-full ${
                    treaty?.status && treaty?.status !== 'not submitted' ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                />
                <p className="font-semibold text-slate-900">Treaty submitted</p>
                <p className="text-xs text-slate-500">
                  {treaty?.status && treaty?.status !== 'not submitted' && treaty?.createdAt
                    ? fmtDate(treaty.createdAt)
                    : 'Not yet submitted'}
                </p>
              </li>
              <li>
                <span
                  className={`absolute -left-1.5 w-3 h-3 rounded-full ${
                    garage.status === 'active' ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                />
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  {garage.status === 'active' ? (
                    <><CheckCircle2 size={14} className="text-green-600" /> Approved</>
                  ) : (
                    <><Clock size={14} className="text-slate-400" /> Pending approval</>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {garage.status === 'active'
                    ? garage.activatedAt
                      ? fmtDate(garage.activatedAt)
                      : 'Approved by admin'
                    : 'Waiting for admin review'}
                </p>
              </li>
            </ol>
          </Card>
        </div>
      </div>

      {/* MODAL FOR FEEDBACK */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.title}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                modal.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {modal.type === 'success' ? (
                <CheckCircle2 size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              {modal.message}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant={modal.type === 'success' ? 'primary' : 'outline'}
              onClick={() => setModal({ ...modal, open: false })}
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}