import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { MONTHS, formatCOP } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Loader2 } from 'lucide-react'

const PERIODS = [
  { key: '1M', label: '1M', subtitle: 'Ultimo mes' },
  { key: '3M', label: '3M', subtitle: 'Ultimos 3 meses' },
  { key: '6M', label: '6M', subtitle: 'Ultimos 6 meses' },
  { key: '1A', label: '1A', subtitle: 'Ultimo año' }
]

const chartConfig = {
  ingresos: { label: 'Ingresos', color: '#22c55e' },
  gastos: { label: 'Gastos', color: '#ef4444' }
}

function getDateRange(periodKey) {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
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
    const month = t.date.slice(0, 7)
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
  const [period, setPeriod] = useState('1M')
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      const { startDate, endDate } = getDateRange(period)

      const { data, error } = await supabase
        .from('transactions')
        .select('date, type, amount')
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: true })

      if (cancelled) return
      if (error) {
        console.error('Error fetching chart data:', error)
        setRawData([])
      } else {
        setRawData(data || [])
      }
      setLoading(false)
    }
    fetchData()
    return () => { cancelled = true }
  }, [period])

  const data = useMemo(() => {
    if (rawData.length === 0) return []
    return period === '1M' ? aggregateByDay(rawData) : aggregateByMonth(rawData)
  }, [rawData, period])

  const activePeriod = PERIODS.find(p => p.key === period)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Ingresos vs Gastos</CardTitle>
          <CardDescription>{activePeriod?.subtitle}</CardDescription>
        </div>
        <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v)} size="sm">
          {PERIODS.map(p => (
            <ToggleGroupItem key={p.key} value={p.key}>{p.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10">
            Sin datos para este periodo
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-ingresos)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-ingresos)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-gastos)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-gastos)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCOP(value)} />} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="var(--color-ingresos)"
                strokeWidth={2}
                fill="url(#gradIncome)"
                dot={{ r: 3, fill: 'var(--color-ingresos)' }}
                name="Ingresos"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke="var(--color-gastos)"
                strokeWidth={2}
                fill="url(#gradExpense)"
                dot={{ r: 3, fill: 'var(--color-gastos)' }}
                name="Gastos"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
