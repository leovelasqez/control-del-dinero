import { useMemo } from 'react'
import { PieChart, Pie, Cell, Label } from 'recharts'
import { CATEGORY_COLORS, formatCOP } from '../lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

function formatShort(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`
  return `$${amount}`
}

export default function ExpensePieChart({ categoryData }) {
  const { data, total, chartConfig } = useMemo(() => {
    if (!categoryData) return { data: [], total: 0, chartConfig: {} }
    const items = categoryData.map(c => ({ name: c.name, value: Number(c.value) }))
    const sum = items.reduce((acc, c) => acc + c.value, 0)
    const config = {}
    items.forEach(item => {
      config[item.name] = { label: item.name, color: CATEGORY_COLORS[item.name] || '#6b7280' }
    })
    return { data: items, total: sum, chartConfig: config }
  }, [categoryData])

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
          <CardDescription>Este mes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sin gastos registrados</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
        <CardDescription>Este mes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[180px] w-[180px] shrink-0">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCOP(value)} />} />
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
                        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-base font-bold">
                          {formatShort(total)}
                        </text>
                        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-xs">
                          Total
                        </text>
                      </g>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex-1 space-y-1.5 w-full">
            {data.map(d => {
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
              return (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[d.name] || '#6b7280' }} />
                  <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                  <span className="font-medium tabular-nums">{formatCOP(d.value)}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
