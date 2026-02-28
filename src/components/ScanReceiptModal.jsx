import { useState, useRef } from 'react'
import { X, Camera, Upload, Loader } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '../lib/constants'
import { scanReceipt } from '../api/anthropic'
import toast from 'react-hot-toast'

export default function ScanReceiptModal({ onClose, onAdd }) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato no soportado. Usa JPG, PNG, WebP o GIF.')
      return
    }

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      toast.error('La imagen es muy grande. Máximo 5MB.')
      return
    }

    setScanning(true)
    try {
      const reader = new FileReader()
      reader.onerror = () => {
        toast.error('Error al leer el archivo')
        setScanning(false)
      }
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1]
        try {
          const data = await scanReceipt(base64, file.type)
          setResult({
            date: data.date || new Date().toISOString().split('T')[0],
            category: EXPENSE_CATEGORIES.includes(data.category) ? data.category : 'Otros',
            description: data.description || '',
            amount: String(Math.abs(Number(String(data.amount).replace(/[^0-9.-]/g, ''))) || '')
          })
        } catch (err) {
          toast.error('Error al escanear el recibo: ' + err.message)
        } finally {
          setScanning(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('Error al leer el archivo')
      setScanning(false)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleConfirm = () => {
    if (!result || !result.amount || Number(result.amount) <= 0) return
    onAdd({
      date: result.date,
      type: 'gasto',
      category: result.category,
      description: result.description,
      amount: Number(result.amount)
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2>Escanear Recibo</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {!result && !scanning && (
          <div className="flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            <button className="btn btn-primary w-full" onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }}>
              <Camera size={18} /> Tomar foto
            </button>
            <button className="btn btn-ghost w-full" onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}>
              <Upload size={18} /> Subir imagen
            </button>
          </div>
        )}

        {scanning && (
          <div className="text-center" style={{ padding: 32 }}>
            <Loader size={32} className="spinner" style={{ margin: '0 auto 16px', border: 'none', animation: 'spin 1s linear infinite' }} />
            <p className="text-muted">Analizando recibo con IA...</p>
          </div>
        )}

        {result && (
          <div>
            <p className="text-sm text-muted mb-4">Verifica los datos extraidos:</p>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" className="form-input" value={result.date} onChange={e => setResult({ ...result, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <select className="form-input" value={result.category} onChange={e => setResult({ ...result, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Descripcion</label>
              <input type="text" className="form-input" value={result.description} onChange={e => setResult({ ...result, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Monto (COP)</label>
              <input type="number" className="form-input" value={result.amount} onChange={e => setResult({ ...result, amount: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setResult(null)}>Reintentar</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleConfirm}>Confirmar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
