import { useState, useRef } from 'react'
import { Upload, Loader2, Check, SkipForward, RotateCcw, AlertTriangle, Lock } from 'lucide-react'
import { extractTextFromPDF } from '../lib/pdfExtractor'
import { extractStatement } from '../api/anthropic'
import { formatCOP } from '../lib/constants'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'

const MAX_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024

export default function UploadStatementModal({ onClose, onAdd }) {
  const [phase, setPhase] = useState('select')
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({ current: 0, total: 0, fileName: '' })
  const [results, setResults] = useState([])
  const [passwords, setPasswords] = useState({})
  const fileRef = useRef(null)

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    const valid = []
    for (const file of selected) {
      if (file.type !== 'application/pdf') {
        toast.error(`"${file.name}" no es un archivo PDF`)
        continue
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" excede 10MB`)
        continue
      }
      valid.push(file)
    }

    if (valid.length > MAX_FILES) {
      toast.error(`Maximo ${MAX_FILES} archivos a la vez`)
      valid.splice(MAX_FILES)
    }

    if (valid.length === 0) return
    setFiles(valid)
    processFiles(valid)
  }

  const processFiles = async (fileList) => {
    setPhase('processing')
    setProgress({ current: 0, total: fileList.length, fileName: '' })
    const fileResults = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      setProgress({ current: i + 1, total: fileList.length, fileName: file.name })

      try {
        const text = await extractTextFromPDF(file)
        if (text.trim().length < 50) {
          fileResults.push({ fileName: file.name, error: 'El PDF no contiene texto legible. Puede ser un documento escaneado como imagen.', data: null })
          continue
        }
        const data = await extractStatement(text, file.name)
        fileResults.push({ fileName: file.name, error: null, data, editing: { ...data } })
      } catch (err) {
        if (err.message === 'PASSWORD_REQUIRED') {
          fileResults.push({ fileName: file.name, error: null, data: null, needsPassword: true })
        } else {
          fileResults.push({ fileName: file.name, error: err.message, data: null })
        }
      }
    }

    setResults(fileResults)
    setPhase('results')
  }

  const handleUnlock = async (index) => {
    const file = files[index]
    const password = passwords[index]
    if (!file || !password) return

    setResults(prev => prev.map((r, i) => i === index ? { ...r, unlocking: true, passwordError: null } : r))

    try {
      const text = await extractTextFromPDF(file, password)
      if (text.trim().length < 50) {
        setResults(prev => prev.map((r, i) => i === index ? { fileName: file.name, error: 'El PDF no contiene texto legible.', data: null, needsPassword: false, unlocking: false } : r))
        return
      }
      const data = await extractStatement(text, file.name)
      setResults(prev => prev.map((r, i) => i === index ? { fileName: file.name, error: null, data, editing: { ...data }, needsPassword: false, unlocking: false } : r))
    } catch (err) {
      if (err.message === 'INCORRECT_PASSWORD') {
        setResults(prev => prev.map((r, i) => i === index ? { ...prev[i], passwordError: 'Contraseña incorrecta', unlocking: false } : r))
      } else {
        setResults(prev => prev.map((r, i) => i === index ? { fileName: file.name, error: err.message, data: null, needsPassword: false, unlocking: false } : r))
      }
    }
  }

  const handleRetry = async (index) => {
    const file = files[index]
    if (!file) return
    const password = passwords[index]
    setResults(prev => prev.map((r, i) => i === index ? { ...r, error: null, retrying: true } : r))

    try {
      const text = await extractTextFromPDF(file, password)
      const data = await extractStatement(text, file.name)
      setResults(prev => prev.map((r, i) => i === index ? { fileName: file.name, error: null, data, editing: { ...data }, retrying: false } : r))
    } catch (err) {
      if (err.message === 'PASSWORD_REQUIRED') {
        setResults(prev => prev.map((r, i) => i === index ? { fileName: file.name, error: null, data: null, needsPassword: true, retrying: false } : r))
      } else {
        setResults(prev => prev.map((r, i) => i === index ? { ...prev[i], error: err.message, retrying: false } : r))
      }
    }
  }

  const updateField = (index, field, value) => {
    setResults(prev => prev.map((r, i) => {
      if (i !== index) return r
      return { ...r, editing: { ...r.editing, [field]: value } }
    }))
  }

  const handleConfirm = async (index) => {
    const result = results[index]
    if (!result?.editing) return

    const e = result.editing
    const totalOwed = Number(e.total_owed)
    if (!totalOwed || totalOwed <= 0) {
      toast.error('El saldo total debe ser mayor a 0')
      return
    }

    const bankName = e.bank_name || 'Banco'
    const lastFour = e.card_last_four ? ` *${e.card_last_four}` : ''
    const debtName = `${bankName}${lastFour}`

    const debt = {
      name: debtName,
      original_amount: totalOwed,
      current_balance: totalOwed,
      minimum_payment: Number(e.minimum_payment) || 0,
      interest_rate: Number(e.monthly_interest_rate) || 0,
      bank_name: e.bank_name || null,
      card_last_four: e.card_last_four || null,
      annual_interest_rate: Number(e.annual_interest_rate) || null,
      payment_deadline: e.payment_deadline || null,
      period_interest: Number(e.period_interest) || 0,
      overdue_balance: Number(e.overdue_balance) || 0,
      cash_advances: Number(e.cash_advances) || 0,
      source: 'statement'
    }

    const saved = await onAdd(debt, result.data, result.fileName)
    if (saved) {
      setResults(prev => prev.map((r, i) => i === index ? { ...r, confirmed: true } : r))
    }
  }

  const handleSkip = (index) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, skipped: true } : r))
  }

  const allDone = results.length > 0 && results.every(r => r.confirmed || r.skipped || r.error || r.needsPassword)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Extracto Bancario</DialogTitle>
        </DialogHeader>

        {phase === 'select' && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Sube extractos PDF de tarjetas de credito o creditos bancarios colombianos para extraer automaticamente la informacion de la deuda.
            </p>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={handleFileSelect} />
            <Button className="w-full gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Seleccionar PDFs
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Max {MAX_FILES} archivos, 10MB cada uno
            </p>
          </div>
        )}

        {phase === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="font-semibold mb-2">Procesando {progress.current} de {progress.total}</p>
            <p className="text-sm text-muted-foreground">{progress.fileName}</p>
            <Progress value={(progress.current / progress.total) * 100} className="mt-4" />
          </div>
        )}

        {phase === 'results' && (
          <div className="space-y-3">
            {results.map((result, idx) => {
              if (result.confirmed) {
                return (
                  <Card key={idx} className="p-3 opacity-60">
                    <div className="flex items-center gap-2">
                      <Check className="size-4 text-green-500" />
                      <span className="text-sm">{result.fileName} — Guardado</span>
                    </div>
                  </Card>
                )
              }

              if (result.skipped) {
                return (
                  <Card key={idx} className="p-3 opacity-50">
                    <div className="flex items-center gap-2">
                      <SkipForward className="size-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{result.fileName} — Omitido</span>
                    </div>
                  </Card>
                )
              }

              if (result.needsPassword) {
                return (
                  <Card key={idx} className="p-3 border-yellow-500/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="size-4 text-yellow-500" />
                      <span className="text-sm font-semibold">{result.fileName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Este PDF esta protegido con contraseña.</p>
                    <Input
                      type="password"
                      placeholder="Contraseña del PDF"
                      value={passwords[idx] || ''}
                      onChange={e => setPasswords(prev => ({ ...prev, [idx]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter' && passwords[idx]) handleUnlock(idx) }}
                      disabled={result.unlocking}
                      className="mb-1"
                    />
                    <p className="text-xs text-muted-foreground mb-3">Generalmente es tu numero de cedula</p>
                    {result.passwordError && <p className="text-sm text-destructive mb-2">{result.passwordError}</p>}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleSkip(idx)}>
                        <SkipForward className="size-3.5" /> Omitir
                      </Button>
                      <Button size="sm" className="flex-1 gap-1" onClick={() => handleUnlock(idx)} disabled={!passwords[idx] || result.unlocking}>
                        {result.unlocking ? <><Loader2 className="size-3.5 animate-spin" /> Desbloqueando...</> : <><Lock className="size-3.5" /> Desbloquear</>}
                      </Button>
                    </div>
                  </Card>
                )
              }

              if (result.error) {
                return (
                  <Card key={idx} className="p-3 border-destructive/50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="size-4 text-destructive" />
                      <span className="text-sm font-semibold">{result.fileName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{result.error}</p>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handleRetry(idx)} disabled={result.retrying}>
                      {result.retrying ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                      {result.retrying ? ' Reintentando...' : ' Reintentar'}
                    </Button>
                  </Card>
                )
              }

              const e = result.editing
              return (
                <Card key={idx} className="p-3">
                  <div className="text-sm font-semibold mb-3">{result.fileName}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Banco</Label>
                      <Input type="text" value={e.bank_name || ''} onChange={ev => updateField(idx, 'bank_name', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ultimos 4 digitos</Label>
                      <Input type="text" maxLength={4} value={e.card_last_four || ''} onChange={ev => updateField(idx, 'card_last_four', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Saldo total (COP)</Label>
                      <Input type="number" value={e.total_owed ?? ''} onChange={ev => updateField(idx, 'total_owed', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pago minimo (COP)</Label>
                      <Input type="number" value={e.minimum_payment ?? ''} onChange={ev => updateField(idx, 'minimum_payment', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fecha limite</Label>
                      <Input type="date" value={e.payment_deadline || ''} onChange={ev => updateField(idx, 'payment_deadline', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tasa mensual (%)</Label>
                      <Input type="number" step="0.01" value={e.monthly_interest_rate ?? ''} onChange={ev => updateField(idx, 'monthly_interest_rate', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tasa EA (%)</Label>
                      <Input type="number" step="0.01" value={e.annual_interest_rate ?? ''} onChange={ev => updateField(idx, 'annual_interest_rate', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Intereses periodo</Label>
                      <Input type="number" value={e.period_interest ?? ''} onChange={ev => updateField(idx, 'period_interest', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Saldo en mora</Label>
                      <Input type="number" value={e.overdue_balance ?? ''} onChange={ev => updateField(idx, 'overdue_balance', ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Avances efectivo</Label>
                      <Input type="number" value={e.cash_advances ?? ''} onChange={ev => updateField(idx, 'cash_advances', ev.target.value)} />
                    </div>
                  </div>
                  {e.total_owed && (
                    <div className="text-sm text-muted-foreground mt-3 p-2 rounded-md bg-muted">
                      Deuda: <strong>{e.bank_name || 'Banco'}{e.card_last_four ? ` *${e.card_last_four}` : ''}</strong> — {formatCOP(Number(e.total_owed))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleSkip(idx)}>
                      <SkipForward className="size-3.5" /> Omitir
                    </Button>
                    <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleConfirm(idx)}>
                      <Check className="size-3.5" /> Confirmar
                    </Button>
                  </div>
                </Card>
              )
            })}

            {allDone && (
              <Button className="w-full mt-2" onClick={onClose}>Cerrar</Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
