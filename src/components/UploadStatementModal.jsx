import { useState, useRef } from 'react'
import { X, Upload, Loader, Check, SkipForward, RotateCcw, AlertTriangle, Lock } from 'lucide-react'
import { extractTextFromPDF } from '../lib/pdfExtractor'
import { extractStatement } from '../api/anthropic'
import { formatCOP } from '../lib/constants'
import toast from 'react-hot-toast'

const MAX_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadStatementModal({ onClose, onAdd }) {
  const [phase, setPhase] = useState('select') // select | processing | results
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
          fileResults.push({
            fileName: file.name,
            error: 'El PDF no contiene texto legible. Puede ser un documento escaneado como imagen.',
            data: null
          })
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
        setResults(prev => prev.map((r, i) => i === index ? {
          fileName: file.name,
          error: 'El PDF no contiene texto legible. Puede ser un documento escaneado como imagen.',
          data: null, needsPassword: false, unlocking: false
        } : r))
        return
      }

      const data = await extractStatement(text, file.name)
      setResults(prev => prev.map((r, i) => i === index ? {
        fileName: file.name, error: null, data, editing: { ...data },
        needsPassword: false, unlocking: false
      } : r))
    } catch (err) {
      if (err.message === 'INCORRECT_PASSWORD') {
        setResults(prev => prev.map((r, i) => i === index ? {
          ...prev[i], passwordError: 'Contraseña incorrecta', unlocking: false
        } : r))
      } else {
        setResults(prev => prev.map((r, i) => i === index ? {
          fileName: file.name, error: err.message, data: null,
          needsPassword: false, unlocking: false
        } : r))
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
        setResults(prev => prev.map((r, i) => i === index ? {
          fileName: file.name, error: null, data: null,
          needsPassword: true, retrying: false
        } : r))
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
  const pendingResults = results.filter(r => !r.confirmed && !r.skipped && !r.error && !r.needsPassword && r.data)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2>Subir Extracto Bancario</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {/* FASE 1: Seleccion */}
        {phase === 'select' && (
          <div>
            <p className="text-sm text-muted mb-4">
              Sube extractos PDF de tarjetas de credito o creditos bancarios colombianos para extraer automaticamente la informacion de la deuda.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button className="btn btn-primary w-full" onClick={() => fileRef.current?.click()}>
              <Upload size={18} /> Seleccionar PDFs
            </button>
            <p className="text-xs text-muted mt-2" style={{ textAlign: 'center' }}>
              Max {MAX_FILES} archivos, 10MB cada uno
            </p>
          </div>
        )}

        {/* FASE 2: Procesamiento */}
        {phase === 'processing' && (
          <div className="text-center" style={{ padding: 32 }}>
            <Loader size={32} className="spinner" style={{ margin: '0 auto 16px', border: 'none', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              Procesando {progress.current} de {progress.total}
            </p>
            <p className="text-sm text-muted">{progress.fileName}</p>
            <div className="progress-bar mt-4">
              <div
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%`, background: 'var(--primary)' }}
              />
            </div>
          </div>
        )}

        {/* FASE 3: Resultados */}
        {phase === 'results' && (
          <div>
            {results.map((result, idx) => {
              if (result.confirmed) {
                return (
                  <div key={idx} className="card mb-3" style={{ opacity: 0.6 }}>
                    <div className="flex items-center gap-2">
                      <Check size={16} style={{ color: '#22c55e' }} />
                      <span className="text-sm">{result.fileName} — Guardado</span>
                    </div>
                  </div>
                )
              }

              if (result.skipped) {
                return (
                  <div key={idx} className="card mb-3" style={{ opacity: 0.5 }}>
                    <div className="flex items-center gap-2">
                      <SkipForward size={16} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm text-muted">{result.fileName} — Omitido</span>
                    </div>
                  </div>
                )
              }

              if (result.needsPassword) {
                return (
                  <div key={idx} className="card mb-3" style={{ borderColor: '#f59e0b' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={16} style={{ color: '#f59e0b' }} />
                      <span className="text-sm" style={{ fontWeight: 600 }}>{result.fileName}</span>
                    </div>
                    <p className="text-sm text-muted mb-2">Este PDF esta protegido con contraseña.</p>
                    <div className="form-group mb-2">
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Contraseña del PDF"
                        value={passwords[idx] || ''}
                        onChange={e => setPasswords(prev => ({ ...prev, [idx]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && passwords[idx]) handleUnlock(idx) }}
                        disabled={result.unlocking}
                      />
                    </div>
                    <p className="text-xs text-muted mb-3">Generalmente es tu numero de cedula</p>
                    {result.passwordError && (
                      <p className="text-sm mb-2" style={{ color: '#ef4444' }}>{result.passwordError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleSkip(idx)}
                      >
                        <SkipForward size={14} /> Omitir
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleUnlock(idx)}
                        disabled={!passwords[idx] || result.unlocking}
                      >
                        {result.unlocking
                          ? <><Loader size={14} className="spinner" style={{ border: 'none', animation: 'spin 1s linear infinite' }} /> Desbloqueando...</>
                          : <><Lock size={14} /> Desbloquear</>
                        }
                      </button>
                    </div>
                  </div>
                )
              }

              if (result.error) {
                return (
                  <div key={idx} className="card mb-3" style={{ borderColor: '#ef4444' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                      <span className="text-sm" style={{ fontWeight: 600 }}>{result.fileName}</span>
                    </div>
                    <p className="text-sm text-muted mb-3">{result.error}</p>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRetry(idx)}
                      disabled={result.retrying}
                    >
                      {result.retrying ? <Loader size={14} className="spinner" style={{ border: 'none', animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={14} />}
                      {result.retrying ? ' Reintentando...' : ' Reintentar'}
                    </button>
                  </div>
                )
              }

              const e = result.editing
              return (
                <div key={idx} className="card mb-3">
                  <div className="text-sm" style={{ fontWeight: 600, marginBottom: 12 }}>{result.fileName}</div>

                  <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                      <label>Banco</label>
                      <input type="text" className="form-input" value={e.bank_name || ''} onChange={ev => updateField(idx, 'bank_name', ev.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                      <label>Ultimos 4 digitos</label>
                      <input type="text" className="form-input" maxLength={4} value={e.card_last_four || ''} onChange={ev => updateField(idx, 'card_last_four', ev.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                      <label>Saldo total (COP)</label>
                      <input type="number" className="form-input" value={e.total_owed ?? ''} onChange={ev => updateField(idx, 'total_owed', ev.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                      <label>Pago minimo (COP)</label>
                      <input type="number" className="form-input" value={e.minimum_payment ?? ''} onChange={ev => updateField(idx, 'minimum_payment', ev.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                      <label>Fecha limite de pago</label>
                      <input type="date" className="form-input" value={e.payment_deadline || ''} onChange={ev => updateField(idx, 'payment_deadline', ev.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                      <label>Tasa mensual (%)</label>
                      <input type="number" className="form-input" step="0.01" value={e.monthly_interest_rate ?? ''} onChange={ev => updateField(idx, 'monthly_interest_rate', ev.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                      <label>Tasa EA (%)</label>
                      <input type="number" className="form-input" step="0.01" value={e.annual_interest_rate ?? ''} onChange={ev => updateField(idx, 'annual_interest_rate', ev.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                      <label>Intereses periodo</label>
                      <input type="number" className="form-input" value={e.period_interest ?? ''} onChange={ev => updateField(idx, 'period_interest', ev.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                      <label>Saldo en mora</label>
                      <input type="number" className="form-input" value={e.overdue_balance ?? ''} onChange={ev => updateField(idx, 'overdue_balance', ev.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                      <label>Avances efectivo</label>
                      <input type="number" className="form-input" value={e.cash_advances ?? ''} onChange={ev => updateField(idx, 'cash_advances', ev.target.value)} />
                    </div>
                  </div>

                  {e.total_owed && (
                    <div className="text-sm text-muted mb-3" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 8 }}>
                      Deuda: <strong>{e.bank_name || 'Banco'}{e.card_last_four ? ` *${e.card_last_four}` : ''}</strong> — {formatCOP(Number(e.total_owed))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleSkip(idx)}>
                      <SkipForward size={14} /> Omitir
                    </button>
                    <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleConfirm(idx)}>
                      <Check size={14} /> Confirmar
                    </button>
                  </div>
                </div>
              )
            })}

            {allDone && pendingResults.length === 0 && (
              <button className="btn btn-primary w-full mt-2" onClick={onClose}>
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
