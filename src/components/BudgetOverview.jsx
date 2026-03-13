import { MONTHS, formatCOP } from '../lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function CircularProgress({ percentage, size = 56, strokeWidth = 5, color }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-muted" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

function getRingColor(pct) {
  if (pct > 90) return '#ef4444'
  if (pct > 70) return '#eab308'
  return '#22c55e'
}

const CAT_ICONS = ['📋', '🏠', '🛒', '💳', '🎯', '📊', '💰', '📦']

export default function BudgetOverview({ groupedBudgets, spentByCategory, onNavigate }) {
  const categories = Object.keys(groupedBudgets || {})
  if (categories.length === 0) return null

  const now = new Date()
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resumen de Presupuestos</CardTitle>
          <CardDescription>{monthLabel}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onNavigate}>Ver todo</Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const items = groupedBudgets[cat]
            const catTotal = items.reduce((s, b) => s + Number(b.amount), 0)
            const catSpent = items.reduce((s, b) => {
              const key = b.subcategory || b.category
              return s + (spentByCategory[key] || 0)
            }, 0)
            const pct = catTotal > 0 ? Math.round((catSpent / catTotal) * 100) : 0
            const over = catSpent - catTotal
            const isOver = pct > 100
            const color = getRingColor(pct)

            return (
              <div key={cat} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="size-10 rounded-lg flex items-center justify-center text-lg bg-muted">
                  {CAT_ICONS[idx % CAT_ICONS.length]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{cat}</div>
                  <div className="text-sm font-semibold tabular-nums">{formatCOP(catSpent)}</div>
                  <div className={`text-xs ${isOver ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {isOver
                      ? `${formatCOP(over)} excedido`
                      : `${formatCOP(catTotal - catSpent)} restante`
                    }
                  </div>
                </div>
                <div className="relative shrink-0">
                  <CircularProgress percentage={pct} color={color} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
