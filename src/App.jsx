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
import { LogOut, Plus, Camera } from 'lucide-react'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'budgets', label: 'Presupuestos' },
  { key: 'goals', label: 'Metas' },
  { key: 'debts', label: 'Deudas' },
  { key: 'history', label: 'Historial' },
  { key: 'investment', label: 'Inversion' },
  { key: 'report', label: 'Reporte IA' }
]

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddModal, setShowAddModal] = useState(false)
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
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
      }} />

      {/* Header */}
      <header className="app-header">
        <h1>Control del Dinero</h1>
        <div className="user-info">
          <ExportButtons transactions={transactions} budgets={budgets} goals={goals} debts={debts} />
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              referrerPolicy="no-referrer"
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          <span className="text-sm">{user.user_metadata?.full_name || user.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <div>
          <KPICards transactions={transactions} debts={debts} />

          <div className="flex justify-between items-center mb-4">
            <div />
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Agregar registro
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowScanModal(true)}>
                <Camera size={14} /> Escanea tu factura
              </button>
            </div>
          </div>

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
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
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
