import { useState, useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'
import { formatCOP } from '../lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  valor: { label: 'Valor total', color: '#22c55e' },
  intereses: { label: 'Intereses', color: '#6366f1' }
}

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

    return { data, finalValue: Math.round(total), totalInterest: Math.round(totalInterest) }
  }, [params])

  const references = [
    { name: 'CDT (90 dias)', rate: '0.8% - 1.1% mensual' },
    { name: 'Fondos de inversion', rate: '0.6% - 1.5% mensual' },
    { name: 'Cuenta de ahorros', rate: '0.2% - 0.5% mensual' }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Calculadora de Inversion</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Parametros</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Capital inicial (COP)</Label>
              <Input type="number" value={params.capital} onChange={e => setParams({ ...params, capital: Number(e.target.value) })} min="0" />
            </div>
            <div className="space-y-2">
              <Label>Tasa de interes mensual (%)</Label>
              <Input type="number" step="0.01" value={params.rate} onChange={e => setParams({ ...params, rate: Number(e.target.value) })} min="0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Periodo</Label>
                <Input type="number" value={params.period} onChange={e => setParams({ ...params, period: Number(e.target.value) })} min="1" />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select value={params.periodType} onValueChange={v => setParams({ ...params, periodType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meses">Meses</SelectItem>
                    <SelectItem value="años">Años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de interes</Label>
              <Select value={params.type} onValueChange={v => setParams({ ...params, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compuesto">Compuesto</SelectItem>
                  <SelectItem value="simple">Simple</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-5">
              <div className="text-sm text-muted-foreground">Valor final</div>
              <div className="text-3xl font-bold text-green-500">{formatCOP(result.finalValue)}</div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Capital inicial</div>
                <div className="font-semibold">{formatCOP(params.capital)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Intereses ganados</div>
                <div className="font-semibold text-green-500">{formatCOP(result.totalInterest)}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Tasas tipicas en Colombia</div>
              {references.map(r => (
                <div key={r.name} className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">{r.name}</span>
                  <span>{r.rate}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Crecimiento proyectado</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={result.data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} label={{ value: 'Meses', position: 'insideBottom', offset: -5 }} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
              <ChartTooltip content={<ChartTooltipContent formatter={v => formatCOP(v)} />} />
              <Area type="monotone" dataKey="valor" stroke="var(--color-valor)" fill="var(--color-valor)" fillOpacity={0.1} strokeWidth={2} name="Valor total" />
              <Area type="monotone" dataKey="intereses" stroke="var(--color-intereses)" fill="var(--color-intereses)" fillOpacity={0.1} strokeWidth={2} name="Intereses" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
