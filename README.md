# Control del Dinero

Dashboard de finanzas personales con inteligencia artificial. Diseñado para el contexto colombiano (COP).

## Funcionalidades

- **Dashboard** con KPIs: balance, ingresos, gastos y deudas del mes
- **Transacciones** con filtros por fecha, categoria y tipo (ingreso/gasto)
- **Escaneo de recibos** con IA: toma una foto y se extraen los datos automaticamente
- **Presupuestos** por categoria con barras de progreso
- **Metas de ahorro** con abonos rapidos
- **Deudas** con historial de abonos y subida de extractos PDF (incluyendo PDFs protegidos con contrasena)
- **Historial** y comparacion entre meses con graficas agrupadas/apiladas
- **Calculadora de inversion** con interes simple y compuesto
- **Reporte mensual con IA** (resumen, logros, mejoras, recomendaciones, estado de metas)
- **Exportar** a Excel (4 hojas) y PDF
- **Graficas**: evolucion mensual (linea) y gastos por categoria (dona)

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19, Vite 7, Recharts, Lucide React, React Router DOM |
| Backend | Supabase (PostgreSQL + Auth con Google) |
| IA | Anthropic API (Claude Sonnet) via serverless function |
| Exportacion | SheetJS (xlsx), pdfjs-dist |
| Hosting | Vercel |

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- API key de [Anthropic](https://console.anthropic.com)

## Instalacion

```bash
git clone https://github.com/leovelasqez/control-del-dinero.git
cd control-del-dinero
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raiz:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
ANTHROPIC_API_KEY=tu_anthropic_api_key
```

## Base de datos

Ejecuta el archivo `supabase-schema.sql` en el SQL Editor de Supabase para crear las tablas:

- `transactions` - Ingresos y gastos
- `budgets` - Presupuestos por categoria
- `savings_goals` - Metas de ahorro
- `debts` - Deudas (tarjetas de credito, creditos)
- `debt_payments` - Historial de abonos a deudas

Todas las tablas tienen RLS (Row Level Security) habilitado.

## Desarrollo

```bash
npm run dev
```

## Despliegue en Vercel

1. Conecta el repo en [Vercel](https://vercel.com)
2. Agrega las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`)
3. La serverless function en `api/anthropic.js` se despliega automaticamente

## Estructura del proyecto

```
src/
  App.jsx                  # Componente principal con navegacion
  pages/                   # Paginas de la app
    LoginPage.jsx
    BudgetsPage.jsx
    GoalsPage.jsx
    DebtsPage.jsx
    HistoryPage.jsx
    InvestmentPage.jsx
    AIReportPage.jsx
  components/              # Componentes reutilizables
  hooks/                   # Custom hooks (useAuth, useTransactions, etc.)
  lib/                     # Utilidades (supabase client, constantes, pdfExtractor)
  api/                     # Cliente frontend para IA
api/
  anthropic.js             # Serverless function (Vercel)
supabase-schema.sql        # Esquema de base de datos
```
