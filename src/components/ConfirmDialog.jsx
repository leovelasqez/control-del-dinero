import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
        <AlertTriangle size={36} style={{ color: 'var(--yellow)', margin: '0 auto 12px' }} />
        <p style={{ marginBottom: 20, fontSize: '0.95rem' }}>{message}</p>
        <div className="flex gap-2" style={{ justifyContent: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} style={{ flex: 1, justifyContent: 'center' }}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}
