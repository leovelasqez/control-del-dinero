import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts'
import { formatCOP } from '../lib/constants'

export default function InvestmentPage() {
  const [params, setParams] = useState({
    capital: 1000000,
    rate: 1,
    period: 12,
    periodType: 'meses',
    type: 'compuesto'
  })

  const result = useMemo(() => {
    const { capital, rate, period, periodType, type } = params
    const months = periodType === 'años' ? period * 12 : period
    const monthlyRate = rate / 100

    const data = []
    let total = capital
    let totalInterest = 0

    for (let i = 0; i <= months; i++) {
      data.push({
        mes: i,
        label: i % 12 === 0 ? `Año ${i / 12}` : `M${i}`,
        valor: Math.round(total),
        intereses: Math.round(totalInterest),
        capital: capital
      })
      if (type === 'compuesto') {
        const interest = total * monthlyRate
        totalInterest += interest
        total += interest
      } else {
        const interest = capital * monthlyRate
        totalInterest += interest
        total = capital + totalInterest
      }
    }

    return {
      data,
      finalValue: Math.round(total),
      totalInterest: Math.round(totalInterest)
    }
  }, [params])

  const references = [
    { name: 'CDT (90 dias)', rate: '0.8% - 1.1% mensual' },
    { name: 'Fondos de inversion', rate: '0.6% - 1.5% mensual' },
    { name: 'Cuenta de ahorros', rate: '0.2% - 0.5% mensual' }
  ]

  return (
    <div>
      <h2 className="mb-4">Calculadora de Inversion</h2>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-title">Parametros</div>
          <div className="form-group">
            <label>Capital inicial (COP)</label>
            <input type="number" className="form-input" value={params.capital}
              onChange={e => setParams({ ...params, capital: Number(e.target.value) })} min="0" />
          </div>
          <div className="form-group">
            <label>Tasa de interes mensual (%)</label>
            <input type="number" className="form-input" step="0.01" value={params.rate}
              onChange={e => setParams({ ...params, rate: Number(e.target.value) })} min="0" />
          </div>
          <div className="flex gap-3">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Periodo</label>
              <input type="number" className="form-input" value={params.period}
                onChange={e => setParams({ ...params, period: Number(e.target.value) })} min="1" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Unidad</label>
              <select className="form-input" value={params.periodType}
                onChange={e => setParams({ ...params, periodType: e.target.value })}>
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Tipo de interes</label>
            <select className="form-input" value={params.type}
              onChange={e => setParams({ ...params, type: e.target.value })}>
              <option value="compuesto">Compuesto</option>
              <option value="simple">Simple</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Resultado</div>
          <div style={{ marginBottom: 20 }}>
            <div className="text-muted text-sm">Valor final</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#22c55e' }}>
              {formatCOP(result.finalValue)}
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <div className="text-muted text-xs">Capital inicial</div>
              <div style={{ fontWeight: 600 }}>{formatCOP(params.capital)}</div>
            </div>
            <div>
              <div className="text-muted text-xs">Intereses ganados</div>
              <div style={{ fontWeight: 600, color: '#22c55e' }}>{formatCOP(result.totalInterest)}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="card-title" style={{ fontSize: '0.85rem' }}>Tasas tipicas en Colombia</div>
            {references.map(r => (
              <div key={r.name} className="flex justify-between text-sm" style={{ padding: '4px 0' }}>
                <span className="text-muted">{r.name}</span>
                <span>{r.rate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Crecimiento proyectado</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={result.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} label={{ value: 'Meses', position: 'insideBottom', offset: -5 }} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={v => formatCOP(v)} />
            <Area type="monotone" dataKey="valor" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} name="Valor total" />
            <Area type="monotone" dataKey="intereses" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} name="Intereses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
