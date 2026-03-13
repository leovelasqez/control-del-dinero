import { useState, useMemo } from 'react'
import { Trash2, Pencil, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { formatCOP, CATEGORY_EMOJIS } from '../lib/constants'
import EditTransactionModal from './EditTransactionModal'
import ConfirmDialog from './ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Loader2 } from 'lucide-react'

export default function TransactionTable({
  transactions, totalCount, page, setPage, pageSize,
  filter, setFilter, search, setSearch,
  onDelete, onUpdate, loading, summary
}) {
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const { totalIncome, totalExpenses } = useMemo(() => {
    if (!summary?.current_month) return { totalIncome: 0, totalExpenses: 0 }
    return {
      totalIncome: Number(summary.current_month.income),
      totalExpenses: Number(summary.current_month.expenses)
    }
  }, [summary])

  const handleDelete = (id) => {
    onDelete(id)
    setConfirmDelete(null)
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Transacciones</CardTitle>
            <div className="flex gap-3 mt-1">
              <span className="text-sm font-medium text-green-500">+{formatCOP(totalIncome)}</span>
              <span className="text-sm font-medium text-red-500">-{formatCOP(totalExpenses)}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar transacciones..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 w-[220px] h-8"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="size-3.5 text-muted-foreground" />
              <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v)} size="sm">
                {['todas', 'ingresos', 'gastos'].map(f => (
                  <ToggleGroupItem key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        {search ? 'Sin resultados para la busqueda' : 'No hay transacciones'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap">{new Date(t.date).toLocaleDateString('es-CO')}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === 'ingreso' ? 'default' : 'destructive'} className={t.type === 'ingreso' ? 'bg-green-500/15 text-green-600 hover:bg-green-500/20 border-0' : 'bg-red-500/15 text-red-600 hover:bg-red-500/20 border-0'}>
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="mr-1">{CATEGORY_EMOJIS[t.category] || '📦'}</span>
                          {t.category}
                        </TableCell>
                        <TableCell>{t.account || 'Efectivo'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                        <TableCell className={`font-medium tabular-nums ${t.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === 'ingreso' ? '+' : '-'}{formatCOP(t.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(t)} title="Editar">
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => setConfirmDelete(t)} title="Eliminar">
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalCount > pageSize && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-muted-foreground">
                  {totalCount} transacciones — Pagina {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="size-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {editing && (
        <EditTransactionModal
          transaction={editing}
          onClose={() => setEditing(null)}
          onSave={onUpdate}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar esta transaccion de ${formatCOP(confirmDelete.amount)}?`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Card>
  )
}
