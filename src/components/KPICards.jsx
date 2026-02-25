import { useMemo } from 'react'
import { formatCOP } from '../lib/constants'

export default function KPICards({ transactions, debts }) {
  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.current_balance), 0)
    return { income, expenses, balance: income - expenses, totalDebt }
  }, [transactions, debts])

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="label">Balance total</div>
        <div className={`value ${stats.balance >= 0 ? 'green' : 'red'}`}>
          {formatCOP(stats.balance)}
        </div>
      </div>
      <div className="kpi-card">
        <div className="label">Ingresos totales</div>
        <div className="value green">{formatCOP(stats.income)}</div>
      </div>
      <div className="kpi-card">
        <div className="label">Gastos totales</div>
        <div className="value red">{formatCOP(stats.expenses)}</div>
      </div>
      <div className="kpi-card">
        <div className="label">Total deudas</div>
        <div className="value red">{formatCOP(stats.totalDebt)}</div>
      </div>
    </div>
  )
}
