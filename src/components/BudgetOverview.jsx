import { MONTHS, formatCOP } from '../lib/constants'

function CircularProgress({ percentage, size = 56, strokeWidth = 5, color }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-input)" strokeWidth={strokeWidth} />
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
  if (pct > 90) return 'var(--red)'
  if (pct > 70) return 'var(--yellow)'
  return 'var(--green)'
}

const CAT_COLORS = ['#fff3e0', '#e3f2fd', '#f3e5f5', '#ffebee', '#e0f2f1', '#fffde7', '#fce4ec', '#f5f5f5']
const CAT_ICONS = ['📋', '🏠', '🛒', '💳', '🎯', '📊', '💰', '📦']

export default function BudgetOverview({ groupedBudgets, spentByCategory, onNavigate }) {
  const categories = Object.keys(groupedBudgets || {})
  if (categories.length === 0) return null

  const now = new Date()
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div className="card mb-4">
      <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
        <div>
          <div className="card-title" style={{ marginBottom: 0 }}>Resumen de Presupuestos</div>
          <div className="card-subtitle" style={{ marginBottom: 0 }}>{monthLabel}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onNavigate}>
          Ver todo
        </button>
      </div>

      <div className="budget-overview-grid">
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
            <div key={cat} className="budget-card">
              <div className="budget-card-icon" style={{ background: CAT_COLORS[idx % CAT_COLORS.length] }}>
                {CAT_ICONS[idx % CAT_ICONS.length]}
              </div>
              <div className="budget-card-info">
                <div className="budget-card-name">{cat}</div>
                <div className="budget-card-amount">{formatCOP(catSpent)}</div>
                <div className="budget-card-remaining" style={isOver ? { color: 'var(--red)' } : undefined}>
                  {isOver
                    ? `${formatCOP(over)} excedido`
                    : `${formatCOP(catTotal - catSpent)} restante`
                  }
                </div>
              </div>
              <div className="budget-card-ring">
                <CircularProgress percentage={pct} color={color} />
                <span className="budget-card-ring-pct">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
