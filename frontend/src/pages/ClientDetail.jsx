import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [editNotes, setEditNotes] = useState('')
  const [editFollowUp, setEditFollowUp] = useState('')
  const [saving, setSaving] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '', description: '', price: '', deposit_paid: false,
    final_payment_received: false, start_date: '', deadline: '', status: 'not_started'
  })

  const fetchData = async () => {
    try {
      const [clientRes, allProjectsRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get('/projects'),
      ])
      setClient(clientRes.data)
      setProjects(allProjectsRes.data.filter(p => p.client_id === parseInt(id)))
      setEditNotes(clientRes.data.notes || '')
      setEditFollowUp(clientRes.data.follow_up_date ? clientRes.data.follow_up_date.split('T')[0] : '')
    } catch {
      toast.error('Failed to load client')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const saveNotes = async () => {
    setSaving(true)
    try {
      await api.put(`/clients/${id}`, { ...client, notes: editNotes, follow_up_date: editFollowUp ? new Date(editFollowUp).toISOString() : null })
      toast.success('Saved')
      fetchData()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/projects', {
        ...projectForm,
        client_id: parseInt(id),
        price: parseFloat(projectForm.price),
        start_date: new Date(projectForm.start_date).toISOString(),
        deadline: new Date(projectForm.deadline).toISOString(),
      })
      toast.success('Project created')
      setShowProjectModal(false)
      setProjectForm({ name: '', description: '', price: '', deposit_paid: false, final_payment_received: false, start_date: '', deadline: '', status: 'not_started' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create project')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!client) return null

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="text-[#9CA3AF] hover:text-white flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Clients
      </button>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{client.business_name}</h1>
            <p className="text-[#9CA3AF]">{client.owner_name} • {client.city}</p>
          </div>
          <StatusBadge status={client.status} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-[#9CA3AF]">Phone:</span> <span className="text-white">{client.phone}</span></div>
          <div><span className="text-[#9CA3AF]">Email:</span> <span className="text-white">{client.email}</span></div>
          <div><span className="text-[#9CA3AF]">Type:</span> <span className="text-white">{client.business_type}</span></div>
          <div><span className="text-[#9CA3AF]">Contact Method:</span> <span className="text-white capitalize">{client.contact_method?.replace(/_/g, ' ')}</span></div>
          <div><span className="text-[#9CA3AF]">Created:</span> <span className="text-white">{new Date(client.created_at).toLocaleDateString()}</span></div>
        </div>
      </div>

      {/* Notes & Follow Up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <h2 className="text-lg font-bold text-white mb-3">Notes</h2>
          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={5} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white mb-3 focus:border-[#F59E0B]" />
          <button onClick={saveNotes} disabled={saving} className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <h2 className="text-lg font-bold text-white mb-3">Follow Up</h2>
          <input type="date" value={editFollowUp} onChange={e => setEditFollowUp(e.target.value)} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white mb-3 focus:border-[#F59E0B]" />
          <button onClick={saveNotes} disabled={saving} className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg transition-colors disabled:opacity-50">
            Reschedule
          </button>
        </div>
      </div>

      {/* Projects */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Projects</h2>
          <button onClick={() => setShowProjectModal(true)} className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-black text-sm font-bold rounded-lg transition-colors">
            + Add Project
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Name</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Price</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Status</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Deposit</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b border-[#2a2a2a]">
                  <td className="p-3 text-white">{p.name}</td>
                  <td className="p-3 text-[#F59E0B]">${p.price?.toLocaleString()}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3 text-[#9CA3AF]">{p.deposit_paid ? '✅' : '❌'}</td>
                  <td className="p-3 text-[#9CA3AF]">{new Date(p.deadline).toLocaleDateString()}</td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-[#9CA3AF]">No projects yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add Project</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-[#9CA3AF] hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Project Name *</label>
                <input type="text" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Description</label>
                <textarea value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Price *</label>
                  <input type="number" step="0.01" value={projectForm.price} onChange={e => setProjectForm({...projectForm, price: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Status</label>
                  <select value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
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
                  <input type="date" value={projectForm.start_date} onChange={e => setProjectForm({...projectForm, start_date: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Deadline *</label>
                  <input type="date" value={projectForm.deadline} onChange={e => setProjectForm({...projectForm, deadline: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-[#9CA3AF] text-sm cursor-pointer">
                  <input type="checkbox" checked={projectForm.deposit_paid} onChange={e => setProjectForm({...projectForm, deposit_paid: e.target.checked})} className="rounded bg-[#0a0a0a] border-[#2a2a2a]" />
                  Deposit Paid
                </label>
                <label className="flex items-center gap-2 text-[#9CA3AF] text-sm cursor-pointer">
                  <input type="checkbox" checked={projectForm.final_payment_received} onChange={e => setProjectForm({...projectForm, final_payment_received: e.target.checked})} className="rounded bg-[#0a0a0a] border-[#2a2a2a]" />
                  Final Payment Received
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg transition-colors">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}