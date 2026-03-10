import { useState, useMemo } from 'react'
import { Trash2, Pencil, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { formatCOP, CATEGORY_EMOJIS } from '../lib/constants'
import EditTransactionModal from './EditTransactionModal'
import ConfirmDialog from './ConfirmDialog'

export default function TransactionTable({
  transactions, totalCount, page, setPage, pageSize,
  filter, setFilter, search, setSearch,
  onDelete, onUpdate, loading, summary
}) {
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const { totalIncome, totalExpenses } = useMemo(() => {
    if (!summary?.current_month) return { totalIncome: 0, totalExpenses: 0 }
    return {
      totalIncome: Number(summary.current_month.income),
      totalExpenses: Number(summary.current_month.expenses)
    }
  }, [summary])

  const handleDelete = (id) => {
    onDelete(id)
    setConfirmDelete(null)
  }

  return (
    <div className="card mt-4">
      <div className="tx-header">
        <div className="tx-header-left">
          <div className="card-title" style={{ marginBottom: 0 }}>Transacciones</div>
          <div className="tx-summary">
            <span className="tx-summary-income">+{formatCOP(totalIncome)}</span>
            <span className="tx-summary-expense">-{formatCOP(totalExpenses)}</span>
          </div>
        </div>
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar transacciones..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: 220, marginBottom: 0 }}
            />
          </div>
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
            <Filter size={13} style={{ color: 'var(--text-muted)', marginRight: 4, flexShrink: 0, alignSelf: 'center' }} />
            {['todas', 'ingresos', 'gastos'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Cuenta</th>
                  <th>Descripcion</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted" style={{ padding: 24 }}>
                      {search ? 'Sin resultados para la busqueda' : 'No hay transacciones'}
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString('es-CO')}</td>
                      <td>
                        <span className={`badge ${t.type === 'ingreso' ? 'badge-green' : 'badge-red'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td>
                        <span className="tx-category-emoji">{CATEGORY_EMOJIS[t.category] || '📦'}</span>
                        {t.category}
                      </td>
                      <td>{t.account || 'Efectivo'}</td>
                      <td>{t.description}</td>
                      <td className={t.type === 'ingreso' ? 'text-green' : 'text-red'}>
                        {t.type === 'ingreso' ? '+' : '-'}{formatCOP(t.amount)}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditing(t)}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setConfirmDelete(t)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalCount > pageSize && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-muted">
                {totalCount} transacciones — Pagina {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <EditTransactionModal
          transaction={editing}
          onClose={() => setEditing(null)}
          onSave={onUpdate}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar esta transaccion de ${formatCOP(confirmDelete.amount)}?`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
