import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      toast.error('Error al cargar transacciones')
      console.error(error)
    } else {
      setTransactions(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async (transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select()
      .single()

    if (error) {
      toast.error('Error al agregar transacción')
      console.error(error)
      return null
    }
    setTransactions(prev => [data, ...prev])
    toast.success('Transacción agregada')
    return data
  }

  const addMultipleTransactions = async (items) => {
    const rows = items.map(t => ({ ...t, user_id: user.id }))
    const { data, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select()

    if (error) {
      toast.error('Error al importar transacciones')
      console.error(error)
      return null
    }
    setTransactions(prev => [...data, ...prev])
    toast.success(`${data.length} transacciones importadas`)
    return data
  }

  const updateTransaction = async (id, updates) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al actualizar transacción')
      console.error(error)
      return null
    }
    setTransactions(prev => prev.map(t => t.id === id ? data : t))
    toast.success('Transacción actualizada')
    return data
  }

  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar transacción')
      console.error(error)
      return false
    }
    setTransactions(prev => prev.filter(t => t.id !== id))
    toast.success('Transacción eliminada')
    return true
  }

  return { transactions, loading, addTransaction, addMultipleTransactions, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
