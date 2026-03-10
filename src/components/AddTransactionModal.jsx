import { useState } from 'react'
import { X } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ACCOUNT_OPTIONS } from '../lib/constants'

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

  const categories = form.type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const [submitting, setSubmitting] = useState(false)

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2>{form.type === 'ingreso' ? 'Agregar Ingreso' : 'Agregar Gasto'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              className="form-input"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select
              className="form-input"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Cuenta</label>
            <select
              className="form-input"
              value={form.account}
              onChange={e => setForm({ ...form, account: e.target.value })}
            >
              {ACCOUNT_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {form.account === 'Otra' && (
            <div className="form-group">
              <label>Nombre de la cuenta</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Nequi, Daviplata..."
                value={customAccount}
                onChange={e => setCustomAccount(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Descripcion</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Almuerzo en restaurante"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Monto (COP)</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              min="1"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <button type="submit" className={`btn ${form.type === 'ingreso' ? 'btn-success' : 'btn-danger'} w-full mt-2`} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Agregar'}
          </button>
        </form>
      </div>
    </div>
  )
}
