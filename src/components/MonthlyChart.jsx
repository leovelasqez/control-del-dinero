import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MONTHS, formatCOP } from '../lib/constants'

export default function MonthlyChart({ transactions }) {
  const data = useMemo(() => {
    const byMonth = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!byMonth[key]) byMonth[key] = { month: key, ingresos: 0, gastos: 0 }
      if (t.type === 'ingreso') byMonth[key].ingresos += Number(t.amount)
      else byMonth[key].gastos += Number(t.amount)
    })
    return Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        ...item,
        label: MONTHS[parseInt(item.month.split('-')[1]) - 1]?.slice(0, 3)
      }))
  }, [transactions])

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
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            formatter={(value) => [formatCOP(value)]}
          />
          <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
