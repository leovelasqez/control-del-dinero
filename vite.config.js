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
            const { action, image, mediaType, transactions, budgets, goals, debts, month, year } = JSON.parse(body)

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
  }
})
