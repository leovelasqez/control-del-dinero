import { useState, useRef } from 'react'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '../lib/constants'
import { compressImage } from '../lib/compressImage'
import { scanReceipt } from '../api/anthropic'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ScanReceiptModal({ onClose, onAdd }) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato no soportado. Usa JPG, PNG, WebP o GIF.')
      return
    }

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error('La imagen es muy grande. Maximo 10MB.')
      return
    }

    setScanning(true)
    try {
      const { base64, mediaType } = await compressImage(file)
      const data = await scanReceipt(base64, mediaType)
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
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleConfirm = async () => {
    if (!result || !result.amount || Number(result.amount) <= 0) return
    setSaving(true)
    try {
      const saved = await onAdd({
        date: result.date,
        type: 'gasto',
        category: result.category,
        description: result.description,
        amount: Number(result.amount),
        account: 'Efectivo'
      })
      if (saved) onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escanear Recibo</DialogTitle>
        </DialogHeader>

        {!result && !scanning && (
          <div className="flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
            <Button className="w-full gap-2" onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }}>
              <Camera className="size-4" /> Tomar foto
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}>
              <Upload className="size-4" /> Subir imagen
            </Button>
          </div>
        )}

        {scanning && (
          <div className="text-center py-8">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Analizando recibo con IA...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Verifica los datos extraidos:</p>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={result.date} onChange={e => setResult({ ...result, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={result.category} onValueChange={v => setResult({ ...result, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Input type="text" value={result.description} onChange={e => setResult({ ...result, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Monto (COP)</Label>
              <Input type="number" value={result.amount} onChange={e => setResult({ ...result, amount: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>Reintentar</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirm} disabled={saving}>
                {saving ? 'Guardando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
