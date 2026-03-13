import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell } from 'recharts'
import { MONTHS, EXPENSE_CATEGORIES, CATEGORY_COLORS, formatCOP } from '../lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const incomeExpenseConfig = {
  ingresos: { label: 'Ingresos', color: '#22c55e' },
  gastos: { label: 'Gastos', color: '#ef4444' }
}

const savingsConfig = {
  ahorro: { label: 'Ahorro neto', color: '#22c55e' }
}

export default function HistoryPage({ monthlyData, categoryData }) {
  const chartData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return []

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
      <Card>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">Agrega transacciones para ver el historial.</p>
        </CardContent>
      </Card>
    )
  }

  const categoryConfig = {}
  EXPENSE_CATEGORIES.forEach(cat => {
    categoryConfig[cat] = { label: cat, color: CATEGORY_COLORS[cat] || '#6b7280' }
  })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Historial</h2>

      <Tabs defaultValue="income-vs-expense">
        <TabsList>
          <TabsTrigger value="income-vs-expense">Ingresos vs Gastos</TabsTrigger>
          <TabsTrigger value="savings">Ahorro neto</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="income-vs-expense">
          <Card>
            <CardContent className="pt-6">
              <ChartContainer config={incomeExpenseConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={v => formatCOP(v)} />} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" fill="var(--color-gastos)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings">
          <Card>
            <CardContent className="pt-6">
              <ChartContainer config={savingsConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={v => formatCOP(v)} />} />
                  <Bar dataKey="ahorro" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.ahorro >= 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardContent className="pt-6">
              <ChartContainer config={categoryConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={v => formatCOP(v)} />} />
                  <Legend />
                  {EXPENSE_CATEGORIES.map(cat => (
                    <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={CATEGORY_COLORS[cat] || '#6b7280'} />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Resumen por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Gastos</TableHead>
                  <TableHead>Ahorro Neto</TableHead>
                  <TableHead>% Ahorro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map(m => (
                  <TableRow key={m.month}>
                    <TableCell>{m.label}</TableCell>
                    <TableCell className="text-green-500">{formatCOP(m.ingresos)}</TableCell>
                    <TableCell className="text-red-500">{formatCOP(m.gastos)}</TableCell>
                    <TableCell className={m.ahorro >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCOP(m.ahorro)}</TableCell>
                    <TableCell className={Number(m.pctAhorro) >= 0 ? 'text-green-500' : 'text-red-500'}>{m.pctAhorro}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
