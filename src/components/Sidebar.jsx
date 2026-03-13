import { Wallet, LayoutDashboard, Target, CreditCard, BarChart3, TrendingUp, Bot, Sun, Moon, LogOut } from 'lucide-react'
import { formatCOP } from '../lib/constants'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

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

export default function AppSidebar({ activeTab, setActiveTab, user, signOut, theme, toggleTheme, debts, accountBalances }) {
  const totalDebt = debts ? debts.reduce((sum, d) => sum + Number(d.current_balance), 0) : 0

  return (
    <SidebarRoot collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-2">
              <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                <Wallet className="size-4" />
              </div>
              <span className="font-bold text-sm">Control del Dinero</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <SidebarMenuItem key={tab.key}>
                  <SidebarMenuButton
                    isActive={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    tooltip={tab.label}
                  >
                    <Icon className="size-4" />
                    <span>{tab.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Cuentas</SidebarGroupLabel>
          <SidebarMenu>
            {accountBalances.map(acc => (
              <SidebarMenuItem key={acc.name}>
                <SidebarMenuButton className="cursor-default hover:bg-transparent">
                  <span className="size-2 rounded-full shrink-0" style={{ background: ACCOUNT_COLORS[acc.name] || '#6b7280' }} />
                  <span className="flex-1 truncate text-xs">{acc.name}</span>
                  <span className={`text-xs font-medium tabular-nums ${acc.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCOP(acc.balance)}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {totalDebt > 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton className="cursor-default hover:bg-transparent">
                  <span className="size-2 rounded-full shrink-0 bg-red-500" />
                  <span className="flex-1 truncate text-xs">Total deudas</span>
                  <span className="text-xs font-medium tabular-nums text-red-500">{formatCOP(totalDebt)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton className="cursor-default hover:bg-transparent">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="size-5 rounded-full shrink-0"
                    referrerPolicy="no-referrer"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Cerrar sesion" className="text-red-500 hover:text-red-500">
              <LogOut className="size-4" />
              <span>Cerrar sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  )
}
