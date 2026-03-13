import AppSidebar, { TABS } from './Sidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export { TABS }

export default function Layout({ activeTab, setActiveTab, user, signOut, theme, toggleTheme, summary, debts, accountBalances, topbarActions, children }) {
  const activeLabel = TABS.find(t => t.key === activeTab)?.label || 'Dashboard'

  return (
    <>
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        signOut={signOut}
        theme={theme}
        toggleTheme={toggleTheme}
        summary={summary}
        debts={debts}
        accountBalances={accountBalances}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/85 backdrop-blur-sm px-4 h-14">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div>
              <h2 className="text-sm font-semibold">{activeLabel}</h2>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {topbarActions}
          </div>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  )
}
