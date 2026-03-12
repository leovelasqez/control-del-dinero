// Vercel Serverless Function - Proxy seguro para Anthropic API
// La API key nunca se expone al frontend

import { createClient } from '@supabase/supabase-js'

const EXPENSE_CATEGORIES = [
  'Comida', 'Transporte', 'Entretenimiento', 'Salud',
  'Educación', 'Vivienda', 'Ropa', 'Otros'
]

const VALID_ACTIONS = ['scan-receipt', 'monthly-report', 'extract-statement', 'import-gmail']
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB in base64 chars (~7.5MB raw)

// Module-scope Supabase client (reused across warm invocations)
let _supabase = null
function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return null
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

async function verifyAuth(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const supabase = getSupabase()
  if (!supabase) return null

  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (error || !user) {
    return null
  }
  return user
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verificar autenticacion del usuario
  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesion para usar esta funcion.' })
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada en el servidor' })
  }

  const { action, image, mediaType, transactionSummary, budgets, goals, debts, month, year, text, fileName } = req.body

  // Validate action
  if (!action || !VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ error: 'Accion no valida' })
  }

  try {
    if (action === 'scan-receipt') {
      // Validate image input
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'Imagen requerida' })
      }
      if (image.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({ error: 'La imagen es demasiado grande' })
      }
      if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
        return res.status(400).json({ error: 'Tipo de imagen no soportado' })
      }

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

      if (!data.content?.[0]?.text) {
        return res.status(502).json({ error: 'Respuesta inesperada de la API' })
      }

      const responseText = data.content[0].text
      const jsonMatch = responseText.match(/\{[^{}]*\}/)
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
      // Validate month/year to prevent injection into prompt
      const safeMonth = Number(month)
      const safeYear = Number(year)
      if (!safeMonth || safeMonth < 1 || safeMonth > 12 || !safeYear || safeYear < 2020 || safeYear > 2100) {
        return res.status(400).json({ error: 'Mes o año invalido' })
      }

      const ts = transactionSummary || {}
      const prompt = `Eres un asesor financiero personal. Analiza los datos financieros del mes ${safeMonth}/${safeYear} y genera un reporte personalizado.

RESUMEN DEL MES:
- Total ingresos: $${ts.totalIncome || 0} COP
- Total gastos: $${ts.totalExpenses || 0} COP
- Balance: $${ts.balance || 0} COP
- Numero de transacciones: ${ts.transactionCount || 0}

INGRESOS POR CATEGORIA:
${JSON.stringify(ts.incomeByCategory || {})}

GASTOS POR CATEGORIA:
${JSON.stringify(ts.expenseByCategory || {})}

TOP 5 GASTOS MAS GRANDES:
${JSON.stringify(ts.topExpenses || [])}

PRESUPUESTOS (categoria, limite mensual, gastado):
${JSON.stringify(budgets || [])}

METAS DE AHORRO:
${JSON.stringify(goals || [])}

DEUDAS:
${JSON.stringify(debts || [])}

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

      if (!data.content?.[0]?.text) {
        return res.status(502).json({ error: 'Respuesta inesperada de la API' })
      }

      return res.status(200).json({ report: data.content[0].text })
    }

    if (action === 'extract-statement') {
      if (!text || typeof text !== 'string' || text.length < 50) {
        return res.status(400).json({ error: 'El PDF no contiene suficiente texto. Puede ser un documento escaneado como imagen.' })
      }

      // Sanitize fileName to prevent prompt injection
      const safeFileName = (fileName || 'extracto.pdf').replace(/[\n\r\t]/g, '').slice(0, 100)

      const truncatedText = text.slice(0, 12000)
      const prompt = `Eres un experto en extractos bancarios colombianos (Bancolombia, Davivienda, BBVA, Nu, Rappi, Scotiabank, etc.).

Analiza el siguiente texto extraído de un PDF de extracto de tarjeta de crédito o crédito bancario y extrae la información en formato JSON exacto:

{
  "bank_name": "nombre del banco",
  "card_last_four": "últimos 4 dígitos de la tarjeta (si aplica)",
  "total_owed": número total a pagar (saldo total de la deuda, incluye compras + intereses + todo),
  "minimum_payment": número pago mínimo requerido,
  "payment_deadline": "YYYY-MM-DD fecha límite de pago",
  "monthly_interest_rate": número tasa de interés mensual (porcentaje),
  "annual_interest_rate": número tasa efectiva anual (porcentaje),
  "period_interest": número intereses cobrados en el periodo actual,
  "overdue_balance": número saldo en mora (SOLO cuotas vencidas/atrasadas, NO el saldo total. Si no hay mora, usa 0),
  "cash_advances": número avances en efectivo (0 si no hay)
}

REGLAS:
- Solo responde con el JSON, sin texto adicional
- Los montos son en pesos colombianos (COP), sin formato, solo números
- Si un campo no se encuentra, usa null
- Para tasas de interés, extrae el porcentaje numérico (ej: 2.5 para 2.5%)
- El nombre del banco debe ser el nombre comercial (ej: "Bancolombia", "Nu", "Rappi")
- IMPORTANTE: "overdue_balance" es SOLO el monto vencido/en mora, NO confundir con el saldo total. Si el extracto no menciona mora explícitamente, usa 0

NOMBRE DEL ARCHIVO: ${safeFileName}

TEXTO DEL EXTRACTO:
${truncatedText}`

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
          temperature: 0,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'Error de Anthropic')

      if (!data.content?.[0]?.text) {
        return res.status(502).json({ error: 'Respuesta inesperada de la API' })
      }

      const responseText = data.content[0].text
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/)
      if (!jsonMatch) throw new Error('No se pudo extraer información del extracto')

      let parsed
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        throw new Error('El JSON extraído del extracto no es válido')
      }

      // Pre-extracción con regex para campos que la IA puede omitir
      const parseAmount = (str) => {
        if (!str) return null
        return Number(str.replace(/\./g, '').replace(',', '.'))
      }

      const moraMatch = text.match(/[Ii]ntereses\s+de\s+mora\s*\$?([\d.,]+)/i)
      if (moraMatch && (!parsed.overdue_balance || parsed.overdue_balance === 0)) {
        const moraAmount = parseAmount(moraMatch[1])
        if (moraAmount && moraAmount > 0) {
          parsed.overdue_balance = moraAmount
        }
      }

      return res.status(200).json(parsed)
    }

    if (action === 'import-gmail') {
      return res.status(501).json({
        error: 'La importación desde Gmail requiere MCP y no está disponible en el servidor. Usa esta función desde el cliente con acceso MCP.'
      })
    }
  } catch (error) {
    console.error('Anthropic API error:', error)
    return res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo.' })
  }
}
