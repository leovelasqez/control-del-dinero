import { useMemo } from 'react'
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react'
import { formatCOP } from '../lib/constants'

export default function KPICards({ transactions, debts }) {
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    let income = 0, expenses = 0, prevIncome = 0, prevExpenses = 0

    transactions.forEach(t => {
      const d = new Date(t.date)
      const m = d.getMonth()
      const y = d.getFullYear()
      const amount = Number(t.amount)

      if (m === currentMonth && y === currentYear) {
        if (t.type === 'ingreso') income += amount
        else expenses += amount
      } else if (m === lastMonth && y === lastMonthYear) {
        if (t.type === 'ingreso') prevIncome += amount
        else prevExpenses += amount
      }
    })

    const totalDebt = debts.reduce((sum, d) => sum + Number(d.current_balance), 0)
    const balance = income - expenses
    const prevBalance = prevIncome - prevExpenses

    return { income, expenses, balance, totalDebt, prevIncome, prevExpenses, prevBalance }
  }, [transactions, debts])

  const trend = (current, previous) => {
    if (previous === 0) return null
    const pct = ((current - previous) / Math.abs(previous)) * 100
    return pct
  }

  const balanceTrend = trend(stats.balance, stats.prevBalance)
  const incomeTrend = trend(stats.income, stats.prevIncome)
  const expenseTrend = trend(stats.expenses, stats.prevExpenses)

  return (
    <div className="kpi-grid">
      <div className={`kpi-card kpi-pulse-${stats.balance >= 0 ? 'green' : 'red'}`}>
        <div className="kpi-icon-wrap kpi-icon-balance">
          <Wallet size={16} />
        </div>
        <div className="kpi-content">
          <div className="label">Balance del mes</div>
          <div className={`value ${stats.balance >= 0 ? 'green' : 'red'}`}>
            {formatCOP(stats.balance)}
          </div>
          {balanceTrend !== null && (
            <div className={`kpi-trend ${balanceTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
              {balanceTrend >= 0 ? '+' : ''}{balanceTrend.toFixed(0)}% vs mes anterior
            </div>
          )}
        </div>
      </div>
      <div className="kpi-card kpi-pulse-green">
        <div className="kpi-icon-wrap kpi-icon-income">
          <TrendingUp size={16} />
        </div>
        <div className="kpi-content">
          <div className="label">Ingresos</div>
          <div className="value green">{formatCOP(stats.income)}</div>
          {incomeTrend !== null && (
            <div className={`kpi-trend ${incomeTrend >= 0 ? 'trend-up' : 'trend-down'}`}>
              {incomeTrend >= 0 ? '+' : ''}{incomeTrend.toFixed(0)}%
            </div>
          )}
        </div>
      </div>
      <div className="kpi-card kpi-pulse-red">
        <div className="kpi-icon-wrap kpi-icon-expense">
          <TrendingDown size={16} />
        </div>
        <div className="kpi-content">
          <div className="label">Gastos</div>
          <div className="value red">{formatCOP(stats.expenses)}</div>
          {expenseTrend !== null && (
            <div className={`kpi-trend ${expenseTrend <= 0 ? 'trend-up' : 'trend-down'}`}>
              {expenseTrend >= 0 ? '+' : ''}{expenseTrend.toFixed(0)}%
            </div>
          )}
        </div>
      </div>
      <div className="kpi-card kpi-pulse-red">
        <div className="kpi-icon-wrap kpi-icon-debt">
          <CreditCard size={16} />
        </div>
        <div className="kpi-content">
          <div className="label">Deudas</div>
          <div className="value red">{formatCOP(stats.totalDebt)}</div>
        </div>
      </div>
    </div>
  )
}
