import { useState, useCallback, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useBudgets } from './hooks/useBudgets'
import { useSavingsGoals } from './hooks/useSavingsGoals'
import { useDebts } from './hooks/useDebts'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import KPICards from './components/KPICards'
import MonthlyChart from './components/MonthlyChart'
import ExpensePieChart from './components/ExpensePieChart'
import TransactionTable from './components/TransactionTable'
import BudgetOverview from './components/BudgetOverview'
import ExportButtons from './components/ExportButtons'
import { useTheme } from './hooks/useTheme'
import { Plus, Camera } from 'lucide-react'

// Lazy load pages that are not shown on initial render
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const DebtsPage = lazy(() => import('./pages/DebtsPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const InvestmentPage = lazy(() => import('./pages/InvestmentPage'))
const AIReportPage = lazy(() => import('./pages/AIReportPage'))

// Lazy load modals — only loaded when user opens them
const AddTransactionModal = lazy(() => import('./components/AddTransactionModal'))
const ScanReceiptModal = lazy(() => import('./components/ScanReceiptModal'))

const PageSpinner = () => (
  <div style={{ padding: 40, textAlign: 'center' }}>
    <div className="spinner" />
  </div>
)

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [addModalType, setAddModalType] = useState(null)
  const [showScanModal, setShowScanModal] = useState(false)

  const {
    transactions, totalCount, page, setPage, pageSize,
    filter, setFilter, search, setSearch,
    loading: txLoading,
    summary,
    accountBalances,
    addTransaction, addMultipleTransactions, updateTransaction, deleteTransaction,
    fetchAllForExport
  } = useTransactions()

  const {
    budgets, groupedBudgets, loading: budgetsLoading, spentByCategory,
    selectedMonth, setSelectedMonth,
    addBudgetItem, updateBudgetItem, deleteBudgetItem, deleteCategory,
    duplicateMonth, getAvailableMonths
  } = useBudgets()
  const { goals, loading: goalsLoading, addGoal, addToGoal, updateGoal, deleteGoal } = useSavingsGoals()
  const { debts, loading: debtsLoading, addDebt, payDebt, updateDebt, deleteDebt } = useDebts()

  const handleOpenIngreso = useCallback(() => setAddModalType('ingreso'), [])
  const handleOpenGasto = useCallback(() => setAddModalType('gasto'), [])
  const handleOpenScan = useCallback(() => setShowScanModal(true), [])
  const handleCloseModal = useCallback(() => setAddModalType(null), [])
  const handleCloseScan = useCallback(() => setShowScanModal(false), [])
  const handleNavigateBudgets = useCallback(() => setActiveTab('budgets'), [])

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

  const topbarActions = <ExportButtons onExportData={fetchAllForExport} budgets={budgets} goals={goals} debts={debts} />

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      }} />

      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        signOut={signOut}
        theme={theme}
        toggleTheme={toggleTheme}
        summary={summary}
        debts={debts}
        accountBalances={accountBalances}
        topbarActions={topbarActions}
      >
        {activeTab === 'dashboard' && (
          <div>
            <div className="welcome-bar">
              <div className="welcome-text">
                <span className="welcome-greeting">Hola, {user.user_metadata?.full_name?.split(' ')[0] || 'usuario'}</span>
              </div>
              <div className="welcome-actions">
                <button className="btn btn-success btn-sm" onClick={handleOpenIngreso}>
                  <Plus size={14} /> Agregar ingreso
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleOpenGasto}>
                  <Plus size={14} /> Agregar gasto
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleOpenScan}>
                  <Camera size={14} /> Escanear factura
                </button>
              </div>
            </div>

            <KPICards summary={summary} budgets={budgets} />

            <div className="grid-charts">
              <MonthlyChart />
              <ExpensePieChart categoryData={summary?.expense_by_category} />
            </div>

            <BudgetOverview
              groupedBudgets={groupedBudgets}
              spentByCategory={spentByCategory}
              onNavigate={handleNavigateBudgets}
            />

            <TransactionTable
              transactions={transactions}
              totalCount={totalCount}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              onDelete={deleteTransaction}
              onUpdate={updateTransaction}
              loading={txLoading}
              summary={summary}
            />
          </div>
        )}

        <Suspense fallback={<PageSpinner />}>
          {activeTab === 'budgets' && (
            <BudgetsPage
              groupedBudgets={groupedBudgets}
              spentByCategory={spentByCategory}
              loading={budgetsLoading}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              onAddItem={addBudgetItem}
              onUpdateItem={updateBudgetItem}
              onDeleteItem={deleteBudgetItem}
              onDeleteCategory={deleteCategory}
              onDuplicateMonth={duplicateMonth}
              getAvailableMonths={getAvailableMonths}
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
            <HistoryPage
              monthlyData={summary?.history_monthly}
              categoryData={summary?.history_categories}
            />
          )}

          {activeTab === 'investment' && (
            <InvestmentPage />
          )}

          {activeTab === 'report' && (
            <AIReportPage
              budgets={budgets}
              goals={goals}
              debts={debts}
            />
          )}
        </Suspense>
      </Layout>

      {/* Modals */}
      <Suspense fallback={null}>
        {addModalType && (
          <AddTransactionModal
            initialType={addModalType}
            onClose={handleCloseModal}
            onAdd={addTransaction}
          />
        )}
        {showScanModal && (
          <ScanReceiptModal
            onClose={handleCloseScan}
            onAdd={addTransaction}
          />
        )}
      </Suspense>
    </>
  )
}
