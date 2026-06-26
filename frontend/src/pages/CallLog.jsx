import { useState, useEffect } from 'react'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const outcomes = ['no_answer', 'not_interested', 'callback', 'interested', 'closed']

export default function CallLog() {
  const { user } = useAuth()
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, conversion: 0 })
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ business_name: '', phone: '', outcome: 'callback', notes: '' })

  const fetchCalls = async () => {
    try {
      const res = await api.get('/call-logs')
      setCalls(res.data)
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
      
      const todayCalls = res.data.filter(c => new Date(c.date).toISOString().split('T')[0] === today)
      const weekCalls = res.data.filter(c => new Date(c.date).toISOString() >= weekAgo)
      const monthCalls = res.data.filter(c => new Date(c.date).toISOString() >= monthAgo)
      const totalCalls = res.data.length
      const converted = res.data.filter(c => c.outcome === 'closed' || c.outcome === 'interested').length
      
      setStats({
        today: todayCalls.length,
        week: weekCalls.length,
        month: monthCalls.length,
        conversion: totalCalls > 0 ? Math.round((converted / totalCalls) * 100) : 0,
      })
    } catch { toast.error('Failed to load call logs')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCalls() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/call-logs/${editing}`, form)
        toast.success('Call log updated')
      } else {
        await api.post('/call-logs', form)
        toast.success('Call logged')
      }
      setShowModal(false); setEditing(null); setForm({ business_name: '', phone: '', outcome: 'callback', notes: '' })
      fetchCalls()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save') }
  }

  const openEdit = (call) => {
    setEditing(call.id)
    setForm({ business_name: call.business_name, phone: call.phone, outcome: call.outcome, notes: call.notes || '' })
    setShowModal(true)
  }

  if (loading) return <LoadingSpinner />

  const filteredCalls = user?.role === 'admin' ? calls : calls

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Call Log</h1>
        <button onClick={() => { setEditing(null); setForm({ business_name: '', phone: '', outcome: 'callback', notes: '' }); setShowModal(true) }}
          className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">
          + Log Call
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
          <p className="text-[#9CA3AF] text-sm">Today</p>
          <p className="text-2xl font-bold text-white">{stats.today}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
          <p className="text-[#9CA3AF] text-sm">This Week</p>
          <p className="text-2xl font-bold text-white">{stats.week}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
          <p className="text-[#9CA3AF] text-sm">This Month</p>
          <p className="text-2xl font-bold text-white">{stats.month}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
          <p className="text-[#9CA3AF] text-sm">Conversion Rate</p>
          <p className="text-2xl font-bold text-[#F59E0B]">{stats.conversion}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Business</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Phone</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Date</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Outcome</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Notes</th>
                <th className="text-left p-4 text-[#9CA3AF] text-sm">Logged By</th>
                <th className="text-right p-4 text-[#9CA3AF] text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map(call => (
                <tr key={call.id} className="border-b border-[#2a2a2a] hover:bg-[#222222]">
                  <td className="p-4 text-white font-medium">{call.business_name}</td>
                  <td className="p-4 text-[#9CA3AF]">{call.phone}</td>
                  <td className="p-4 text-[#9CA3AF] text-sm">{new Date(call.date).toLocaleDateString()}</td>
                  <td className="p-4"><StatusBadge status={call.outcome} /></td>
                  <td className="p-4 text-[#9CA3AF] text-sm max-w-xs truncate">{call.notes}</td>
                  <td className="p-4 text-[#9CA3AF] text-sm">{call.logged_by_name || `User #${call.logged_by}`}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEdit(call)} className="text-[#9CA3AF] hover:text-[#F59E0B]">
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCalls.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-[#9CA3AF]">No calls logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-lg">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Call Log' : 'Log New Call'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Business Name *</label>
                <input type="text" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Phone *</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Outcome</label>
                <select value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                  {outcomes.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">
                  {editing ? 'Update' : 'Log'} Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}