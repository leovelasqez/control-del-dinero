import { useMemo } from 'react'
import { TrendingUp, TrendingDown, ClipboardList, PiggyBank } from 'lucide-react'
import { formatCOP } from '../lib/constants'

export default function KPICards({ summary, budgets = [] }) {
  const stats = useMemo(() => {
    if (!summary) return { income: 0, expenses: 0, prevIncome: 0, prevExpenses: 0 }
    const cm = summary.current_month
    const pm = summary.previous_month
    const income = Number(cm.income)
    const expenses = Number(cm.expenses)
    const prevIncome = Number(pm.income)
    const prevExpenses = Number(pm.expenses)
    return { income, expenses, prevIncome, prevExpenses }
  }, [summary])

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  }, [budgets])

  const porAsignar = stats.income - totalBudget

  const trend = (current, previous) => {
    if (previous === 0) return null
    return ((current - previous) / Math.abs(previous)) * 100
  }

  const incomeTrend = trend(stats.income, stats.prevIncome)
  const expenseTrend = trend(stats.expenses, stats.prevExpenses)

  const cards = [
    {
      label: 'Ingresos',
      value: formatCOP(stats.income),
      valueClass: 'green',
      icon: TrendingUp,
      iconClass: 'kpi-icon-income',
      trend: incomeTrend,
      trendInverted: false
    },
    {
      label: 'Gastos',
      value: formatCOP(stats.expenses),
      valueClass: 'red',
      icon: TrendingDown,
      iconClass: 'kpi-icon-expense',
      trend: expenseTrend,
      trendInverted: true
    },
    {
      label: 'Presupuesto del mes',
      value: formatCOP(totalBudget),
      valueClass: totalBudget > 0 ? 'blue' : 'gray',
      icon: ClipboardList,
      iconClass: 'kpi-icon-budget',
      trend: null,
      trendInverted: false
    },
    {
      label: 'Por asignar',
      value: formatCOP(porAsignar),
      valueClass: porAsignar >= 0 ? 'green' : 'red',
      icon: PiggyBank,
      iconClass: 'kpi-icon-available',
      trend: null,
      trendInverted: false
    }
  ]

  return (
    <div className="kpi-grid">
      {cards.map(card => {
        const Icon = card.icon
        const trendUp = card.trendInverted ? card.trend <= 0 : card.trend >= 0
        return (
          <div key={card.label} className="kpi-card">
            <div className="kpi-card-header">
              <div className="label">{card.label}</div>
              <div className={`kpi-icon-wrap ${card.iconClass}`}>
                <Icon size={16} />
              </div>
            </div>
            <div className={`value ${card.valueClass}`}>{card.value}</div>
            {card.trend !== null && (
              <div className={`kpi-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
                {trendUp ? '↗' : '↘'} {card.trend >= 0 ? '+' : ''}{card.trend.toFixed(0)}% vs mes anterior
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
