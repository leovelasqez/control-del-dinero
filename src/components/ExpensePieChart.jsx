import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { CATEGORY_COLORS, formatCOP } from '../lib/constants'
import { useTheme } from '../hooks/useTheme'

function formatShort(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`
  return `$${amount}`
}

export default function ExpensePieChart({ categoryData }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data, total } = useMemo(() => {
    if (!categoryData) return { data: [], total: 0 }
    const items = categoryData.map(c => ({ name: c.name, value: Number(c.value) }))
    const sum = items.reduce((acc, c) => acc + c.value, 0)
    return { data: items, total: sum }
  }, [categoryData])

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-title">Gastos por Categoria</div>
        <div className="card-subtitle">Este mes</div>
        <p className="text-muted text-sm">Sin gastos registrados</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-title">Gastos por Categoria</div>
      <div className="card-subtitle">Este mes</div>
      <div className="pie-chart-layout">
        <div className="pie-chart-container">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                ))}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    const { cx, cy } = viewBox
                    return (
                      <g>
                        <text x={cx} y={cy - 6} textAnchor="middle" fill={isDark ? '#f1f5f9' : '#0f172a'} fontSize={16} fontWeight={700}>
                          {formatShort(total)}
                        </text>
                        <text x={cx} y={cy + 14} textAnchor="middle" fill={isDark ? '#64748b' : '#94a3b8'} fontSize={11}>
                          Total
                        </text>
                      </g>
                    )
                  }}
                />
              </Pie>
              <Tooltip
                contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }}
                formatter={(value) => [formatCOP(value)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="pie-chart-legend">
          {data.map(d => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
            return (
              <div key={d.name} className="legend-item">
                <span className="legend-dot" style={{ background: CATEGORY_COLORS[d.name] || '#6b7280' }} />
                <span className="legend-name">{d.name}</span>
                <span className="legend-value">{formatCOP(d.value)}</span>
                <span className="legend-pct">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
