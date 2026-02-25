import { useState } from 'react'
import { Plus, Trash2, Target, Pencil, X } from 'lucide-react'
import { formatCOP } from '../lib/constants'

export default function GoalsPage({ goals, onAdd, onAddToGoal, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', deadline: '' })
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', target_amount: '', current_amount: '', deadline: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.target_amount) return
    onAdd({
      name: form.name,
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount) || 0,
      deadline: form.deadline || null
    })
    setForm({ name: '', target_amount: '', current_amount: '0', deadline: '' })
    setShowForm(false)
  }

  const handleEdit = (g) => {
    setEditing(g)
    setEditForm({
      name: g.name,
      target_amount: String(g.target_amount),
      current_amount: String(g.current_amount),
      deadline: g.deadline || ''
    })
  }

  const handleSaveEdit = () => {
    if (!editForm.name || !editForm.target_amount) return
    onUpdate(editing.id, {
      name: editForm.name,
      target_amount: Number(editForm.target_amount),
      current_amount: Number(editForm.current_amount) || 0,
      deadline: editForm.deadline || null
    })
    setEditing(null)
  }

  const quickAmounts = [50000, 100000, 200000]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Metas de Ahorro</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Nueva meta
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la meta</label>
              <input type="text" className="form-input" placeholder="Ej: Vacaciones" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                <label>Monto objetivo (COP)</label>
                <input type="number" className="form-input" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })} min="1" required />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                <label>Ya ahorrado (COP)</label>
                <input type="number" className="form-input" value={form.current_amount} onChange={e => setForm({ ...form, current_amount: e.target.value })} min="0" />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                <label>Fecha limite</label>
                <input type="date" className="form-input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-success btn-sm">Crear meta</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <div className="card text-center" style={{ padding: 40 }}>
          <Target size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-muted">No tienes metas de ahorro.</p>
        </div>
      )}

      <div className="grid-2">
        {goals.map(g => {
          const target = Number(g.target_amount)
          const current = Number(g.current_amount)
          const pct = target > 0 ? (current / target) * 100 : 0
          const achieved = pct >= 100

          let daysLeft = null
          if (g.deadline) {
            const diff = new Date(g.deadline) - new Date()
            daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
          }

          return (
            <div key={g.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 600 }}>{g.name}</span>
                    {achieved && <span className="badge badge-green">Lograda</span>}
                  </div>
                  <div className="text-xs text-muted mt-2">
                    {formatCOP(current)} de {formatCOP(target)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(g)} title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onDelete(g.id)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: achieved ? '#22c55e' : '#6366f1' }} />
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-xs" style={{ color: achieved ? '#22c55e' : '#6366f1' }}>
                  {pct.toFixed(0)}%
                </span>
                {daysLeft !== null && (
                  <span className={`text-xs ${daysLeft < 30 ? 'text-red' : 'text-muted'}`}>
                    {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Plazo vencido'}
                  </span>
                )}
              </div>

              {!achieved && (
                <div className="flex gap-2 mt-4">
                  {quickAmounts.map(amt => (
                    <button key={amt} className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onAddToGoal(g.id, amt)}>
                      +{(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
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
              <h2>Editar Meta</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label>Nombre de la meta</label>
              <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Monto objetivo (COP)</label>
              <input type="number" className="form-input" value={editForm.target_amount} onChange={e => setEditForm({ ...editForm, target_amount: e.target.value })} min="1" required />
            </div>
            <div className="form-group">
              <label>Monto ahorrado (COP)</label>
              <input type="number" className="form-input" value={editForm.current_amount} onChange={e => setEditForm({ ...editForm, current_amount: e.target.value })} min="0" />
            </div>
            <div className="form-group">
              <label>Fecha limite</label>
              <input type="date" className="form-input" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
            </div>
            <button className="btn btn-primary w-full mt-2" onClick={handleSaveEdit}>Guardar cambios</button>
          </div>
        </div>
      )}
    </div>
  )
}
