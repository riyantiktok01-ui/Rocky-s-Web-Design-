import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Invoices() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    client_id: '', project_id: '', line_items: [{ description: '', amount: '' }],
    subtotal: 0, tax: 0, total: 0, status: 'draft'
  })

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices')
      setInvoices(res.data)
    } catch { toast.error('Failed to load invoices')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchInvoices() }, [])

  const openCreate = async () => {
    try {
      const [clientRes, projRes] = await Promise.all([api.get('/clients'), api.get('/projects')])
      setClients(clientRes.data)
      setProjects(projRes.data)
    } catch {}
    setShowModal(true)
  }

  const updateLineItem = (idx, field, value) => {
    const items = [...form.line_items]
    items[idx] = { ...items[idx], [field]: value }
    const subtotal = items.reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
    const tax = subtotal * 0.1
    setForm({ ...form, line_items: items, subtotal, tax, total: subtotal + tax })
  }

  const addLineItem = () => {
    setForm({ ...form, line_items: [...form.line_items, { description: '', amount: '' }] })
  }

  const removeLineItem = (idx) => {
    if (form.line_items.length <= 1) return
    const items = form.line_items.filter((_, i) => i !== idx)
    const subtotal = items.reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
    const tax = subtotal * 0.1
    setForm({ ...form, line_items: items, subtotal, tax, total: subtotal + tax })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const payload = {
      client_id: parseInt(form.client_id),
      project_id: parseInt(form.project_id),
      line_items: form.line_items.map(item => ({
        description: item.description,
        amount: parseFloat(item.amount) || 0
      })),
      subtotal: form.subtotal,
      tax: form.tax,
      total: form.total,
      status: form.status,
    }
    try {
      const res = await api.post('/invoices', payload)
      toast.success('Invoice created')
      setShowModal(false)
      setForm({ client_id: '', project_id: '', line_items: [{ description: '', amount: '' }], subtotal: 0, tax: 0, total: 0, status: 'draft' })
      fetchInvoices()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create invoice')
    }
  }

  const handleDownload = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch { toast.error('Failed to download PDF') }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8 text-center">
        <p className="text-[#9CA3AF]">Invoices are only available to administrators.</p>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">
          + Create Invoice
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Invoice #</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Client</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Total</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Status</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Date</th>
                <th className="text-right p-4 text-[#9CA3AF] text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-[#2a2a2a] hover:bg-[#222222]">
                  <td className="p-4 text-white font-medium">{inv.invoice_number}</td>
                  <td className="p-4 text-[#9CA3AF]">{clients.find(c => c.id === inv.client_id)?.business_name || `#${inv.client_id}`}</td>
                  <td className="p-4 text-[#F59E0B]">${inv.total?.toLocaleString()}</td>
                  <td className="p-4"><StatusBadge status={inv.status} /></td>
                  <td className="p-4 text-[#9CA3AF]">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDownload(inv.id)} className="text-[#F59E0B] hover:text-[#D97706] text-sm font-medium">
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-[#9CA3AF]">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Client *</label>
                  <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Project</label>
                  <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#9CA3AF] mb-2">Line Items</label>
                <div className="space-y-2">
                  {form.line_items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input type="text" placeholder="Description" value={item.description}
                        onChange={e => updateLineItem(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                      <input type="number" step="0.01" placeholder="Amount" value={item.amount}
                        onChange={e => updateLineItem(idx, 'amount', e.target.value)}
                        className="w-32 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                      <button type="button" onClick={() => removeLineItem(idx)} className="text-red-400 hover:text-red-300 p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addLineItem} className="text-[#F59E0B] text-sm hover:text-[#D97706]">
                    + Add item
                  </button>
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between text-[#9CA3AF]"><span>Subtotal</span><span>${form.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-[#9CA3AF]"><span>Tax (10%)</span><span>${form.tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-white font-bold text-base"><span>Total</span><span>${form.total.toFixed(2)}</span></div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}