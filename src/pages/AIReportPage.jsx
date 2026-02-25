import { useState } from 'react'
import { Bot, Loader } from 'lucide-react'
import { generateMonthlyReport } from '../api/anthropic'
import { MONTHS } from '../lib/constants'
import toast from 'react-hot-toast'

export default function AIReportPage({ transactions, budgets, goals, debts }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setReport('')

    const monthTx = transactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() + 1 === month && d.getFullYear() === year
    })

    if (monthTx.length === 0) {
      toast.error(`No hay transacciones en ${MONTHS[month - 1]} ${year}`)
      setLoading(false)
      return
    }

    try {
      const data = await generateMonthlyReport({
        transactions: monthTx,
        budgets,
        goals,
        debts,
        month,
        year
      })
      setReport(data.report)
    } catch (err) {
      toast.error('Error al generar reporte: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 className="mb-4">Reporte Mensual con IA</h2>

      <div className="card mb-4">
        <div className="flex gap-3 items-end" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Mes</label>
            <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Año</label>
            <input type="number" className="form-input" value={year} onChange={e => setYear(Number(e.target.value))} min="2020" max="2030" />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generando...</> : <><Bot size={16} /> Generar Reporte</>}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card text-center" style={{ padding: 40 }}>
          <div className="spinner" />
          <p className="text-muted mt-2">La IA esta analizando tus finanzas...</p>
        </div>
      )}

      {report && (
        <div className="card">
          <div className="card-title">Reporte de {MONTHS[month - 1]} {year}</div>
          <div className="report-content">{report}</div>
        </div>
      )}

      {!loading && !report && (
        <div className="card text-center" style={{ padding: 40 }}>
          <Bot size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-muted">Selecciona un mes y genera tu reporte personalizado.</p>
          <p className="text-muted text-xs mt-2">La IA analizara tus transacciones, presupuestos, metas y deudas.</p>
        </div>
      )}
    </div>
  )
}
