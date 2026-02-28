import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const EXPENSE_CATEGORIES = [
  'Comida', 'Transporte', 'Entretenimiento', 'Salud',
  'Educación', 'Vivienda', 'Ropa', 'Otros'
]

function anthropicProxy(env) {
  return {
    name: 'anthropic-proxy',
    configureServer(server) {
      server.middlewares.use('/api/anthropic', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
        if (!ANTHROPIC_API_KEY) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en .env' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { action, image, mediaType, transactions, budgets, goals, debts, month, year, text, fileName } = JSON.parse(body)

            if (action === 'scan-receipt') {
              const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': ANTHROPIC_API_KEY,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 1024,
                  messages: [{
                    role: 'user',
                    content: [
                      { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
                      { type: 'text', text: `Analiza este recibo/factura y extrae la información en formato JSON exacto:
{
  "date": "YYYY-MM-DD",
  "category": "una de: ${EXPENSE_CATEGORIES.join(', ')}",
  "description": "descripción breve del gasto",
  "amount": número sin formato (solo el número)
}
Solo responde con el JSON, sin texto adicional. La moneda es pesos colombianos (COP).` }
                    ]
                  }]
                })
              })

              const data = await response.json()
              if (!response.ok) throw new Error(data.error?.message || 'Error de Anthropic')
              const text = data.content[0].text
              const jsonMatch = text.match(/\{[^{}]*\}/)
              if (!jsonMatch) throw new Error('No se pudo extraer JSON del recibo')
              let parsed
              try {
                parsed = JSON.parse(jsonMatch[0])
              } catch {
                throw new Error('El JSON extraído del recibo no es válido')
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(parsed))
              return
            }

            if (action === 'monthly-report') {
              const prompt = `Eres un asesor financiero personal. Analiza los datos financieros del mes ${month}/${year} y genera un reporte personalizado.

DATOS:
- Transacciones del mes: ${JSON.stringify(transactions)}
- Presupuestos: ${JSON.stringify(budgets)}
- Metas de ahorro: ${JSON.stringify(goals)}
- Deudas: ${JSON.stringify(debts)}

Genera un reporte con estas 5 secciones (usa emojis en los títulos):
1. 📊 Resumen del mes (ingresos, gastos, balance)
2. 🏆 Lo que hiciste bien
3. ⚠️ Áreas de mejora
4. 💡 Recomendaciones concretas para el próximo mes
5. 🎯 Estado de metas y deudas

Usa moneda COP (pesos colombianos). Sé específico con los números.`

              const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': ANTHROPIC_API_KEY,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 2048,
                  messages: [{ role: 'user', content: prompt }]
                })
              })

              const data = await response.json()
              if (!response.ok) throw new Error(data.error?.message || 'Error de Anthropic')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ report: data.content[0].text }))
              return
            }

            if (action === 'extract-statement') {
              if (!text || text.length < 50) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'El PDF no contiene suficiente texto. Puede ser un documento escaneado como imagen.' }))
                return
              }

              const truncatedText = text.slice(0, 12000)
              const stmtPrompt = `Eres un experto en extractos bancarios colombianos (Bancolombia, Davivienda, BBVA, Nu, Rappi, Scotiabank, etc.).

Analiza el siguiente texto extraído de un PDF de extracto de tarjeta de crédito o crédito bancario y extrae la información en formato JSON exacto:

{
  "bank_name": "nombre del banco",
  "card_last_four": "últimos 4 dígitos de la tarjeta (si aplica)",
  "total_owed": número total a pagar (saldo total),
  "minimum_payment": número pago mínimo,
  "payment_deadline": "YYYY-MM-DD fecha límite de pago",
  "monthly_interest_rate": número tasa de interés mensual (porcentaje),
  "annual_interest_rate": número tasa efectiva anual (porcentaje),
  "period_interest": número intereses cobrados en el periodo,
  "overdue_balance": número saldo en mora (0 si no hay),
  "cash_advances": número avances en efectivo (0 si no hay)
}

REGLAS:
- Solo responde con el JSON, sin texto adicional
- Los montos son en pesos colombianos (COP), sin formato, solo números
- Si un campo no se encuentra, usa null
- Para tasas de interés, extrae el porcentaje numérico (ej: 2.5 para 2.5%)
- El nombre del banco debe ser el nombre comercial (ej: "Bancolombia", "Nu", "Rappi")

NOMBRE DEL ARCHIVO: ${fileName || 'extracto.pdf'}

TEXTO DEL EXTRACTO:
${truncatedText}`

              const stmtResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': ANTHROPIC_API_KEY,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 1024,
                  messages: [{ role: 'user', content: stmtPrompt }]
                })
              })

              const stmtData = await stmtResponse.json()
              if (!stmtResponse.ok) throw new Error(stmtData.error?.message || 'Error de Anthropic')
              const stmtText = stmtData.content[0].text
              const stmtJsonMatch = stmtText.match(/\{[\s\S]*\}/)
              if (!stmtJsonMatch) throw new Error('No se pudo extraer información del extracto')
              let stmtParsed
              try {
                stmtParsed = JSON.parse(stmtJsonMatch[0])
              } catch {
                throw new Error('El JSON extraído del extracto no es válido')
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(stmtParsed))
              return
            }

            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Acción no válida' }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), anthropicProxy(env)],
    server: {
      allowedHosts: ['.ngrok-free.dev']
    }
  }
})
