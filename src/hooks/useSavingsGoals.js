import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useSavingsGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Error al cargar metas')
      console.error(error)
    } else {
      setGoals(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const addGoal = async (goal) => {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({ ...goal, user_id: user.id })
      .select()
      .single()

    if (error) {
      toast.error('Error al crear meta')
      console.error(error)
      return null
    }
    setGoals(prev => [data, ...prev])
    toast.success('Meta creada')
    return data
  }

  const addToGoal = async (id, amount) => {
    const goal = goals.find(g => g.id === id)
    if (!goal) return null

    const newAmount = Number(goal.current_amount) + amount
    const { data, error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al abonar a meta')
      console.error(error)
      return null
    }
    setGoals(prev => prev.map(g => g.id === id ? data : g))
    toast.success(`+$${amount.toLocaleString()} abonados`)
    return data
  }

  const updateGoal = async (id, updates) => {
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al actualizar meta')
      console.error(error)
      return null
    }
    setGoals(prev => prev.map(g => g.id === id ? data : g))
    toast.success('Meta actualizada')
    return data
  }

  const deleteGoal = async (id) => {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar meta')
      console.error(error)
      return false
    }
    setGoals(prev => prev.filter(g => g.id !== id))
    toast.success('Meta eliminada')
    return true
  }

  return { goals, loading, addGoal, addToGoal, updateGoal, deleteGoal, refetch: fetchGoals }
}
