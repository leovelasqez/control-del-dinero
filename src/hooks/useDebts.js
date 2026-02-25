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

  const addDebt = async (debt) => {
    const { data, error } = await supabase
      .from('debts')
      .insert({
        ...debt,
        user_id: user.id,
        current_balance: debt.original_amount
      })
      .select('*, debt_payments(id, amount, paid_at)')
      .single()

    if (error) {
      toast.error('Error al crear deuda')
      console.error(error)
      return null
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
