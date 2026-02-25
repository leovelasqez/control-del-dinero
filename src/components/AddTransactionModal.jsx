import { useState } from 'react'
import { X } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants'

export default function AddTransactionModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'gasto',
    category: 'Comida',
    description: '',
    amount: ''
  })

  const categories = form.type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
    onAdd({
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
          <h2>Agregar Transaccion</h2>
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
              onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === 'gasto' ? 'Comida' : 'Salario' })}
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
          <button type="submit" className="btn btn-primary w-full mt-2">
            Agregar
          </button>
        </form>
      </div>
    </div>
  )
}
