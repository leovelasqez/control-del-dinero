export const EXPENSE_CATEGORIES = [
  'Comida', 'Transporte', 'Entretenimiento', 'Salud',
  'Educación', 'Vivienda', 'Ropa', 'Otros'
]

export const INCOME_CATEGORIES = [
  'Salario', 'Freelance', 'Inversiones', 'Otros'
]

export const CATEGORY_COLORS = {
  Comida: '#f97316',
  Transporte: '#3b82f6',
  Entretenimiento: '#a855f7',
  Salud: '#ef4444',
  Educación: '#14b8a6',
  Vivienda: '#eab308',
  Ropa: '#ec4899',
  Otros: '#6b7280',
  Salario: '#22c55e',
  Freelance: '#06b6d4',
  Inversiones: '#8b5cf6'
}

export const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
