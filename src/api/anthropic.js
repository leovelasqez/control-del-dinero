import { fetchWithRetry } from '../lib/fetchWithRetry'
import { supabase } from '../lib/supabase'

const API_URL = '/api/anthropic'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

export async function scanReceipt(imageBase64, mediaType) {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'scan-receipt',
      image: imageBase64,
      mediaType
    })
  }, {
    maxRetries: 2,
    timeout: 30000,
    initialDelay: 1500
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error desconocido del servidor')
  }

  return data
}

export async function generateMonthlyReport({ transactionSummary, budgets, goals, debts, month, year }) {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'monthly-report',
      transactionSummary,
      budgets,
      goals,
      debts,
      month,
      year
    })
  }, {
    maxRetries: 3,
    timeout: 60000,
    initialDelay: 2000
  })

  if (!response.ok) {
    throw new Error('Error al generar reporte')
  }

  return response.json()
}

export async function extractStatement(text, fileName) {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'extract-statement',
      text,
      fileName
    })
  }, {
    maxRetries: 3,
    timeout: 30000,
    initialDelay: 1000
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error al analizar el extracto')
  }

  return data
}

export async function importFromGmail() {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'import-gmail'
    })
  }, {
    maxRetries: 1,
    timeout: 15000
  })

  if (!response.ok) {
    throw new Error('Error al importar desde Gmail')
  }

  return response.json()
}
