import { useState, useEffect } from 'react'
import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react'
import Sidebar, { TABS } from './Sidebar'

export default function Layout({ activeTab, setActiveTab, user, signOut, theme, toggleTheme, summary, debts, accountBalances, topbarActions, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const activeLabel = TABS.find(t => t.key === activeTab)?.label || 'Dashboard'

  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        signOut={signOut}
        theme={theme}
        toggleTheme={toggleTheme}
        summary={summary}
        debts={debts}
        accountBalances={accountBalances}
        isOpen={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      {mobileOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-left">
            {isMobile ? (
              <button className="hamburger-btn" onClick={() => setMobileOpen(true)}>
                <Menu size={20} />
              </button>
            ) : (
              <button
                className="sidebar-toggle-btn"
                onClick={() => setCollapsed(c => !c)}
                title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              >
                {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
              </button>
            )}
            <div className="topbar-title">
              <h2>{activeLabel}</h2>
              <span className="topbar-subtitle">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <div className="topbar-actions">
            {topbarActions}
          </div>
        </header>

        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  )
}
