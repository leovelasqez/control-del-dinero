import { Download, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import { formatCOP } from '../lib/constants'

export default function ExportButtons({ transactions, budgets, goals, debts }) {
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()

    // Transacciones
    const txData = transactions.map(t => ({
      Fecha: t.date,
      Tipo: t.type,
      Categoria: t.category,
      Descripcion: t.description,
      Monto: Number(t.amount)
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), 'Transacciones')

    // Presupuestos
    const budgetData = budgets.map(b => ({
      Categoria: b.category,
      'Limite Mensual': Number(b.monthly_limit)
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgetData), 'Presupuestos')

    // Metas
    const goalData = goals.map(g => ({
      Nombre: g.name,
      'Monto Objetivo': Number(g.target_amount),
      'Monto Actual': Number(g.current_amount),
      'Fecha Limite': g.deadline || 'Sin limite'
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalData), 'Metas')

    // Deudas
    const debtData = debts.map(d => ({
      Nombre: d.name,
      'Monto Original': Number(d.original_amount),
      'Saldo Actual': Number(d.current_balance),
      'Cuota Minima': Number(d.minimum_payment),
      'Tasa Interes': Number(d.interest_rate) + '%'
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(debtData), 'Deudas')

    XLSX.writeFile(wb, 'control-del-dinero.xlsx')
  }

  const exportPDF = () => {
    const printWindow = window.open('', '_blank')
    const html = `
      <!DOCTYPE html>
      <html><head><title>Control del Dinero - Reporte</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        th { background: #f1f5f9; font-weight: 600; }
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        h2 { margin-top: 24px; color: #334155; }
      </style></head><body>
      <h1>Control del Dinero</h1>
      <h2>Transacciones</h2>
      <table>
        <tr><th>Fecha</th><th>Tipo</th><th>Categoria</th><th>Descripcion</th><th>Monto</th></tr>
        ${transactions.map(t => `
          <tr>
            <td>${t.date}</td>
            <td>${t.type}</td>
            <td>${t.category}</td>
            <td>${t.description}</td>
            <td class="${t.type === 'ingreso' ? 'green' : 'red'}">${formatCOP(t.amount)}</td>
          </tr>
        `).join('')}
      </table>
      ${debts.length > 0 ? `
        <h2>Deudas</h2>
        <table>
          <tr><th>Nombre</th><th>Saldo Actual</th><th>Cuota Minima</th><th>Tasa</th></tr>
          ${debts.map(d => `
            <tr>
              <td>${d.name}</td>
              <td class="red">${formatCOP(d.current_balance)}</td>
              <td>${formatCOP(d.minimum_payment)}</td>
              <td>${d.interest_rate}%</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      </body></html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="flex gap-2">
      <button className="btn btn-ghost btn-sm" onClick={exportExcel}>
        <Download size={14} /> Excel
      </button>
      <button className="btn btn-ghost btn-sm" onClick={exportPDF}>
        <FileText size={14} /> PDF
      </button>
    </div>
  )
}
