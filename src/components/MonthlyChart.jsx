import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MONTHS, formatCOP } from '../lib/constants'
import { useTheme } from '../hooks/useTheme'

export default function MonthlyChart({ monthlyData }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const data = useMemo(() => {
    if (!monthlyData) return []
    return monthlyData.map(item => ({
      ...item,
      ingresos: Number(item.ingresos),
      gastos: Number(item.gastos),
      label: MONTHS[parseInt(item.month.split('-')[1]) - 1]?.slice(0, 3)
    }))
  }, [monthlyData])

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-title">Ingresos vs Gastos</div>
        <p className="text-muted text-sm">Agrega transacciones para ver la grafica</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-title">Ingresos vs Gastos</div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
          <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
          <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }}
            formatter={(value) => [formatCOP(value)]}
          />
          <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
