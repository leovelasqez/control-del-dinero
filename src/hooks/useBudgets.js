import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useBudgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [spentByCategory, setSpentByCategory] = useState({})
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())

  const fetchBudgets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', selectedMonth)
      .order('category')
      .order('subcategory')

    if (error) {
      toast.error('Error al cargar presupuestos')
      console.error(error)
    } else {
      setBudgets(data)
    }
    setLoading(false)
  }, [user, selectedMonth])

  const fetchSpent = useCallback(async () => {
    if (!user) return
    const now = new Date()
    const [year, month] = selectedMonth.split('-')
    const startDate = `${year}-${month}-01`
    const nextMonth = Number(month) === 12
      ? `${Number(year) + 1}-01-01`
      : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`

    const { data, error } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('type', 'gasto')
      .gte('date', startDate)
      .lt('date', nextMonth)

    if (error) {
      console.error('Error fetching spent:', error)
      return
    }

    const spent = {}
    data.forEach(t => {
      spent[t.category] = (spent[t.category] || 0) + Number(t.amount)
    })
    setSpentByCategory(spent)
  }, [user, selectedMonth])

  useEffect(() => {
    fetchBudgets()
    fetchSpent()
  }, [fetchBudgets, fetchSpent])

  const groupedBudgets = useMemo(() => {
    const groups = {}
    budgets.forEach(b => {
      if (!groups[b.category]) groups[b.category] = []
      groups[b.category].push(b)
    })
    return groups
  }, [budgets])

  const addBudgetItem = async (category, subcategory, amount) => {
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        month: selectedMonth,
        category,
        subcategory: subcategory || null,
        amount
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al agregar item')
      console.error(error)
      return null
    }
    setBudgets(prev => [...prev, data].sort((a, b) => a.category.localeCompare(b.category)))
    toast.success('Item agregado')
    return data
  }

  const updateBudgetItem = async (id, updates) => {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al actualizar')
      console.error(error)
      return null
    }
    setBudgets(prev => prev.map(b => b.id === id ? data : b))
    toast.success('Actualizado')
    return data
  }

  const deleteBudgetItem = async (id) => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar')
      console.error(error)
      return false
    }
    setBudgets(prev => prev.filter(b => b.id !== id))
    toast.success('Eliminado')
    return true
  }

  const deleteCategory = async (categoryName) => {
    const ids = budgets.filter(b => b.category === categoryName).map(b => b.id)
    if (ids.length === 0) return false

    const { error } = await supabase
      .from('budgets')
      .delete()
      .in('id', ids)

    if (error) {
      toast.error('Error al eliminar categoria')
      console.error(error)
      return false
    }
    setBudgets(prev => prev.filter(b => b.category !== categoryName))
    toast.success('Categoria eliminada')
    return true
  }

  const duplicateMonth = async (sourceMonth, targetMonth) => {
    const { data: sourceItems, error: fetchError } = await supabase
      .from('budgets')
      .select('category, subcategory, amount')
      .eq('user_id', user.id)
      .eq('month', sourceMonth)

    if (fetchError || !sourceItems || sourceItems.length === 0) {
      toast.error('No hay presupuesto para duplicar en ese mes')
      return false
    }

    const newItems = sourceItems.map(item => ({
      user_id: user.id,
      month: targetMonth,
      category: item.category,
      subcategory: item.subcategory,
      amount: item.amount
    }))

    const { error: insertError } = await supabase
      .from('budgets')
      .insert(newItems)

    if (insertError) {
      toast.error('Error al duplicar. ¿Ya existe un presupuesto en ese mes?')
      console.error(insertError)
      return false
    }

    toast.success(`Presupuesto duplicado a ${targetMonth}`)
    if (targetMonth === selectedMonth) fetchBudgets()
    return true
  }

  const getAvailableMonths = useCallback(async () => {
    if (!user) return []
    const { data, error } = await supabase
      .from('budgets')
      .select('month')
      .eq('user_id', user.id)

    if (error) return []
    const unique = [...new Set(data.map(d => d.month))].sort().reverse()
    return unique
  }, [user])

  return {
    budgets,
    groupedBudgets,
    loading,
    spentByCategory,
    selectedMonth,
    setSelectedMonth,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    deleteCategory,
    duplicateMonth,
    getAvailableMonths,
    refetch: fetchBudgets,
    refetchSpent: fetchSpent
  }
}
