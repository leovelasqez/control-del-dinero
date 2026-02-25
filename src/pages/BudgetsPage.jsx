import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { EXPENSE_CATEGORIES, formatCOP } from '../lib/constants'

export default function BudgetsPage({ budgets, transactions, onUpsert, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [limit, setLimit] = useState('')
  const [editing, setEditing] = useState(null)
  const [editLimit, setEditLimit] = useState('')

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const spentByCategory = useMemo(() => {
    const spent = {}
    transactions
      .filter(t => {
        if (t.type !== 'gasto') return false
        const d = new Date(t.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .forEach(t => {
        spent[t.category] = (spent[t.category] || 0) + Number(t.amount)
      })
    return spent
  }, [transactions, currentMonth, currentYear])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!limit || Number(limit) <= 0) return
    onUpsert(category, Number(limit))
    setLimit('')
    setShowForm(false)
  }

  const handleEdit = (b) => {
    setEditing(b)
    setEditLimit(String(b.monthly_limit))
  }

  const handleSaveEdit = () => {
    if (!editLimit || Number(editLimit) <= 0) return
    onUpdate(editing.id, { monthly_limit: Number(editLimit) })
    setEditing(null)
    setEditLimit('')
  }

  const getColor = (pct) => {
    if (pct > 90) return '#ef4444'
    if (pct > 70) return '#eab308'
    return '#22c55e'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Presupuestos del Mes</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Agregar
        </button>
      </div>

      {budgets.length === 0 && !showForm && (
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="text-muted">No tienes presupuestos definidos.</p>
          <p className="text-muted text-sm mt-2">Define limites mensuales por categoria para controlar tus gastos.</p>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 items-end" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                <label>Categoria</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                <label>Limite mensual (COP)</label>
                <input type="number" className="form-input" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0" min="1" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-success btn-sm">Guardar</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid-2">
        {budgets.map(b => {
          const spent = spentByCategory[b.category] || 0
          const limitVal = Number(b.monthly_limit)
          const pct = limitVal > 0 ? (spent / limitVal) * 100 : 0
          const remaining = limitVal - spent

          return (
            <div key={b.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div style={{ fontWeight: 600 }}>{b.category}</div>
                  <div className="text-xs text-muted">
                    {formatCOP(spent)} de {formatCOP(limitVal)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(b)} title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onDelete(b.id)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: getColor(pct)
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs" style={{ color: getColor(pct) }}>
                  {pct.toFixed(0)}%
                </span>
                <span className={`text-xs ${remaining >= 0 ? 'text-green' : 'text-red'}`}>
                  {remaining >= 0 ? `Quedan ${formatCOP(remaining)}` : `Excedido ${formatCOP(Math.abs(remaining))}`}
                </span>
              </div>
              {pct > 90 && (
                <div className="text-xs text-red mt-2" style={{ fontWeight: 600 }}>
                  {pct >= 100 ? 'Presupuesto excedido' : 'Cerca del limite'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2>Editar Presupuesto</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <input type="text" className="form-input" value={editing.category} disabled />
            </div>
            <div className="form-group">
              <label>Limite mensual (COP)</label>
              <input type="number" className="form-input" value={editLimit} onChange={e => setEditLimit(e.target.value)} min="1" />
            </div>
            <button className="btn btn-primary w-full mt-2" onClick={handleSaveEdit}>Guardar cambios</button>
          </div>
        </div>
      )}
    </div>
  )
}
