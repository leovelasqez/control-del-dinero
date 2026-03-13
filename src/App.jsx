import { useState, useCallback, lazy, Suspense } from 'react'
import { Toaster } from '@/components/ui/sonner'
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
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Plus, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BudgetsPage = lazy(() => import('./pages/BudgetsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const DebtsPage = lazy(() => import('./pages/DebtsPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const InvestmentPage = lazy(() => import('./pages/InvestmentPage'))
const AIReportPage = lazy(() => import('./pages/AIReportPage'))

const AddTransactionModal = lazy(() => import('./components/AddTransactionModal'))
const ScanReceiptModal = lazy(() => import('./components/ScanReceiptModal'))

const PageSpinner = () => (
  <div className="flex items-center justify-center py-10">
    <Loader2 className="size-6 animate-spin text-muted-foreground" />
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
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const topbarActions = <ExportButtons onExportData={fetchAllForExport} budgets={budgets} goals={goals} debts={debts} />

  return (
    <TooltipProvider>
      <SidebarProvider>
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
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-lg font-semibold">
                  Hola, {user.user_metadata?.full_name?.split(' ')[0] || 'usuario'}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={handleOpenIngreso}>
                    <Plus className="size-3.5" /> Agregar ingreso
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1" onClick={handleOpenGasto}>
                    <Plus className="size-3.5" /> Agregar gasto
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={handleOpenScan}>
                    <Camera className="size-3.5" /> Escanear factura
                  </Button>
                </div>
              </div>

              <KPICards summary={summary} budgets={budgets} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </TooltipProvider>
  )
}
