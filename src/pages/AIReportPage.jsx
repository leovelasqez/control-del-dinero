import { useState } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import { generateMonthlyReport } from '../api/anthropic'
import { MONTHS } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function sanitizeAndFormatReport(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const formatted = escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')

  const lines = formatted.split('\n')
  const result = []
  let inList = false
  for (const line of lines) {
    const isListItem = line.trim().startsWith('<li>')
    if (isListItem && !inList) {
      result.push('<ul>')
      inList = true
    } else if (!isListItem && inList) {
      result.push('</ul>')
      inList = false
    }
    result.push(line)
  }
  if (inList) result.push('</ul>')

  return result.join('\n')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

export default function AIReportPage({ budgets, goals, debts }) {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setReport('')

    const monthNum = Number(month)
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const endDate = monthNum === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(monthNum + 1).padStart(2, '0')}-01`

    const { data: monthTx, error } = await supabase
      .from('transactions')
      .select('date, type, category, description, amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: false })

    if (error) {
      toast.error('Error al cargar transacciones del mes')
      setLoading(false)
      return
    }

    if (monthTx.length === 0) {
      toast.error(`No hay transacciones en ${MONTHS[monthNum - 1]} ${year}`)
      setLoading(false)
      return
    }

    const txSummary = {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: monthTx.length,
      incomeByCategory: {},
      expenseByCategory: {},
      topExpenses: []
    }

    monthTx.forEach(t => {
      const amount = Number(t.amount)
      if (t.type === 'ingreso') {
        txSummary.totalIncome += amount
        txSummary.incomeByCategory[t.category] = (txSummary.incomeByCategory[t.category] || 0) + amount
      } else {
        txSummary.totalExpenses += amount
        txSummary.expenseByCategory[t.category] = (txSummary.expenseByCategory[t.category] || 0) + amount
      }
    })

    txSummary.balance = txSummary.totalIncome - txSummary.totalExpenses

    txSummary.topExpenses = monthTx
      .filter(t => t.type === 'gasto')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map(t => ({ date: t.date, category: t.category, description: t.description, amount: Number(t.amount) }))

    const budgetSummary = budgets.map(b => ({
      category: b.category,
      subcategory: b.subcategory || null,
      monthly_limit: Number(b.amount),
      spent: txSummary.expenseByCategory[b.subcategory || b.category] || 0
    }))

    const goalSummary = goals.map(g => ({
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
      deadline: g.deadline
    }))

    const debtSummary = debts.map(d => ({
      name: d.name,
      balance: Number(d.current_balance),
      minimum_payment: Number(d.minimum_payment),
      interest_rate: Number(d.interest_rate)
    }))

    try {
      const data = await generateMonthlyReport({
        transactionSummary: txSummary,
        budgets: budgetSummary,
        goals: goalSummary,
        debts: debtSummary,
        month: monthNum,
        year
      })
      setReport(data.report)
    } catch (err) {
      toast.error('Error al generar reporte: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Reporte Mensual con IA</h2>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" className="w-[100px]" value={year} onChange={e => setYear(Number(e.target.value))} min="2020" max="2030" />
            </div>
            <Button size="sm" className="gap-1" onClick={handleGenerate} disabled={loading}>
              {loading ? <><Loader2 className="size-3.5 animate-spin" /> Generando...</> : <><Bot className="size-3.5" /> Generar Reporte</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="text-center py-10">
            <Loader2 className="size-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">La IA esta analizando tus finanzas...</p>
          </CardContent>
        </Card>
      )}

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte de {MONTHS[Number(month) - 1]} {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_h4]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-sm [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: sanitizeAndFormatReport(report) }}
            />
          </CardContent>
        </Card>
      )}

      {!loading && !report && (
        <Card>
          <CardContent className="text-center py-10">
            <Bot className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Selecciona un mes y genera tu reporte personalizado.</p>
            <p className="text-xs text-muted-foreground mt-2">La IA analizara tus transacciones, presupuestos, metas y deudas.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
