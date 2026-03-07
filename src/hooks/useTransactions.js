import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const debounceRef = useRef(null)

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // Reset page when filter changes
  useEffect(() => { setPage(1) }, [filter])

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })

    if (filter === 'ingresos') query = query.eq('type', 'ingreso')
    else if (filter === 'gastos') query = query.eq('type', 'gasto')

    if (debouncedSearch.trim()) {
      query = query.or(`description.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`)
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      toast.error('Error al cargar transacciones')
      console.error(error)
    } else {
      setTransactions(data)
      setTotalCount(count)
    }
    setLoading(false)
  }, [user, page, filter, debouncedSearch])

  const fetchSummary = useCallback(async () => {
    if (!user) return
    setSummaryLoading(true)
    const { data, error } = await supabase.rpc('get_dashboard_summary', { p_user_id: user.id })
    if (error) {
      console.error('Error fetching summary:', error)
    } else {
      setSummary(data)
    }
    setSummaryLoading(false)
  }, [user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchTransactions(), fetchSummary()])
  }, [fetchTransactions, fetchSummary])

  const addTransaction = async (transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select()
      .single()

    if (error) {
      toast.error('Error al agregar transaccion')
      console.error(error)
      return null
    }
    toast.success('Transaccion agregada')
    refreshAll()
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
    toast.success(`${data.length} transacciones importadas`)
    refreshAll()
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
      toast.error('Error al actualizar transaccion')
      console.error(error)
      return null
    }
    toast.success('Transaccion actualizada')
    refreshAll()
    return data
  }

  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar transaccion')
      console.error(error)
      return false
    }
    toast.success('Transaccion eliminada')
    refreshAll()
    return true
  }

  const fetchAllForExport = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      toast.error('Error al cargar transacciones para exportar')
      console.error(error)
      return []
    }
    return data
  }

  return {
    transactions,
    totalCount,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    summary,
    summaryLoading,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
    deleteTransaction,
    fetchAllForExport,
    refetch: fetchTransactions,
    refetchSummary: fetchSummary
  }
}
