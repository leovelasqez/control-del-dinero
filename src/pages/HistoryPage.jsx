import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import { MONTHS, EXPENSE_CATEGORIES, CATEGORY_COLORS, formatCOP } from '../lib/constants'
import { useTheme } from '../hooks/useTheme'

export default function HistoryPage({ monthlyData, categoryData }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [view, setView] = useState('income-vs-expense')

  const chartData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return []

    // Build category lookup: { 'YYYY-MM': { Comida: 500, ... } }
    const catByMonth = {}
    if (categoryData) {
      categoryData.forEach(r => {
        if (!catByMonth[r.month]) catByMonth[r.month] = {}
        catByMonth[r.month][r.category] = Number(r.total)
      })
    }

    return monthlyData.map(item => {
      const ingresos = Number(item.ingresos)
      const gastos = Number(item.gastos)
      const ahorro = ingresos - gastos
      return {
        month: item.month,
        ingresos,
        gastos,
        ahorro,
        label: MONTHS[parseInt(item.month.split('-')[1]) - 1]?.slice(0, 3) + ' ' + item.month.split('-')[0].slice(2),
        pctAhorro: ingresos > 0 ? ((ahorro / ingresos) * 100).toFixed(1) : 0,
        ...(catByMonth[item.month] || {})
      }
    })
  }, [monthlyData, categoryData])

  if (!monthlyData || monthlyData.length === 0) {
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
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }} formatter={v => formatCOP(v)} />
              <Legend />
              <Bar dataKey="ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : view === 'savings' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: 8 }} formatter={v => formatCOP(v)} />
              <Bar dataKey="ahorro" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.ahorro >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={chartData}>
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
              {chartData.map(m => (
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
