import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import { MONTHS, EXPENSE_CATEGORIES, CATEGORY_COLORS, formatCOP } from '../lib/constants'
import { useTheme } from '../hooks/useTheme'

export default function HistoryPage({ transactions }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [view, setView] = useState('income-vs-expense')

  const monthlyData = useMemo(() => {
    const byMonth = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!byMonth[key]) {
        byMonth[key] = { month: key, ingresos: 0, gastos: 0, categories: {} }
      }
      if (t.type === 'ingreso') byMonth[key].ingresos += Number(t.amount)
      else {
        byMonth[key].gastos += Number(t.amount)
        byMonth[key].categories[t.category] = (byMonth[key].categories[t.category] || 0) + Number(t.amount)
      }
    })
    return Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        ...item,
        ...item.categories,
        ahorro: item.ingresos - item.gastos,
        label: MONTHS[parseInt(item.month.split('-')[1]) - 1]?.slice(0, 3) + ' ' + item.month.split('-')[0].slice(2),
        pctAhorro: item.ingresos > 0 ? ((item.ingresos - item.gastos) / item.ingresos * 100).toFixed(1) : 0
      }))
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="card text-center" style={{ padding: 40 }}>
        <p className="text-muted">Agrega transacciones para ver el historial.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Historial</h2>
        <div className="filter-tabs">
          {[
            { key: 'income-vs-expense', label: 'Ingresos vs Gastos' },
            { key: 'savings', label: 'Ahorro neto' },
            { key: 'categories', label: 'Categorias' }
          ].map(v => (
            <button key={v.key} className={`filter-tab ${view === v.key ? 'active' : ''}`} onClick={() => setView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-4">
        <ResponsiveContainer width="100%" height={300}>
          {view === 'income-vs-expense' ? (
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }} formatter={v => formatCOP(v)} />
              <Legend />
              <Bar dataKey="ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : view === 'savings' ? (
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }} formatter={v => formatCOP(v)} />
              <Bar dataKey="ahorro" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.ahorro >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }} formatter={v => formatCOP(v)} />
              <Legend />
              {EXPENSE_CATEGORIES.map(cat => (
                <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={CATEGORY_COLORS[cat] || '#6b7280'} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Tabla resumen */}
      <div className="card">
        <div className="card-title">Resumen por Mes</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Ahorro Neto</th>
                <th>% Ahorro</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(m => (
                <tr key={m.month}>
                  <td>{m.label}</td>
                  <td className="text-green">{formatCOP(m.ingresos)}</td>
                  <td className="text-red">{formatCOP(m.gastos)}</td>
                  <td className={m.ahorro >= 0 ? 'text-green' : 'text-red'}>{formatCOP(m.ahorro)}</td>
                  <td className={Number(m.pctAhorro) >= 0 ? 'text-green' : 'text-red'}>{m.pctAhorro}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
