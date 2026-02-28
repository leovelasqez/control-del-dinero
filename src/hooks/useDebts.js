import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useDebts() {
  const { user } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDebts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('debts')
      .select('*, debt_payments(id, amount, paid_at)')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Error al cargar deudas')
      console.error(error)
    } else {
      setDebts(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  const addDebt = async (debt, rawExtraction, fileName) => {
    const insertData = {
      user_id: user.id,
      name: debt.name,
      original_amount: debt.original_amount,
      current_balance: debt.current_balance ?? debt.original_amount,
      minimum_payment: debt.minimum_payment || 0,
      interest_rate: debt.interest_rate || 0
    }

    // Campos opcionales de extracto
    if (debt.bank_name) insertData.bank_name = debt.bank_name
    if (debt.card_last_four) insertData.card_last_four = debt.card_last_four
    if (debt.annual_interest_rate) insertData.annual_interest_rate = debt.annual_interest_rate
    if (debt.payment_deadline) insertData.payment_deadline = debt.payment_deadline
    if (debt.period_interest) insertData.period_interest = debt.period_interest
    if (debt.overdue_balance) insertData.overdue_balance = debt.overdue_balance
    if (debt.cash_advances) insertData.cash_advances = debt.cash_advances
    if (debt.source) insertData.source = debt.source

    const { data, error } = await supabase
      .from('debts')
      .insert(insertData)
      .select('*, debt_payments(id, amount, paid_at)')
      .single()

    if (error) {
      toast.error('Error al crear deuda')
      console.error(error)
      return null
    }

    // Guardar historial de extracción (no bloqueante)
    if (rawExtraction) {
      supabase.from('statement_extractions').insert({
        user_id: user.id,
        debt_id: data.id,
        file_name: fileName || null,
        bank_name: rawExtraction.bank_name,
        card_last_four: rawExtraction.card_last_four,
        total_owed: rawExtraction.total_owed,
        minimum_payment: rawExtraction.minimum_payment,
        payment_deadline: rawExtraction.payment_deadline,
        monthly_interest_rate: rawExtraction.monthly_interest_rate,
        annual_interest_rate: rawExtraction.annual_interest_rate,
        period_interest: rawExtraction.period_interest,
        overdue_balance: rawExtraction.overdue_balance,
        cash_advances: rawExtraction.cash_advances,
        raw_extraction: rawExtraction
      }).then(({ error: extError }) => {
        if (extError) console.error('Error guardando historial de extracción:', extError)
      })
    }

    setDebts(prev => [data, ...prev])
    toast.success('Deuda registrada')
    return data
  }

  const payDebt = async (debtId, amount) => {
    const debt = debts.find(d => d.id === debtId)
    if (!debt) return null

    const newBalance = Math.max(0, Number(debt.current_balance) - amount)

    const { error: paymentError } = await supabase
      .from('debt_payments')
      .insert({ debt_id: debtId, user_id: user.id, amount })

    if (paymentError) {
      toast.error('Error al registrar abono')
      console.error(paymentError)
      return null
    }

    const { error: updateError } = await supabase
      .from('debts')
      .update({ current_balance: newBalance })
      .eq('id', debtId)

    if (updateError) {
      toast.error('Error al actualizar deuda')
      console.error(updateError)
      return null
    }

    await fetchDebts()
    toast.success(`Abono de $${amount.toLocaleString()} registrado`)
    return true
  }

  const updateDebt = async (id, updates) => {
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .select('*, debt_payments(id, amount, paid_at)')
      .single()

    if (error) {
      toast.error('Error al actualizar deuda')
      console.error(error)
      return null
    }
    setDebts(prev => prev.map(d => d.id === id ? data : d))
    toast.success('Deuda actualizada')
    return data
  }

  const deleteDebt = async (id) => {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar deuda')
      console.error(error)
      return false
    }
    setDebts(prev => prev.filter(d => d.id !== id))
    toast.success('Deuda eliminada')
    return true
  }

  return { debts, loading, addDebt, payDebt, updateDebt, deleteDebt, refetch: fetchDebts }
}
