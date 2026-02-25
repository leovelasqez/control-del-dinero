import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { formatCOP } from '../lib/constants'
import EditTransactionModal from './EditTransactionModal'

export default function TransactionTable({ transactions, onDelete, onUpdate }) {
  const [filter, setFilter] = useState('todas')
  const [editing, setEditing] = useState(null)

  const filtered = filter === 'todas'
    ? transactions
    : transactions.filter(t => t.type === (filter === 'ingresos' ? 'ingreso' : 'gasto'))

  return (
    <div className="card mt-4">
      <div className="flex justify-between items-center mb-4">
        <div className="card-title" style={{ marginBottom: 0 }}>Transacciones</div>
        <div className="filter-tabs">
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted" style={{ padding: 24 }}>
                  No hay transacciones
                </td>
              </tr>
            ) : (
              filtered.map(t => (
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
                        onClick={() => onDelete(t.id)}
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

      {editing && (
        <EditTransactionModal
          transaction={editing}
          onClose={() => setEditing(null)}
          onSave={onUpdate}
        />
      )}
    </div>
  )
}
