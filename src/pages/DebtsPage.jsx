import { useState } from 'react'
import { Plus, Trash2, CreditCard, Pencil, FileUp } from 'lucide-react'
import { formatCOP } from '../lib/constants'
import ConfirmDialog from '../components/ConfirmDialog'
import UploadStatementModal from '../components/UploadStatementModal'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export default function DebtsPage({ debts, loading, onAdd, onPay, onUpdate, onDelete, onAddTransaction }) {
  const [showForm, setShowForm] = useState(false)
  const [payingDebt, setPayingDebt] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [form, setForm] = useState({ name: '', original_amount: '', minimum_payment: '', interest_rate: '' })
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', minimum_payment: '', interest_rate: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showStatement, setShowStatement] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.original_amount) return
    onAdd({
      name: form.name,
      original_amount: Number(form.original_amount),
      minimum_payment: Number(form.minimum_payment) || 0,
      interest_rate: Number(form.interest_rate) || 0
    })
    setForm({ name: '', original_amount: '', minimum_payment: '', interest_rate: '' })
    setShowForm(false)
  }

  const handleEdit = (d) => {
    setEditing(d)
    setEditForm({ name: d.name, minimum_payment: String(d.minimum_payment), interest_rate: String(d.interest_rate) })
  }

  const handleSaveEdit = () => {
    if (!editForm.name) return
    onUpdate(editing.id, {
      name: editForm.name,
      minimum_payment: Number(editForm.minimum_payment) || 0,
      interest_rate: Number(editForm.interest_rate) || 0
    })
    setEditing(null)
  }

  const handlePay = async (debtId, debtName) => {
    const debt = debts.find(d => d.id === debtId)
    const amount = Math.min(Number(payAmount), Number(debt?.current_balance || 0))
    if (!amount || amount <= 0) return
    try {
      const result = await onPay(debtId, amount)
      if (result) {
        try {
          await onAddTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'gasto',
            category: 'Otros',
            description: `Abono deuda: ${debtName}`,
            amount
          })
        } catch {
          toast.error('El abono se registró pero no se pudo crear la transacción de gasto.')
        }
      }
    } catch {
      toast.error('Error al registrar el abono.')
    }
    setPayingDebt(null)
    setPayAmount('')
  }

  const calcMonths = (balance, payment, rate) => {
    if (payment <= 0 || balance <= 0) return null
    if (rate <= 0) return Math.ceil(balance / payment)
    const r = rate / 100
    if (payment <= balance * r) return Infinity
    return Math.ceil(Math.log(payment / (payment - balance * r)) / Math.log(1 + r))
  }

  const calcTotalInterest = (balance, payment, rate, months) => {
    if (!months || months === Infinity || rate <= 0) return 0
    return (payment * months) - balance
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Deudas</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowStatement(true)}>
            <FileUp className="size-3.5" /> Subir extracto
          </Button>
          <Button size="sm" className="gap-1" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Nueva deuda
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input placeholder="Ej: Tarjeta de credito" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Saldo actual (COP)</Label>
                  <Input type="number" value={form.original_amount} onChange={e => setForm({ ...form, original_amount: e.target.value })} min="1" required />
                </div>
                <div className="space-y-2">
                  <Label>Cuota minima mensual</Label>
                  <Input type="number" value={form.minimum_payment} onChange={e => setForm({ ...form, minimum_payment: e.target.value })} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Tasa interes mensual (%)</Label>
                  <Input type="number" step="0.01" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} min="0" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">Registrar</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && debts.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-10">
            <CreditCard className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tienes deudas registradas.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {debts.map(d => {
          const original = Number(d.original_amount)
          const balance = Number(d.current_balance)
          const payment = Number(d.minimum_payment)
          const rate = Number(d.interest_rate)
          const paid = original - balance
          const pctPaid = original > 0 ? (paid / original) * 100 : 0
          const months = calcMonths(balance, payment, rate)
          const totalInterest = calcTotalInterest(balance, payment, rate, months)
          const payments = d.debt_payments || []
          const recentPayments = [...payments].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at)).slice(0, 4)

          return (
            <Card key={d.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    {d.source === 'statement' && (
                      <Badge variant="secondary" className="mt-1 text-xs">Extracto</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => handleEdit(d)} title="Editar">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setConfirmDelete(d)} title="Eliminar">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm space-y-1 mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Saldo actual:</span><span className="text-red-500 font-medium">{formatCOP(balance)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cuota minima:</span><span>{formatCOP(payment)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tasa interes:</span><span>{rate}% mensual</span></div>
                  {months !== null && months !== Infinity && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Meses restantes:</span><span>{months}</span></div>
                  )}
                  {totalInterest > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Intereses totales:</span><span className="text-red-500">{formatCOP(totalInterest)}</span></div>
                  )}
                  {d.bank_name && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Banco:</span><span>{d.bank_name}{d.card_last_four ? ` *${d.card_last_four}` : ''}</span></div>
                  )}
                  {d.annual_interest_rate > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Tasa EA:</span><span>{d.annual_interest_rate}%</span></div>
                  )}
                  {d.payment_deadline && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Fecha limite:</span><span>{new Date(d.payment_deadline + 'T00:00:00').toLocaleDateString('es-CO')}</span></div>
                  )}
                  {Number(d.overdue_balance) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Saldo en mora:</span><span className="text-red-500">{formatCOP(Number(d.overdue_balance))}</span></div>
                  )}
                </div>

                <Progress value={Math.min(pctPaid, 100)} className="h-2 mb-1" />
                <div className="text-xs text-muted-foreground mb-4">{pctPaid.toFixed(0)}% pagado</div>

                {payingDebt === d.id ? (
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Monto" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="flex-1" />
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handlePay(d.id, d.name)}>Abonar</Button>
                    <Button variant="outline" size="sm" onClick={() => { setPayingDebt(null); setPayAmount('') }}>X</Button>
                  </div>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => setPayingDebt(d.id)}>Registrar abono</Button>
                )}

                {recentPayments.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground mb-2">Ultimos abonos:</div>
                    {recentPayments.map(p => (
                      <div key={p.id} className="flex justify-between text-xs py-0.5">
                        <span className="text-muted-foreground">{new Date(p.paid_at).toLocaleDateString('es-CO')}</span>
                        <span className="text-green-500">{formatCOP(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {editing && (
        <Dialog open onOpenChange={(open) => { if (!open) setEditing(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Deuda</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Cuota minima mensual (COP)</Label>
                <Input type="number" value={editForm.minimum_payment} onChange={e => setEditForm({ ...editForm, minimum_payment: e.target.value })} min="0" />
              </div>
              <div className="space-y-2">
                <Label>Tasa interes mensual (%)</Label>
                <Input type="number" step="0.01" value={editForm.interest_rate} onChange={e => setEditForm({ ...editForm, interest_rate: e.target.value })} min="0" />
              </div>
              <Button className="w-full" onClick={handleSaveEdit}>Guardar cambios</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar la deuda "${confirmDelete.name}"?`}
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showStatement && (
        <UploadStatementModal onClose={() => setShowStatement(false)} onAdd={onAdd} />
      )}
    </div>
  )
}
