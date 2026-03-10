import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, X, ChevronLeft, ChevronRight, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { MONTHS, formatCOP } from '../lib/constants'
import ConfirmDialog from '../components/ConfirmDialog'

function MonthNav({ selectedMonth, setSelectedMonth }) {
  const [y, m] = selectedMonth.split('-').map(Number)
  const label = `${MONTHS[m - 1]} ${y}`

  const prev = () => {
    const pm = m === 1 ? 12 : m - 1
    const py = m === 1 ? y - 1 : y
    setSelectedMonth(`${py}-${String(pm).padStart(2, '0')}`)
  }
  const next = () => {
    const nm = m === 12 ? 1 : m + 1
    const ny = m === 12 ? y + 1 : y
    setSelectedMonth(`${ny}-${String(nm).padStart(2, '0')}`)
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn btn-ghost btn-sm" onClick={prev}><ChevronLeft size={16} /></button>
      <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{label}</span>
      <button className="btn btn-ghost btn-sm" onClick={next}><ChevronRight size={16} /></button>
    </div>
  )
}

export default function BudgetsPage({
  groupedBudgets, spentByCategory, loading,
  selectedMonth, setSelectedMonth,
  onAddItem, onUpdateItem, onDeleteItem, onDeleteCategory,
  onDuplicateMonth, getAvailableMonths
}) {
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newSubcategory, setNewSubcategory] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const [addingSubTo, setAddingSubTo] = useState(null)
  const [subName, setSubName] = useState('')
  const [subAmount, setSubAmount] = useState('')

  const [editing, setEditing] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editSubcategory, setEditSubcategory] = useState('')

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null)

  const [showDuplicate, setShowDuplicate] = useState(false)
  const [dupTarget, setDupTarget] = useState('')
  const [availableMonths, setAvailableMonths] = useState([])

  const [collapsedCats, setCollapsedCats] = useState({})

  useEffect(() => {
    if (showDuplicate && getAvailableMonths) {
      getAvailableMonths().then(setAvailableMonths)
    }
  }, [showDuplicate, getAvailableMonths])

  const toggleCollapse = (cat) => {
    setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const handleAddCategory = (e) => {
    e.preventDefault()
    if (!newCategory.trim() || !newAmount || Number(newAmount) <= 0) return
    onAddItem(newCategory.trim(), newSubcategory.trim() || null, Number(newAmount))
    setNewCategory('')
    setNewSubcategory('')
    setNewAmount('')
    setShowAddCategory(false)
  }

  const handleAddSub = (category) => {
    if (!subName.trim() || !subAmount || Number(subAmount) <= 0) return
    onAddItem(category, subName.trim(), Number(subAmount))
    setSubName('')
    setSubAmount('')
    setAddingSubTo(null)
  }

  const handleSaveEdit = () => {
    if (!editAmount || Number(editAmount) <= 0) return
    const updates = { amount: Number(editAmount) }
    if (editSubcategory !== (editing.subcategory || '')) {
      updates.subcategory = editSubcategory.trim() || null
    }
    onUpdateItem(editing.id, updates)
    setEditing(null)
  }

  const handleDuplicate = () => {
    if (!dupTarget) return
    onDuplicateMonth(selectedMonth, dupTarget)
    setShowDuplicate(false)
    setDupTarget('')
  }

  const getColor = (pct) => {
    if (pct > 90) return '#ef4444'
    if (pct > 70) return '#eab308'
    return '#22c55e'
  }

  const categories = Object.keys(groupedBudgets)
  const totalBudget = Object.values(groupedBudgets).flat().reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0)

  // Generate target month options for duplicate
  const [cy, cm] = selectedMonth.split('-').map(Number)
  const dupOptions = []
  for (let i = 1; i <= 6; i++) {
    const nm = ((cm - 1 + i) % 12) + 1
    const ny = cy + Math.floor((cm - 1 + i) / 12)
    const val = `${ny}-${String(nm).padStart(2, '0')}`
    dupOptions.push({ value: val, label: `${MONTHS[nm - 1]} ${ny}` })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <MonthNav selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowDuplicate(true)}>
            <Copy size={14} /> Duplicar mes
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddCategory(true)}>
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      {/* Summary */}
      {categories.length > 0 && (
        <div className="card mb-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-muted">Presupuesto total: </span>
              <span style={{ fontWeight: 700 }}>{formatCOP(totalBudget)}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Gastado: </span>
              <span style={{ fontWeight: 700, color: totalSpent > totalBudget ? 'var(--red)' : 'var(--green)' }}>
                {formatCOP(totalSpent)}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
      )}

      {!loading && categories.length === 0 && !showAddCategory && (
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="text-muted">No tienes presupuesto para este mes.</p>
          <p className="text-muted text-sm mt-2">Crea categorias y subcategorias para planificar tus gastos.</p>
          <div className="flex gap-2 mt-4" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddCategory(true)}>
              <Plus size={14} /> Crear presupuesto
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDuplicate(true)}>
              <Copy size={14} /> Duplicar de otro mes
            </button>
          </div>
        </div>
      )}

      {/* Add category form */}
      {showAddCategory && (
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Agregar item al presupuesto</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCategory(false)}><X size={16} /></button>
          </div>
          <form onSubmit={handleAddCategory}>
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
                <label>Categoria</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Gastos Fijos"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
                <label>Subcategoria (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Arriendo"
                  value={newSubcategory}
                  onChange={e => setNewSubcategory(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}>
                <label>Monto (COP)</label>
                <input type="number" className="form-input" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0" min="1" required />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary btn-sm">Guardar</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddCategory(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Category groups */}
      {categories.map(cat => {
        const items = groupedBudgets[cat]
        const catTotal = items.reduce((s, b) => s + Number(b.amount), 0)
        const catSpent = items.reduce((s, b) => {
          const key = b.subcategory || b.category
          return s + (spentByCategory[key] || 0)
        }, 0)
        const catPct = catTotal > 0 ? (catSpent / catTotal) * 100 : 0
        const isCollapsed = collapsedCats[cat]

        return (
          <div key={cat} className="card mb-4">
            {/* Category header */}
            <div className="flex justify-between items-center" style={{ marginBottom: isCollapsed ? 0 : 12 }}>
              <div className="flex items-center gap-3" style={{ cursor: 'pointer' }} onClick={() => toggleCollapse(cat)}>
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cat}</div>
                  <div className="text-xs text-muted">
                    {formatCOP(catSpent)} de {formatCOP(catTotal)} — {catPct.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => { setAddingSubTo(cat); setSubName(''); setSubAmount('') }} title="Agregar subcategoria">
                  <Plus size={14} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteCat(cat)} title="Eliminar categoria">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Category progress bar */}
            {!isCollapsed && (
              <>
                <div className="progress-bar" style={{ marginBottom: 12 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(catPct, 100)}%`, background: getColor(catPct) }} />
                </div>

                {/* Add subcategory inline form */}
                {addingSubTo === cat && (
                  <div style={{ padding: '8px 0 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                    <div className="flex gap-2 items-end" style={{ flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}>
                        <label>Subcategoria</label>
                        <input type="text" className="form-input" placeholder="Ej: Arriendo" value={subName} onChange={e => setSubName(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ flex: 1, minWidth: 100, marginBottom: 0 }}>
                        <label>Monto</label>
                        <input type="number" className="form-input" placeholder="0" min="1" value={subAmount} onChange={e => setSubAmount(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddSub(cat)}>Agregar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAddingSubTo(null)}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subcategory items */}
                {items.map(item => {
                  const key = item.subcategory || item.category
                  const spent = spentByCategory[key] || 0
                  const pct = Number(item.amount) > 0 ? (spent / Number(item.amount)) * 100 : 0
                  const remaining = Number(item.amount) - spent

                  return (
                    <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                        <div>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.subcategory || '(Sin subcategoria)'}</span>
                          <span className="text-xs text-muted" style={{ marginLeft: 8 }}>
                            {formatCOP(spent)} / {formatCOP(item.amount)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(item); setEditAmount(String(item.amount)); setEditSubcategory(item.subcategory || '') }}>
                            <Pencil size={12} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(item)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: getColor(pct) }} />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs" style={{ color: getColor(pct) }}>{pct.toFixed(0)}%</span>
                        <span className={`text-xs ${remaining >= 0 ? '' : 'text-red'}`} style={{ color: remaining >= 0 ? 'var(--text-muted)' : undefined }}>
                          {remaining >= 0 ? `${formatCOP(remaining)} restante` : `${formatCOP(Math.abs(remaining))} excedido`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )
      })}

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2>Editar Item</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <input type="text" className="form-input" value={editing.category} disabled />
            </div>
            <div className="form-group">
              <label>Subcategoria</label>
              <input type="text" className="form-input" value={editSubcategory} onChange={e => setEditSubcategory(e.target.value)} placeholder="(Opcional)" />
            </div>
            <div className="form-group">
              <label>Monto (COP)</label>
              <input type="number" className="form-input" value={editAmount} onChange={e => setEditAmount(e.target.value)} min="1" />
            </div>
            <button className="btn btn-primary w-full mt-2" onClick={handleSaveEdit}>Guardar cambios</button>
          </div>
        </div>
      )}

      {/* Duplicate modal */}
      {showDuplicate && (
        <div className="modal-overlay" onClick={() => setShowDuplicate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2>Duplicar Presupuesto</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDuplicate(false)}><X size={18} /></button>
            </div>
            <p className="text-sm text-muted mb-4">
              Copia el presupuesto del mes actual a otro mes.
            </p>
            <div className="form-group">
              <label>Mes destino</label>
              <select className="form-input" value={dupTarget} onChange={e => setDupTarget(e.target.value)}>
                <option value="">Seleccionar mes...</option>
                {dupOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary w-full mt-2" onClick={handleDuplicate} disabled={!dupTarget}>
              Duplicar
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialogs */}
      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar "${confirmDelete.subcategory || confirmDelete.category}" del presupuesto?`}
          onConfirm={() => { onDeleteItem(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteCat && (
        <ConfirmDialog
          message={`¿Eliminar toda la categoria "${confirmDeleteCat}" y sus subcategorias?`}
          onConfirm={() => { onDeleteCategory(confirmDeleteCat); setConfirmDeleteCat(null) }}
          onCancel={() => setConfirmDeleteCat(null)}
        />
      )}
    </div>
  )
}
