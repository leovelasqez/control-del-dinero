import { useState } from 'react'
import { Bot, Loader } from 'lucide-react'
import { generateMonthlyReport } from '../api/anthropic'
import { MONTHS } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function AIReportPage({ budgets, goals, debts }) {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setReport('')

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`

    const { data: monthTx, error } = await supabase
      .from('transactions')
      .select('date, type, category, description, amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: false })

    if (error) {
      toast.error('Error al cargar transacciones del mes')
      setLoading(false)
      return
    }

    if (monthTx.length === 0) {
      toast.error(`No hay transacciones en ${MONTHS[month - 1]} ${year}`)
      setLoading(false)
      return
    }

    const txSummary = {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: monthTx.length,
      incomeByCategory: {},
      expenseByCategory: {},
      topExpenses: []
    }

    monthTx.forEach(t => {
      const amount = Number(t.amount)
      if (t.type === 'ingreso') {
        txSummary.totalIncome += amount
        txSummary.incomeByCategory[t.category] = (txSummary.incomeByCategory[t.category] || 0) + amount
      } else {
        txSummary.totalExpenses += amount
        txSummary.expenseByCategory[t.category] = (txSummary.expenseByCategory[t.category] || 0) + amount
      }
    })

    txSummary.balance = txSummary.totalIncome - txSummary.totalExpenses

    txSummary.topExpenses = monthTx
      .filter(t => t.type === 'gasto')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map(t => ({ date: t.date, category: t.category, description: t.description, amount: Number(t.amount) }))

    const budgetSummary = budgets.map(b => ({
      category: b.category,
      subcategory: b.subcategory || null,
      monthly_limit: Number(b.amount),
      spent: txSummary.expenseByCategory[b.subcategory || b.category] || 0
    }))

    const goalSummary = goals.map(g => ({
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
      deadline: g.deadline
    }))

    const debtSummary = debts.map(d => ({
      name: d.name,
      balance: Number(d.current_balance),
      minimum_payment: Number(d.minimum_payment),
      interest_rate: Number(d.interest_rate)
    }))

    try {
      const data = await generateMonthlyReport({
        transactionSummary: txSummary,
        budgets: budgetSummary,
        goals: goalSummary,
        debts: debtSummary,
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
            <label>Ano</label>
            <input type="number" className="form-input" value={year} onChange={e => setYear(Number(e.target.value))} min="2020" max="2030" />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generando...</> : <><Bot size={14} /> Generar Reporte</>}
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
          <div className="report-content" dangerouslySetInnerHTML={{ __html: report
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/^# (.+)$/gm, '<h2>$1</h2>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/<\/ul>\s*<ul>/g, '')
            .replace(/\n{2,}/g, '<br/><br/>')
            .replace(/\n/g, '<br/>')
          }} />
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
