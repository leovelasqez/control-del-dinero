import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { MONTHS, formatCOP } from '../lib/constants'
import ConfirmDialog from '../components/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Loader2 } from 'lucide-react'

function MonthNav({ selectedMonth, setSelectedMonth }) {
  const [y, m] = selectedMonth.split('-').map(Number)
  const label = `${MONTHS[m - 1]} ${y}`

  const prev = () => {
    const pm = m === 1 ? 12 : m - 1
    const py = m === 1 ? y - 1 : y
    setSelectedMonth(`${py}-${String(pm).padStart(2, '0')}`)
  }
  const next = () => {
    const nm = m === 12 ? 1 : m + 1
    const ny = m === 12 ? y + 1 : y
    setSelectedMonth(`${ny}-${String(nm).padStart(2, '0')}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" className="size-8" onClick={prev}><ChevronLeft className="size-4" /></Button>
      <span className="font-semibold min-w-[140px] text-center">{label}</span>
      <Button variant="outline" size="icon" className="size-8" onClick={next}><ChevronRight className="size-4" /></Button>
    </div>
  )
}

export default function BudgetsPage({
  groupedBudgets, spentByCategory, loading,
  selectedMonth, setSelectedMonth,
  onAddItem, onUpdateItem, onDeleteItem, onDeleteCategory,
  onDuplicateMonth, getAvailableMonths
}) {
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newSubcategory, setNewSubcategory] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [addingSubTo, setAddingSubTo] = useState(null)
  const [subName, setSubName] = useState('')
  const [subAmount, setSubAmount] = useState('')
  const [editing, setEditing] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editSubcategory, setEditSubcategory] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null)
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [dupTarget, setDupTarget] = useState('')
  const [availableMonths, setAvailableMonths] = useState([])
  const [collapsedCats, setCollapsedCats] = useState({})

  useEffect(() => {
    if (showDuplicate && getAvailableMonths) {
      getAvailableMonths().then(setAvailableMonths)
    }
  }, [showDuplicate, getAvailableMonths])

  const handleAddCategory = (e) => {
    e.preventDefault()
    if (!newCategory.trim() || !newAmount || Number(newAmount) <= 0) return
    onAddItem(newCategory.trim(), newSubcategory.trim() || null, Number(newAmount))
    setNewCategory('')
    setNewSubcategory('')
    setNewAmount('')
    setShowAddCategory(false)
  }

  const handleAddSub = (category) => {
    if (!subName.trim() || !subAmount || Number(subAmount) <= 0) return
    onAddItem(category, subName.trim(), Number(subAmount))
    setSubName('')
    setSubAmount('')
    setAddingSubTo(null)
  }

  const handleSaveEdit = () => {
    if (!editAmount || Number(editAmount) <= 0) return
    const updates = { amount: Number(editAmount) }
    if (editSubcategory !== (editing.subcategory || '')) {
      updates.subcategory = editSubcategory.trim() || null
    }
    onUpdateItem(editing.id, updates)
    setEditing(null)
  }

  const handleDuplicate = () => {
    if (!dupTarget) return
    onDuplicateMonth(selectedMonth, dupTarget)
    setShowDuplicate(false)
    setDupTarget('')
  }

  const getColor = (pct) => {
    if (pct > 90) return '#ef4444'
    if (pct > 70) return '#eab308'
    return '#22c55e'
  }

  const categories = Object.keys(groupedBudgets)
  const totalBudget = Object.values(groupedBudgets).flat().reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0)

  const [cy, cm] = selectedMonth.split('-').map(Number)
  const dupOptions = []
  for (let i = 1; i <= 6; i++) {
    const nm = ((cm - 1 + i) % 12) + 1
    const ny = cy + Math.floor((cm - 1 + i) / 12)
    const val = `${ny}-${String(nm).padStart(2, '0')}`
    dupOptions.push({ value: val, label: `${MONTHS[nm - 1]} ${ny}` })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <MonthNav selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowDuplicate(true)}>
            <Copy className="size-3.5" /> Duplicar mes
          </Button>
          <Button size="sm" className="gap-1" onClick={() => setShowAddCategory(true)}>
            <Plus className="size-3.5" /> Agregar
          </Button>
        </div>
      </div>

      {categories.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div><span className="text-sm text-muted-foreground">Presupuesto total: </span><span className="font-bold">{formatCOP(totalBudget)}</span></div>
              <div><span className="text-sm text-muted-foreground">Gastado: </span><span className={`font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-green-500'}`}>{formatCOP(totalSpent)}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && categories.length === 0 && !showAddCategory && (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">No tienes presupuesto para este mes.</p>
            <p className="text-muted-foreground text-sm mt-2">Crea categorias y subcategorias para planificar tus gastos.</p>
            <div className="flex gap-2 mt-4 justify-center">
              <Button size="sm" className="gap-1" onClick={() => setShowAddCategory(true)}><Plus className="size-3.5" /> Crear presupuesto</Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowDuplicate(true)}><Copy className="size-3.5" /> Duplicar de otro mes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddCategory && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Agregar item al presupuesto</CardTitle>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowAddCategory(false)}><Plus className="size-4 rotate-45" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Input placeholder="Ej: Gastos Fijos" value={newCategory} onChange={e => setNewCategory(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Subcategoria (opcional)</Label>
                  <Input placeholder="Ej: Arriendo" value={newSubcategory} onChange={e => setNewSubcategory(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monto (COP)</Label>
                  <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0" min="1" required />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="submit" size="sm">Guardar</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCategory(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {categories.map(cat => {
        const items = groupedBudgets[cat]
        const catTotal = items.reduce((s, b) => s + Number(b.amount), 0)
        const catSpent = items.reduce((s, b) => {
          const key = b.subcategory || b.category
          return s + (spentByCategory[key] || 0)
        }, 0)
        const catPct = catTotal > 0 ? (catSpent / catTotal) * 100 : 0
        const isOpen = !collapsedCats[cat]

        return (
          <Collapsible key={cat} open={isOpen} onOpenChange={(open) => setCollapsedCats(prev => ({ ...prev, [cat]: !open }))}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 text-left">
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      <div>
                        <div className="font-bold">{cat}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCOP(catSpent)} de {formatCOP(catTotal)} — {catPct.toFixed(0)}%
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => { setAddingSubTo(cat); setSubName(''); setSubAmount('') }} title="Agregar subcategoria">
                      <Plus className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setConfirmDeleteCat(cat)} title="Eliminar categoria">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Progress value={Math.min(catPct, 100)} className="mb-3 h-2" indicatorColor={getColor(catPct)} />

                  {addingSubTo === cat && (
                    <div className="pb-3 mb-3 border-b">
                      <div className="flex gap-2 items-end flex-wrap">
                        <div className="flex-1 min-w-[120px] space-y-1">
                          <Label className="text-xs">Subcategoria</Label>
                          <Input placeholder="Ej: Arriendo" value={subName} onChange={e => setSubName(e.target.value)} />
                        </div>
                        <div className="flex-1 min-w-[100px] space-y-1">
                          <Label className="text-xs">Monto</Label>
                          <Input type="number" placeholder="0" min="1" value={subAmount} onChange={e => setSubAmount(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAddSub(cat)}>Agregar</Button>
                          <Button variant="outline" size="sm" onClick={() => setAddingSubTo(null)}>Cancelar</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {items.map(item => {
                    const key = item.subcategory || item.category
                    const spent = spentByCategory[key] || 0
                    const pct = Number(item.amount) > 0 ? (spent / Number(item.amount)) * 100 : 0
                    const remaining = Number(item.amount) - spent

                    return (
                      <div key={item.id} className="py-2.5 border-b last:border-0">
                        <div className="flex justify-between items-center mb-1.5">
                          <div>
                            <span className="text-sm font-medium">{item.subcategory || '(Sin subcategoria)'}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatCOP(spent)} / {formatCOP(item.amount)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => { setEditing(item); setEditAmount(String(item.amount)); setEditSubcategory(item.subcategory || '') }}>
                              <Pencil className="size-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => setConfirmDelete(item)}>
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={Math.min(pct, 100)} className="h-1" indicatorColor={getColor(pct)} />
                        <div className="flex justify-between mt-1.5">
                          <span className="text-xs" style={{ color: getColor(pct) }}>{pct.toFixed(0)}%</span>
                          <span className={`text-xs ${remaining >= 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
                            {remaining >= 0 ? `${formatCOP(remaining)} restante` : `${formatCOP(Math.abs(remaining))} excedido`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}

      {editing && (
        <Dialog open onOpenChange={(open) => { if (!open) setEditing(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input type="text" value={editing.category} disabled />
              </div>
              <div className="space-y-2">
                <Label>Subcategoria</Label>
                <Input type="text" value={editSubcategory} onChange={e => setEditSubcategory(e.target.value)} placeholder="(Opcional)" />
              </div>
              <div className="space-y-2">
                <Label>Monto (COP)</Label>
                <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} min="1" />
              </div>
              <Button className="w-full" onClick={handleSaveEdit}>Guardar cambios</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showDuplicate && (
        <Dialog open onOpenChange={(open) => { if (!open) setShowDuplicate(false) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Duplicar Presupuesto</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">Copia el presupuesto del mes actual a otro mes.</p>
            <div className="space-y-2">
              <Label>Mes destino</Label>
              <Select value={dupTarget} onValueChange={setDupTarget}>
                <SelectTrigger><SelectValue placeholder="Seleccionar mes..." /></SelectTrigger>
                <SelectContent>
                  {dupOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full mt-4" onClick={handleDuplicate} disabled={!dupTarget}>Duplicar</Button>
          </DialogContent>
        </Dialog>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar "${confirmDelete.subcategory || confirmDelete.category}" del presupuesto?`}
          onConfirm={() => { onDeleteItem(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteCat && (
        <ConfirmDialog
          message={`¿Eliminar toda la categoria "${confirmDeleteCat}" y sus subcategorias?`}
          onConfirm={() => { onDeleteCategory(confirmDeleteCat); setConfirmDeleteCat(null) }}
          onCancel={() => setConfirmDeleteCat(null)}
        />
      )}
    </div>
  )
}
