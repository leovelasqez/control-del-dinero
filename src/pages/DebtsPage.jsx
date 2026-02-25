import { useState } from 'react'
import { Plus, Trash2, CreditCard, Pencil, X } from 'lucide-react'
import { formatCOP } from '../lib/constants'

export default function DebtsPage({ debts, onAdd, onPay, onUpdate, onDelete, onAddTransaction }) {
  const [showForm, setShowForm] = useState(false)
  const [payingDebt, setPayingDebt] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [form, setForm] = useState({
    name: '', original_amount: '', minimum_payment: '', interest_rate: ''
  })
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '', minimum_payment: '', interest_rate: ''
  })

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
    setEditForm({
      name: d.name,
      minimum_payment: String(d.minimum_payment),
      interest_rate: String(d.interest_rate)
    })
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
    const amount = Number(payAmount)
    if (!amount || amount <= 0) return
    const result = await onPay(debtId, amount)
    if (result) {
      await onAddTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'gasto',
        category: 'Otros',
        description: `Abono deuda: ${debtName}`,
        amount
      })
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Deudas</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Nueva deuda
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" className="form-input" placeholder="Ej: Tarjeta de credito" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label>Saldo actual (COP)</label>
                <input type="number" className="form-input" value={form.original_amount} onChange={e => setForm({ ...form, original_amount: e.target.value })} min="1" required />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label>Cuota minima mensual</label>
                <input type="number" className="form-input" value={form.minimum_payment} onChange={e => setForm({ ...form, minimum_payment: e.target.value })} min="0" />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label>Tasa interes mensual (%)</label>
                <input type="number" className="form-input" step="0.01" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} min="0" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-success btn-sm">Registrar</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {debts.length === 0 && !showForm && (
        <div className="card text-center" style={{ padding: 40 }}>
          <CreditCard size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-muted">No tienes deudas registradas.</p>
        </div>
      )}

      <div className="grid-2">
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
            <div key={d.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(d)} title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onDelete(d.id)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted">Saldo actual:</span>
                  <span className="text-red">{formatCOP(balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Cuota minima:</span>
                  <span>{formatCOP(payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Tasa interes:</span>
                  <span>{rate}% mensual</span>
                </div>
                {months !== null && months !== Infinity && (
                  <div className="flex justify-between">
                    <span className="text-muted">Meses restantes:</span>
                    <span>{months}</span>
                  </div>
                )}
                {totalInterest > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Intereses totales:</span>
                    <span className="text-red">{formatCOP(totalInterest)}</span>
                  </div>
                )}
              </div>

              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{ width: `${Math.min(pctPaid, 100)}%`, background: '#22c55e' }} />
              </div>
              <div className="text-xs text-muted mb-4">{pctPaid.toFixed(0)}% pagado</div>

              {payingDebt === d.id ? (
                <div className="flex gap-2">
                  <input type="number" className="form-input" placeholder="Monto" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn btn-success btn-sm" onClick={() => handlePay(d.id, d.name)}>Abonar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setPayingDebt(null); setPayAmount('') }}>X</button>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm w-full" onClick={() => setPayingDebt(d.id)}>
                  Registrar abono
                </button>
              )}

              {recentPayments.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-muted mb-2">Ultimos abonos:</div>
                  {recentPayments.map(p => (
                    <div key={p.id} className="flex justify-between text-xs" style={{ padding: '2px 0' }}>
                      <span className="text-muted">{new Date(p.paid_at).toLocaleDateString('es-CO')}</span>
                      <span className="text-green">{formatCOP(p.amount)}</span>
                    </div>
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
              <h2>Editar Deuda</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Cuota minima mensual (COP)</label>
              <input type="number" className="form-input" value={editForm.minimum_payment} onChange={e => setEditForm({ ...editForm, minimum_payment: e.target.value })} min="0" />
            </div>
            <div className="form-group">
              <label>Tasa interes mensual (%)</label>
              <input type="number" className="form-input" step="0.01" value={editForm.interest_rate} onChange={e => setEditForm({ ...editForm, interest_rate: e.target.value })} min="0" />
            </div>
            <button className="btn btn-primary w-full mt-2" onClick={handleSaveEdit}>Guardar cambios</button>
          </div>
        </div>
      )}
    </div>
  )
}
