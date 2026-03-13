import { useMemo } from 'react'
import { TrendingUp, TrendingDown, ClipboardList, PiggyBank } from 'lucide-react'
import { formatCOP } from '../lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      color: 'text-green-500',
      iconBg: 'bg-green-500/15 text-green-500',
      icon: TrendingUp,
      trend: incomeTrend,
      trendInverted: false
    },
    {
      label: 'Gastos',
      value: formatCOP(stats.expenses),
      color: 'text-red-500',
      iconBg: 'bg-red-500/15 text-red-500',
      icon: TrendingDown,
      trend: expenseTrend,
      trendInverted: true
    },
    {
      label: 'Presupuesto del mes',
      value: formatCOP(totalBudget),
      color: totalBudget > 0 ? 'text-blue-500' : 'text-muted-foreground',
      iconBg: 'bg-blue-500/15 text-blue-500',
      icon: ClipboardList,
      trend: null,
      trendInverted: false
    },
    {
      label: 'Por asignar',
      value: formatCOP(porAsignar),
      color: porAsignar >= 0 ? 'text-green-500' : 'text-red-500',
      iconBg: 'bg-indigo-500/15 text-indigo-500',
      icon: PiggyBank,
      trend: null,
      trendInverted: false
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => {
        const Icon = card.icon
        const trendUp = card.trendInverted ? card.trend <= 0 : card.trend >= 0
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`size-8 rounded-md flex items-center justify-center ${card.iconBg}`}>
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              {card.trend !== null && (
                <p className={`text-xs mt-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {trendUp ? '↗' : '↘'} {card.trend >= 0 ? '+' : ''}{card.trend.toFixed(0)}% vs mes anterior
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
