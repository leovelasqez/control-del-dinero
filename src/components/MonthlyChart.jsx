import { useState, useEffect, useMemo, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { MONTHS, formatCOP } from '../lib/constants'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../lib/supabase'

const PERIODS = [
  { key: '1M', label: '1M', subtitle: 'Ultimo mes' },
  { key: '3M', label: '3M', subtitle: 'Ultimos 3 meses' },
  { key: '6M', label: '6M', subtitle: 'Ultimos 6 meses' },
  { key: '1A', label: '1A', subtitle: 'Ultimo año' }
]

function getDateRange(periodKey) {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1) // primer dia del proximo mes
  let start

  switch (periodKey) {
    case '1M':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case '3M':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      break
    case '6M':
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      break
    case '1A':
      start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  }

  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { startDate: fmt(start), endDate: fmt(end) }
}

function aggregateByDay(transactions) {
  const groups = {}
  transactions.forEach(t => {
    const day = t.date
    if (!groups[day]) groups[day] = { ingresos: 0, gastos: 0 }
    if (t.type === 'ingreso') groups[day].ingresos += Number(t.amount)
    else groups[day].gastos += Number(t.amount)
  })

  return Object.keys(groups).sort().map(day => {
    const d = new Date(day + 'T12:00:00')
    return {
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      ingresos: groups[day].ingresos,
      gastos: groups[day].gastos
    }
  })
}

function aggregateByMonth(transactions) {
  const groups = {}
  transactions.forEach(t => {
    const month = t.date.slice(0, 7) // "YYYY-MM"
    if (!groups[month]) groups[month] = { ingresos: 0, gastos: 0 }
    if (t.type === 'ingreso') groups[month].ingresos += Number(t.amount)
    else groups[month].gastos += Number(t.amount)
  })

  return Object.keys(groups).sort().map(month => {
    const monthIdx = parseInt(month.split('-')[1]) - 1
    return {
      label: MONTHS[monthIdx]?.slice(0, 3),
      ingresos: groups[month].ingresos,
      gastos: groups[month].gastos
    }
  })
}

export default function MonthlyChart() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [period, setPeriod] = useState('1M')
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { startDate, endDate } = getDateRange(period)

    const { data, error } = await supabase
      .from('transactions')
      .select('date, type, amount')
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching chart data:', error)
      setRawData([])
    } else {
      setRawData(data || [])
    }
    setLoading(false)
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const data = useMemo(() => {
    if (rawData.length === 0) return []
    return period === '1M' ? aggregateByDay(rawData) : aggregateByMonth(rawData)
  }, [rawData, period])

  const activePeriod = PERIODS.find(p => p.key === period)

  return (
    <div className="card">
      <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
        <div>
          <div className="card-title" style={{ marginBottom: 0 }}>Ingresos vs Gastos</div>
          <div className="card-subtitle">{activePeriod?.subtitle}</div>
        </div>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`filter-tab ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-muted text-sm" style={{ padding: '40px 0', textAlign: 'center' }}>
          Sin datos para este periodo
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }}
              formatter={(value) => [formatCOP(value)]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradIncome)"
              dot={{ r: 3, fill: '#22c55e' }}
              name="Ingresos"
            />
            <Area
              type="monotone"
              dataKey="gastos"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradExpense)"
              dot={{ r: 3, fill: '#ef4444' }}
              name="Gastos"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
