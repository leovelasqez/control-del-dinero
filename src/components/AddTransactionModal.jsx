import { useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ACCOUNT_OPTIONS } from '../lib/constants'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AddTransactionModal({ onClose, onAdd, initialType = 'gasto' }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: initialType,
    category: initialType === 'ingreso' ? 'Salario' : 'Comida',
    description: '',
    amount: '',
    account: 'Efectivo'
  })
  const [customAccount, setCustomAccount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const categories = form.type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0 || submitting) return
    setSubmitting(true)
    const accountValue = form.account === 'Otra' ? customAccount.trim() || 'Otra' : form.account
    const result = await onAdd({
      date: form.date,
      type: form.type,
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
      account: accountValue
    })
    if (result) {
      onClose()
    } else {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.type === 'ingreso' ? 'Agregar Ingreso' : 'Agregar Gasto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select value={form.account} onValueChange={v => setForm({ ...form, account: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCOUNT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.account === 'Otra' && (
            <div className="space-y-2">
              <Label>Nombre de la cuenta</Label>
              <Input
                type="text"
                placeholder="Ej: Nequi, Daviplata..."
                value={customAccount}
                onChange={e => setCustomAccount(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Descripcion</Label>
            <Input
              type="text"
              placeholder="Ej: Almuerzo en restaurante"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Monto (COP)</Label>
            <Input
              type="number"
              placeholder="0"
              min="1"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <Button
            type="submit"
            className={`w-full ${form.type === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            disabled={submitting}
          >
            {submitting ? 'Guardando...' : 'Agregar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
