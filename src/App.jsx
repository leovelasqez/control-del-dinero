import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useBudgets } from './hooks/useBudgets'
import { useSavingsGoals } from './hooks/useSavingsGoals'
import { useDebts } from './hooks/useDebts'
import LoginPage from './pages/LoginPage'
import KPICards from './components/KPICards'
import MonthlyChart from './components/MonthlyChart'
import ExpensePieChart from './components/ExpensePieChart'
import TransactionTable from './components/TransactionTable'
import AddTransactionModal from './components/AddTransactionModal'
import ScanReceiptModal from './components/ScanReceiptModal'
import ExportButtons from './components/ExportButtons'
import BudgetsPage from './pages/BudgetsPage'
import GoalsPage from './pages/GoalsPage'
import DebtsPage from './pages/DebtsPage'
import HistoryPage from './pages/HistoryPage'
import InvestmentPage from './pages/InvestmentPage'
import AIReportPage from './pages/AIReportPage'
import { useTheme } from './hooks/useTheme'
import { LogOut, Plus, Camera, LayoutDashboard, Wallet, Target, CreditCard, BarChart3, TrendingUp, Bot, Sun, Moon } from 'lucide-react'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'budgets', label: 'Presupuestos', icon: Wallet },
  { key: 'goals', label: 'Metas', icon: Target },
  { key: 'debts', label: 'Deudas', icon: CreditCard },
  { key: 'history', label: 'Historial', icon: BarChart3 },
  { key: 'investment', label: 'Inversion', icon: TrendingUp },
  { key: 'report', label: 'Reporte IA', icon: Bot }
]

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [addModalType, setAddModalType] = useState(null)
  const [showScanModal, setShowScanModal] = useState(false)

  const { transactions, loading: txLoading, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { budgets, loading: budgetsLoading, upsertBudget, updateBudget, deleteBudget } = useBudgets()
  const { goals, loading: goalsLoading, addGoal, addToGoal, updateGoal, deleteGoal } = useSavingsGoals()
  const { debts, loading: debtsLoading, addDebt, payDebt, updateDebt, deleteDebt } = useDebts()

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app-container">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      }} />

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>Control del Dinero</h1>
        </div>
        <div className="user-info">
          <ExportButtons transactions={transactions} budgets={budgets} goals={goals} debts={debts} />
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="user-pill">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <span>{user.user_metadata?.full_name?.split(' ')[0] || user.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={signOut} title="Cerrar sesion">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <div>
          <div className="welcome-bar">
            <div className="welcome-text">
              <span className="welcome-greeting">Hola, {user.user_metadata?.full_name?.split(' ')[0] || 'usuario'}</span>
              <span className="welcome-date">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="welcome-actions">
              <button className="btn btn-success btn-sm" onClick={() => setAddModalType('ingreso')}>
                <Plus size={14} /> Agregar ingreso
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setAddModalType('gasto')}>
                <Plus size={14} /> Agregar gasto
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowScanModal(true)}>
                <Camera size={14} /> Escanear factura
              </button>
            </div>
          </div>

          <KPICards transactions={transactions} debts={debts} />

          <div className="grid-charts">
            <MonthlyChart transactions={transactions} />
            <ExpensePieChart transactions={transactions} />
          </div>

          <TransactionTable transactions={transactions} onDelete={deleteTransaction} onUpdate={updateTransaction} loading={txLoading} />
        </div>
      )}

      {activeTab === 'budgets' && (
        <BudgetsPage
          budgets={budgets}
          transactions={transactions}
          loading={budgetsLoading}
          onUpsert={upsertBudget}
          onUpdate={updateBudget}
          onDelete={deleteBudget}
        />
      )}

      {activeTab === 'goals' && (
        <GoalsPage
          goals={goals}
          loading={goalsLoading}
          onAdd={addGoal}
          onAddToGoal={addToGoal}
          onUpdate={updateGoal}
          onDelete={deleteGoal}
        />
      )}

      {activeTab === 'debts' && (
        <DebtsPage
          debts={debts}
          loading={debtsLoading}
          onAdd={addDebt}
          onPay={payDebt}
          onUpdate={updateDebt}
          onDelete={deleteDebt}
          onAddTransaction={addTransaction}
        />
      )}

      {activeTab === 'history' && (
        <HistoryPage transactions={transactions} />
      )}

      {activeTab === 'investment' && (
        <InvestmentPage />
      )}

      {activeTab === 'report' && (
        <AIReportPage
          transactions={transactions}
          budgets={budgets}
          goals={goals}
          debts={debts}
        />
      )}

      {/* Modals */}
      {addModalType && (
        <AddTransactionModal
          initialType={addModalType}
          onClose={() => setAddModalType(null)}
          onAdd={addTransaction}
        />
      )}
      {showScanModal && (
        <ScanReceiptModal
          onClose={() => setShowScanModal(false)}
          onAdd={addTransaction}
        />
      )}
    </div>
  )
}
