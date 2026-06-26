import { useState, useEffect } from 'react'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const emptyForm = {
  client_id: '', name: '', description: '', price: '',
  deposit_paid: false, final_payment_received: false,
  start_date: '', deadline: '', status: 'not_started'
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const fetchData = async () => {
    try {
      const [projRes, clientRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients'),
      ])
      setProjects(projRes.data)
      setClients(clientRes.data)
    } catch { toast.error('Failed to load data')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      client_id: parseInt(form.client_id),
      price: parseFloat(form.price),
      start_date: new Date(form.start_date).toISOString(),
      deadline: new Date(form.deadline).toISOString(),
    }
    try {
      if (editing) {
        await api.put(`/projects/${editing}`, payload)
        toast.success('Project updated')
      } else {
        await api.post('/projects', payload)
        toast.success('Project created')
      }
      setShowModal(false); setEditing(null); setForm(emptyForm)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted')
      fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const openEdit = (p) => {
    setEditing(p.id)
    setForm({
      client_id: p.client_id.toString(), name: p.name || '',
      description: p.description || '', price: p.price?.toString() || '',
      deposit_paid: p.deposit_paid || false, final_payment_received: p.final_payment_received || false,
      start_date: p.start_date?.split('T')[0] || '', deadline: p.deadline?.split('T')[0] || '',
      status: p.status || 'not_started',
    })
    setShowModal(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true) }}
          className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">
          + Add Project
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Name</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Client</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Price</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Status</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Progress</th>
                <th className="text-right p-4 text-[#9CA3AF] text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const progress = p.status === 'done' ? 100 : p.status === 'review' ? 75 : p.status === 'in_progress' ? 40 : 0
                const client = clients.find(c => c.id === p.client_id)
                return (
                  <tr key={p.id} className="border-b border-[#2a2a2a] hover:bg-[#222222]">
                    <td className="p-4 text-white font-medium">{p.name}</td>
                    <td className="p-4 text-[#9CA3AF]">{client?.business_name || `#${p.client_id}`}</td>
                    <td className="p-4 text-[#F59E0B]">${p.price?.toLocaleString()}</td>
                    <td className="p-4"><StatusBadge status={p.status} /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-[#F59E0B]'}`}
                            style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[#9CA3AF] text-xs">{progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(p)} className="text-[#9CA3AF] hover:text-[#F59E0B] mr-3">
                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(p.id)} className="text-[#9CA3AF] hover:text-red-400">
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {projects.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-[#9CA3AF]">No projects yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Project' : 'Add Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Client *</label>
                <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Project Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Price *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Deadline *</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-[#9CA3AF] text-sm cursor-pointer">
                  <input type="checkbox" checked={form.deposit_paid} onChange={e => setForm({...form, deposit_paid: e.target.checked})} className="rounded bg-[#0a0a0a] border-[#2a2a2a]" />
                  Deposit Paid
                </label>
                <label className="flex items-center gap-2 text-[#9CA3AF] text-sm cursor-pointer">
                  <input type="checkbox" checked={form.final_payment_received} onChange={e => setForm({...form, final_payment_received: e.target.checked})} className="rounded bg-[#0a0a0a] border-[#2a2a2a]" />
                  Final Payment
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">
                  {editing ? 'Update' : 'Create'} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}