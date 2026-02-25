import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useBudgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBudgets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('category')

    if (error) {
      toast.error('Error al cargar presupuestos')
      console.error(error)
    } else {
      setBudgets(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const upsertBudget = async (category, monthlyLimit) => {
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        { user_id: user.id, category, monthly_limit: monthlyLimit },
        { onConflict: 'user_id,category' }
      )
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar presupuesto')
      console.error(error)
      return null
    }
    setBudgets(prev => {
      const exists = prev.find(b => b.category === category)
      if (exists) return prev.map(b => b.category === category ? data : b)
      return [...prev, data]
    })
    toast.success('Presupuesto guardado')
    return data
  }

  const updateBudget = async (id, updates) => {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al actualizar presupuesto')
      console.error(error)
      return null
    }
    setBudgets(prev => prev.map(b => b.id === id ? data : b))
    toast.success('Presupuesto actualizado')
    return data
  }

  const deleteBudget = async (id) => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar presupuesto')
      console.error(error)
      return false
    }
    setBudgets(prev => prev.filter(b => b.id !== id))
    toast.success('Presupuesto eliminado')
    return true
  }

  return { budgets, loading, upsertBudget, updateBudget, deleteBudget, refetch: fetchBudgets }
}
