import { Wallet, LayoutDashboard, Target, CreditCard, BarChart3, TrendingUp, Bot, Sun, Moon, LogOut } from 'lucide-react'
import { formatCOP } from '../lib/constants'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'budgets', label: 'Presupuestos', icon: Wallet },
  { key: 'goals', label: 'Metas', icon: Target },
  { key: 'debts', label: 'Deudas', icon: CreditCard },
  { key: 'history', label: 'Historial', icon: BarChart3 },
  { key: 'investment', label: 'Inversion', icon: TrendingUp },
  { key: 'report', label: 'Reporte IA', icon: Bot }
]

export { TABS }

const ACCOUNT_COLORS = {
  'Tarjeta debito': '#3b82f6',
  'Tarjeta de credito': '#a855f7',
  'Efectivo': '#22c55e',
  'Ahorros': '#eab308'
}

export default function Sidebar({ activeTab, setActiveTab, user, signOut, theme, toggleTheme, summary, debts, accountBalances, isOpen, collapsed, onClose }) {
  const totalDebt = debts ? debts.reduce((sum, d) => sum + Number(d.current_balance), 0) : 0

  const handleNav = (key) => {
    setActiveTab(key)
    onClose()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <Wallet size={22} />
        {!collapsed && <span>Control del Dinero</span>}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section-title">Menu</div>}
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              className={`sidebar-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleNav(tab.key)}
              title={collapsed ? tab.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && tab.label}
            </button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="sidebar-accounts">
          <div className="sidebar-section-title">Cuentas</div>
          {accountBalances.map(acc => (
            <div key={acc.name} className="sidebar-account-item">
              <div className="sidebar-account-left">
                <span className="sidebar-account-dot" style={{ background: ACCOUNT_COLORS[acc.name] || '#6b7280' }} />
                <span className="sidebar-account-name">{acc.name}</span>
              </div>
              <span className="sidebar-account-value" style={{ color: acc.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {formatCOP(acc.balance)}
              </span>
            </div>
          ))}
          {totalDebt > 0 && (
            <div className="sidebar-account-item">
              <div className="sidebar-account-left">
                <span className="sidebar-account-dot" style={{ background: '#ef4444' }} />
                <span className="sidebar-account-name">Total deudas</span>
              </div>
              <span className="sidebar-account-value" style={{ color: 'var(--red)' }}>
                {formatCOP(totalDebt)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="sidebar-bottom">
        <button className="sidebar-bottom-item" onClick={toggleTheme} title={collapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && (theme === 'dark' ? 'Modo claro' : 'Modo oscuro')}
        </button>

        {user && !collapsed && (
          <div className="sidebar-user">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <div>
              <div className="sidebar-user-name">
                {user.user_metadata?.full_name?.split(' ')[0] || user.email}
              </div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
        )}

        <button className="sidebar-bottom-item" onClick={signOut} style={{ color: 'var(--red)' }} title={collapsed ? 'Cerrar sesion' : undefined}>
          <LogOut size={18} />
          {!collapsed && 'Cerrar sesion'}
        </button>
      </div>
    </aside>
  )
}
