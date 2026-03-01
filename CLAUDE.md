# Control del Dinero

Dashboard de finanzas personales con IA. Moneda: pesos colombianos (COP).

## Stack

- **Frontend:** React 19 + Vite 7 (JSX, no TypeScript)
- **Backend:** Supabase (PostgreSQL + Auth con Google OAuth)
- **IA:** Anthropic API (claude-sonnet-4-20250514) via serverless function
- **Hosting:** Vercel (https://control-del-dinero.vercel.app)
- **Librerias UI:** Recharts (graficas), Lucide React (iconos), react-hot-toast

## Estructura del proyecto

```
src/
  App.jsx              # Componente principal, navegacion por pestanas
  main.jsx             # Entry point
  pages/               # Paginas completas (LoginPage, BudgetsPage, GoalsPage, DebtsPage, HistoryPage, InvestmentPage, AIReportPage)
  components/          # Componentes reutilizables (KPICards, MonthlyChart, modales, etc.)
  hooks/               # Custom hooks (useAuth, useTransactions, useBudgets, useSavingsGoals, useDebts)
  lib/                 # Utilidades (supabase.js, constants.js, pdfExtractor.js)
  api/anthropic.js     # Cliente frontend para llamadas IA
  styles/global.css    # Estilos globales
api/
  anthropic.js         # Serverless function (Vercel) - protege ANTHROPIC_API_KEY
supabase-schema.sql    # Esquema completo de BD
```

## Base de datos (Supabase)

5 tablas con RLS: `transactions`, `budgets`, `savings_goals`, `debts`, `debt_payments`.
Cada usuario solo ve sus propios datos via `auth.uid()`.

## Variables de entorno

- `VITE_SUPABASE_URL` - URL del proyecto Supabase (frontend)
- `VITE_SUPABASE_ANON_KEY` - Anon key de Supabase (frontend)
- `ANTHROPIC_API_KEY` - API key de Anthropic (solo en Vercel, nunca en frontend)

## Convenciones de codigo

- JSX funcional con hooks, sin clases
- Hooks custom en `src/hooks/` encapsulan toda la logica de Supabase
- `addMultipleTransactions()` en useTransactions para inserciones batch
- Montos en COP sin decimales, formatear con `formatCOP()` de constants.js
- Categorias definidas en `src/lib/constants.js` (EXPENSE_CATEGORIES, INCOME_CATEGORIES)
- Estilos: modo oscuro (#0f172a fondo, #1e293b tarjetas), paleta verde/rojo/indigo
- Toasts con `react-hot-toast` para feedback al usuario

## Rama principal

`master` (no main). Auto-deploy a Vercel desde GitHub.

## Idioma

Toda la UI y comunicacion con el usuario en **espanol colombiano**.
NO usar voseo (nunca "vos/podes/contas"). Usar tuteo: "tu/puedes/cuentas".

## Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de produccion
npm run preview  # Preview del build
```
