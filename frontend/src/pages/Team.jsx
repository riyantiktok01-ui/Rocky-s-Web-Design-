import { useState, useEffect } from 'react'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Team() {
  const [members, setMembers] = useState([])
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'agent' })

  const fetchData = async () => {
    try {
      const [memRes, perfRes] = await Promise.all([
        api.get('/users'),
        api.get('/dashboard/agent-performance').catch(() => ({ data: [] })),
      ])
      setMembers(memRes.data)
      setPerformance(perfRes.data || [])
    } catch { toast.error('Failed to load team data')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users/invite', inviteForm)
      toast.success('Team member added')
      setShowInvite(false)
      setInviteForm({ name: '', email: '', password: '', role: 'agent' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to add member') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <button onClick={() => setShowInvite(true)} className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">
          + Invite Member
        </button>
      </div>

      {/* Team Members */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <h2 className="text-lg font-bold text-white mb-4">Team Members</h2>
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between border-b border-[#2a2a2a] pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center font-bold">
                  {m.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-white font-medium">{m.name}</p>
                  <p className="text-[#9CA3AF] text-sm">{m.email}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium capitalize
                ${m.role === 'admin' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-blue-500/10 text-blue-300'}">
                {m.role}
              </span>
            </div>
          ))}
          {members.length === 0 && <p className="text-[#9CA3AF] text-center py-4">No team members yet.</p>}
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <h2 className="text-lg font-bold text-white mb-4">Agent Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Name</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Calls Made</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Leads Converted</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Clients Won</th>
                <th className="text-left p-3 text-[#9CA3AF] text-sm">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((agent, i) => (
                <tr key={i} className="border-b border-[#2a2a2a]">
                  <td className="p-3 text-white font-medium">{agent.agent_name}</td>
                  <td className="p-3 text-[#9CA3AF]">{agent.calls_logged}</td>
                  <td className="p-3 text-[#9CA3AF]">{agent.clients_created}</td>
                  <td className="p-3 text-[#9CA3AF]">{agent.clients_created}</td>
                  <td className="p-3"><span className="text-[#F59E0B] font-bold">{(agent.conversion_rate * 100).toFixed(0)}%</span></td>
                </tr>
              ))}
              {performance.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-[#9CA3AF]">No performance data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-md">
            <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-[#9CA3AF] hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Name *</label>
                <input type="text" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Email *</label>
                <input type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Password *</label>
                <input type="password" value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} required className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:border-[#F59E0B]">
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333]">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}