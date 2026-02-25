Quiero que me ayudes a continuar el desarrollo de un Dashboard de Finanzas Personales que ya tengo construido como prototipo funcional en React. A continuación te explico todo lo que tiene, cómo está construido y hacia dónde quiero llevarlo.

🛠️ Stack tecnológico actual (prototipo)

React con hooks (useState, useMemo, useRef)
Recharts para gráficas (LineChart, BarChart, PieChart)
SheetJS (xlsx) para exportar a Excel
Anthropic API (claude-sonnet-4-20250514) para funcionalidades de IA
Gmail MCP (https://gmail.mcp.claude.com/mcp) para importar transacciones desde correo
Todo el estado en memoria (sin base de datos aún)
Sin sistema de autenticación aún
Sin backend propio aún


✅ Funcionalidades ya implementadas
1. Dashboard principal

4 KPIs: Balance total, Ingresos totales, Gastos totales, Total deudas
Gráfica de línea: evolución mensual de ingresos vs gastos
Gráfica de dona: distribución de gastos por categoría
Tabla de transacciones con filtro por tipo (todas / ingresos / gastos)
Eliminar transacciones individuales

2. Agregar transacciones manualmente

Formulario con: fecha, tipo (ingreso/gasto), categoría, descripción, monto
Categorías de gastos: Comida, Transporte, Entretenimiento, Salud, Educación, Vivienda, Ropa, Otros
Categorías de ingresos: Salario, Freelance, Inversiones, Otros
Moneda: pesos colombianos (COP)

3. Escanear recibos con IA (📷)

El usuario sube una foto o toma una desde la cámara
Se envía a la API de Anthropic como imagen en base64
La IA extrae: fecha, categoría, descripción y monto
Se muestra un formulario de confirmación donde el usuario puede editar antes de guardar
Manejo robusto de errores: reset del input, validación del JSON, limpieza del monto

4. Importar transacciones desde Gmail (📧)

Llama a la API de Anthropic con el MCP de Gmail conectado
Busca correos de los últimos 60 días: pagos, facturas, compras, suscripciones, transferencias
Muestra listado de transacciones encontradas con checkbox para seleccionar cuáles importar
El usuario confirma la importación y quedan registradas en el dashboard

5. Presupuestos por categoría

El usuario define un límite mensual por categoría de gasto
Barra de progreso con color dinámico: verde (<70%), amarillo (70–90%), rojo (>90%)
Muestra monto gastado vs límite y cuánto queda disponible
Alerta visual si se excede el presupuesto

6. Metas de ahorro

Crear metas con: nombre, monto objetivo, monto ya ahorrado, fecha límite
Barra de progreso con porcentaje de avance
Botones rápidos para abonar +50.000, +100.000, +200.000 COP
Indicador de días restantes (cambia a rojo si quedan menos de 30 días)
Badge "✅ Lograda" cuando se alcanza el 100%

7. Gestión de deudas

Registrar deudas con: nombre, saldo actual, cuota mínima mensual, tasa de interés mensual (%)
Cálculo automático de: meses restantes para pagar, intereses totales que se pagarán
Barra de progreso de pago (% del saldo original ya pagado)
Registrar abonos: descuenta del saldo y registra automáticamente como gasto en transacciones
Historial de últimos 4 abonos visible en la tarjeta

8. Historial y comparación entre meses

Vista "Ingresos vs Gastos": gráfica de barras agrupadas por mes
Vista "Ahorro neto": barras verdes/rojas según si el mes fue positivo o negativo
Vista "Categorías": barras apiladas con gastos por categoría por mes
Tabla resumen con: ingresos, gastos, ahorro neto y % de ahorro por mes

9. Calculadora de inversión

Parámetros: capital inicial, tasa de interés, período (meses o años), tipo (compuesto o simple)
Muestra: valor final, capital inicial, intereses ganados
Gráfica de línea con crecimiento del valor total e intereses acumulados
Referencia de tasas típicas en Colombia (CDT, fondos de inversión, cuenta de ahorros)

10. Reporte mensual con IA (🤖)

El usuario selecciona mes y año
Se envían a la API: transacciones del mes, estado de presupuestos, metas y deudas
La IA genera un reporte personalizado con 5 secciones:

📊 Resumen del mes
🏆 Lo que hiciste bien
⚠️ Áreas de mejora
💡 Recomendaciones concretas para el próximo mes
🎯 Estado de metas y deudas



11. Exportar datos

Excel: exporta 4 hojas (Transacciones, Presupuestos, Metas, Deudas) usando SheetJS
PDF: abre ventana de impresión con tabla de transacciones y deudas formateadas


🎨 Diseño

Modo oscuro completo (#0f172a fondo, #1e293b tarjetas)
Paleta de colores: verde (#22c55e) ingresos, rojo (#ef4444) gastos, índigo (#6366f1) acciones
Navegación por pestañas: Dashboard, Presupuestos, Metas, Deudas, Historial, Inversión, Reporte IA
Responsive con grid layouts
Modales para formularios y acciones importantes


🚀 Hacia dónde quiero llevarlo (próximos pasos)
El objetivo es convertir este prototipo en una aplicación web real, multiusuario, donde cada persona tenga su propia cuenta con datos privados. Para eso necesito:

Autenticación — Login con Google usando Supabase Auth
Base de datos — Supabase (PostgreSQL) para persistir todos los datos por usuario: transacciones, presupuestos, metas, deudas
Backend/API segura — Para que la API key de Anthropic no quede expuesta en el frontend (necesaria para escaneo de recibos y reporte IA)
Hosting — Despliegue en Vercel
Stack sugerido: React + Vite, Supabase, Vercel, Anthropic API en servidor

Por favor ayúdame a:

Crear el proyecto base con Vite + React
Configurar Supabase con el esquema de base de datos necesario para todas las funcionalidades
Migrar el código del prototipo a la nueva arquitectura
Implementar autenticación con Google
Asegurarte de que cada usuario solo vea sus propios datos
