// Vercel Serverless Function - Proxy seguro para Anthropic API
// La API key nunca se expone al frontend

const EXPENSE_CATEGORIES = [
  'Comida', 'Transporte', 'Entretenimiento', 'Salud',
  'Educación', 'Vivienda', 'Ropa', 'Otros'
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada en el servidor' })
  }

  const { action, image, mediaType, transactions, budgets, goals, debts, month, year } = req.body

  try {
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
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: image }
              },
              {
                type: 'text',
                text: `Analiza este recibo/factura y extrae la información en formato JSON exacto:
{
  "date": "YYYY-MM-DD",
  "category": "una de: ${EXPENSE_CATEGORIES.join(', ')}",
  "description": "descripción breve del gasto",
  "amount": número sin formato (solo el número)
}
Solo responde con el JSON, sin texto adicional. La moneda es pesos colombianos (COP).`
              }
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

      return res.status(200).json(parsed)
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

      return res.status(200).json({ report: data.content[0].text })
    }

    if (action === 'import-gmail') {
      return res.status(501).json({
        error: 'La importación desde Gmail requiere MCP y no está disponible en el servidor. Usa esta función desde el cliente con acceso MCP.'
      })
    }

    return res.status(400).json({ error: 'Acción no válida' })
  } catch (error) {
    console.error('Anthropic API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
