import { useState } from 'react'
import { Trash2, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCOP } from '../lib/constants'
import EditTransactionModal from './EditTransactionModal'
import ConfirmDialog from './ConfirmDialog'

export default function TransactionTable({
  transactions, totalCount, page, setPage, pageSize,
  filter, setFilter, search, setSearch,
  onDelete, onUpdate, loading
}) {
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handleDelete = (id) => {
    onDelete(id)
    setConfirmDelete(null)
  }

  return (
    <div className="card mt-4">
      <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Transacciones</div>
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: 180, marginBottom: 0 }}
            />
          </div>
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
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
                  <th>Descripcion</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted" style={{ padding: 24 }}>
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
                      <td>{t.category}</td>
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
