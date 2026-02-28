import { useState, useMemo } from 'react'
import { Trash2, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCOP } from '../lib/constants'
import EditTransactionModal from './EditTransactionModal'
import ConfirmDialog from './ConfirmDialog'

const PAGE_SIZE = 10

export default function TransactionTable({ transactions, onDelete, onUpdate, loading }) {
  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    let result = transactions
    if (filter !== 'todas') {
      result = result.filter(t => t.type === (filter === 'ingresos' ? 'ingreso' : 'gasto'))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      )
    }
    return result
  }, [transactions, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleFilterChange = (f) => {
    setFilter(f)
    setPage(1)
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

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
              onChange={handleSearchChange}
              style={{ paddingLeft: 32, width: 180, marginBottom: 0 }}
            />
          </div>
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
            {['todas', 'ingresos', 'gastos'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => handleFilterChange(f)}
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
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted" style={{ padding: 24 }}>
                      {search ? 'Sin resultados para la busqueda' : 'No hay transacciones'}
                    </td>
                  </tr>
                ) : (
                  paginated.map(t => (
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

          {filtered.length > PAGE_SIZE && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-muted">
                {filtered.length} transacciones — Pagina {safePage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
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
