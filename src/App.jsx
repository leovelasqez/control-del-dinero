import { useState } from 'react'
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
import { Plus, Camera } from 'lucide-react'

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

  const topbarActions = (
    <>
      <ExportButtons onExportData={fetchAllForExport} budgets={budgets} goals={goals} debts={debts} />
    </>
  )

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

            <KPICards summary={summary} budgets={budgets} />

            <div className="grid-charts">
              <MonthlyChart />
              <ExpensePieChart categoryData={summary?.expense_by_category} />
            </div>

            <BudgetOverview
              groupedBudgets={groupedBudgets}
              spentByCategory={spentByCategory}
              onNavigate={() => setActiveTab('budgets')}
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
      </Layout>

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
    </>
  )
}
