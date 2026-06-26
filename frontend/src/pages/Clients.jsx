import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const initialForm = {
  business_name: '', owner_name: '', phone: '', email: '',
  business_type: '', city: '', contact_method: 'cold_call',
  status: 'lead', notes: '', follow_up_date: '', follow_up_reminder: false,
}

export default function Clients() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients')
      setClients(res.data)
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      follow_up_date: form.follow_up_date ? new Date(form.follow_up_date).toISOString() : null,
    }
    try {
      if (editing) {
        await api.put(`/clients/${editing}`, payload)
        toast.success('Client updated')
      } else {
        await api.post('/clients', payload)
        toast.success('Client created')
      }
      setShowModal(false)
      setEditing(null)
      setForm(initialForm)
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save client')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Client deleted')
      fetchClients()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const openEdit = (client) => {
    setEditing(client.id)
    setForm({
      business_name: client.business_name || '',
      owner_name: client.owner_name || '',
      phone: client.phone || '',
      email: client.email || '',
      business_type: client.business_type || '',
      city: client.city || '',
      contact_method: client.contact_method || 'cold_call',
      status: client.status || 'lead',
      notes: client.notes || '',
      follow_up_date: client.follow_up_date ? client.follow_up_date.split('T')[0] : '',
      follow_up_reminder: client.follow_up_reminder || false,
    })
    setShowModal(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <button
          onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true) }}
          className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg transition-colors"
        >
          + Add Client
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left p-4 text-[#9CA3AF] text-sm font-medium">Business</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm font-medium">Owner</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm font-medium">City</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm font-medium">Status</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm font-medium">Follow Up</th>
                <th className="text-right p-4 text-[#9CA3AF] text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id} className="border-b border-[#2a2a2a] hover:bg-[#222222] cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
                  <td className="p-4 text-white font-medium">{client.business_name}</td>
                  <td className="p-4 text-[#9CA3AF]">{client.owner_name}</td>
                  <td className="p-4 text-[#9CA3AF]">{client.city}</td>
                  <td className="p-4"><StatusBadge status={client.status} /></td>
                  <td className="p-4 text-[#9CA3AF] text-sm">
                    {client.follow_up_date ? new Date(client.follow_up_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(client) }}
                      className="text-[#9CA3AF] hover:text-[#F59E0B] mr-3"
                    >
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id) }} className="text-[#9CA3AF] hover:text-red-400">
                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#9CA3AF]">No clients yet. Add your first client!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Client' : 'Add Client'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Business Name *</label>
                  <input type="text" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Owner Name *</label>
                  <input type="text" value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Phone *</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Business Type</label>
                  <input type="text" value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">City</label>
                  <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Contact Method</label>
                  <select value={form.contact_method} onChange={e => setForm({...form, contact_method: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                    <option value="cold_call">Cold Call</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="social_media">Social Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                    <option value="lead">Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="meeting_booked">Meeting Booked</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Follow Up Date</label>
                  <input type="date" value={form.follow_up_date} onChange={e => setForm({...form, follow_up_date: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-[#9CA3AF] text-sm cursor-pointer">
                    <input type="checkbox" checked={form.follow_up_reminder} onChange={e => setForm({...form, follow_up_reminder: e.target.checked})} className="rounded bg-[#0a0a0a] border-[#2a2a2a]" />
                    Set Follow Up Reminder
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg transition-colors">
                  {editing ? 'Update' : 'Create'} Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}