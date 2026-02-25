const API_URL = '/api/anthropic'

export async function scanReceipt(imageBase64, mediaType) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'scan-receipt',
      image: imageBase64,
      mediaType
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error desconocido del servidor')
  }

  return data
}

export async function generateMonthlyReport({ transactions, budgets, goals, debts, month, year }) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'monthly-report',
      transactions,
      budgets,
      goals,
      debts,
      month,
      year
    })
  })

  if (!response.ok) {
    throw new Error('Error al generar reporte')
  }

  return response.json()
}

export async function importFromGmail() {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'import-gmail'
    })
  })

  if (!response.ok) {
    throw new Error('Error al importar desde Gmail')
  }

  return response.json()
}
