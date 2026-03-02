import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS, formatCOP } from '../lib/constants'
import { useTheme } from '../hooks/useTheme'

export default function ExpensePieChart({ transactions }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const data = useMemo(() => {
    const byCategory = {}
    transactions
      .filter(t => t.type === 'gasto')
      .forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
      })
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-title">Gastos por Categoria</div>
        <p className="text-muted text-sm">Sin gastos registrados</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-title">Gastos por Categoria</div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }}
            formatter={(value) => [formatCOP(value)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
        {data.map(d => (
          <span key={d.name} className="text-xs flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[d.name] || '#6b7280', display: 'inline-block' }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  )
}
