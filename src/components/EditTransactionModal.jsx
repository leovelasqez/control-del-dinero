import { useState } from 'react'
import { X } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants'

export default function EditTransactionModal({ transaction, onClose, onSave }) {
  const [form, setForm] = useState({
    date: transaction.date,
    type: transaction.type,
    category: transaction.category,
    description: transaction.description,
    amount: String(transaction.amount)
  })

  const categories = form.type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
    onSave(transaction.id, {
      date: form.date,
      type: form.type,
      category: form.category,
      description: form.description,
      amount: Number(form.amount)
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2>Editar Transaccion</h2>
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
            <label>Tipo</label>
            <select
              className="form-input"
              value={form.type}
              onChange={e => {
                const newType = e.target.value
                const newCategories = newType === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
                setForm({
                  ...form,
                  type: newType,
                  category: newCategories.includes(form.category) ? form.category : newCategories[0]
                })
              }}
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
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
            <label>Descripcion</label>
            <input
              type="text"
              className="form-input"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Monto (COP)</label>
            <input
              type="number"
              className="form-input"
              min="1"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  )
}
