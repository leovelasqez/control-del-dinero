import { useState } from 'react'
import { Plus, Trash2, Target, Pencil } from 'lucide-react'
import { formatCOP } from '../lib/constants'
import ConfirmDialog from '../components/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export default function GoalsPage({ goals, loading, onAdd, onAddToGoal, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', deadline: '' })
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', target_amount: '', current_amount: '', deadline: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.target_amount) return
    onAdd({
      name: form.name,
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount) || 0,
      deadline: form.deadline || null
    })
    setForm({ name: '', target_amount: '', current_amount: '0', deadline: '' })
    setShowForm(false)
  }

  const handleEdit = (g) => {
    setEditing(g)
    setEditForm({
      name: g.name,
      target_amount: String(g.target_amount),
      current_amount: String(g.current_amount),
      deadline: g.deadline || ''
    })
  }

  const handleSaveEdit = () => {
    if (!editForm.name || !editForm.target_amount) return
    onUpdate(editing.id, {
      name: editForm.name,
      target_amount: Number(editForm.target_amount),
      current_amount: Number(editForm.current_amount) || 0,
      deadline: editForm.deadline || null
    })
    setEditing(null)
  }

  const quickAmounts = [50000, 100000, 200000]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Metas de Ahorro</h2>
        <Button size="sm" className="gap-1" onClick={() => setShowForm(true)}>
          <Plus className="size-3.5" /> Nueva meta
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la meta</Label>
                <Input placeholder="Ej: Vacaciones" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Monto objetivo (COP)</Label>
                  <Input type="number" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })} min="1" required />
                </div>
                <div className="space-y-2">
                  <Label>Ya ahorrado (COP)</Label>
                  <Input type="number" value={form.current_amount} onChange={e => setForm({ ...form, current_amount: e.target.value })} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Fecha limite</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">Crear meta</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && goals.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-10">
            <Target className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tienes metas de ahorro.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(g => {
          const target = Number(g.target_amount)
          const current = Number(g.current_amount)
          const pct = target > 0 ? (current / target) * 100 : 0
          const achieved = pct >= 100

          let daysLeft = null
          if (g.deadline) {
            const diff = new Date(g.deadline) - new Date()
            daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
          }

          return (
            <Card key={g.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{g.name}</span>
                      {achieved && <Badge className="bg-green-500/15 text-green-600 border-0">Lograda</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatCOP(current)} de {formatCOP(target)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => handleEdit(g)} title="Editar">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setConfirmDelete(g)} title="Eliminar">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <Progress value={Math.min(pct, 100)} className="h-2" />

                <div className="flex justify-between mt-2">
                  <span className={`text-xs font-medium ${achieved ? 'text-green-500' : 'text-indigo-500'}`}>
                    {pct.toFixed(0)}%
                  </span>
                  {daysLeft !== null && (
                    <span className={`text-xs ${daysLeft < 30 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Plazo vencido'}
                    </span>
                  )}
                </div>

                {!achieved && (
                  <div className="flex gap-2 mt-4">
                    {quickAmounts.map(amt => (
                      <Button key={amt} variant="outline" size="sm" className="flex-1" onClick={() => onAddToGoal(g.id, amt)}>
                        +{(amt / 1000).toFixed(0)}k
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {editing && (
        <Dialog open onOpenChange={(open) => { if (!open) setEditing(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Meta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la meta</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Monto objetivo (COP)</Label>
                <Input type="number" value={editForm.target_amount} onChange={e => setEditForm({ ...editForm, target_amount: e.target.value })} min="1" required />
              </div>
              <div className="space-y-2">
                <Label>Monto ahorrado (COP)</Label>
                <Input type="number" value={editForm.current_amount} onChange={e => setEditForm({ ...editForm, current_amount: e.target.value })} min="0" />
              </div>
              <div className="space-y-2">
                <Label>Fecha limite</Label>
                <Input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSaveEdit}>Guardar cambios</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar la meta "${confirmDelete.name}"?`}
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
