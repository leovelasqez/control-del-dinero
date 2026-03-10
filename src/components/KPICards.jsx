import { useMemo } from 'react'
import { Wallet, TrendingUp, TrendingDown, Percent } from 'lucide-react'
import { formatCOP } from '../lib/constants'

export default function KPICards({ summary }) {
  const stats = useMemo(() => {
    if (!summary) return { income: 0, expenses: 0, balance: 0, savingsRate: 0, prevIncome: 0, prevExpenses: 0, prevBalance: 0, prevSavingsRate: 0 }
    const cm = summary.current_month
    const pm = summary.previous_month
    const income = Number(cm.income)
    const expenses = Number(cm.expenses)
    const prevIncome = Number(pm.income)
    const prevExpenses = Number(pm.expenses)
    const balance = income - expenses
    const prevBalance = prevIncome - prevExpenses
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
    const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpenses) / prevIncome) * 100 : 0
    return { income, expenses, balance, savingsRate, prevIncome, prevExpenses, prevBalance, prevSavingsRate }
  }, [summary])

  const trend = (current, previous) => {
    if (previous === 0) return null
    return ((current - previous) / Math.abs(previous)) * 100
  }

  const balanceTrend = trend(stats.balance, stats.prevBalance)
  const incomeTrend = trend(stats.income, stats.prevIncome)
  const expenseTrend = trend(stats.expenses, stats.prevExpenses)
  const savingsTrend = trend(stats.savingsRate, stats.prevSavingsRate)

  const cards = [
    {
      label: 'Balance del mes',
      value: formatCOP(stats.balance),
      valueClass: stats.balance >= 0 ? 'green' : 'red',
      icon: Wallet,
      iconClass: 'kpi-icon-balance',
      trend: balanceTrend,
      trendInverted: false
    },
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
      label: 'Tasa de ahorro',
      value: `${stats.savingsRate.toFixed(1)}%`,
      valueClass: stats.savingsRate >= 0 ? 'green' : 'red',
      icon: Percent,
      iconClass: 'kpi-icon-savings',
      trend: savingsTrend,
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
