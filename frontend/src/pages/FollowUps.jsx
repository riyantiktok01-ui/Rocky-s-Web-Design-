import { useState, useEffect } from 'react'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [newDate, setNewDate] = useState('')

  const fetchFollowUps = async () => {
    try {
      const res = await api.get('/follow-ups')
      setFollowUps(res.data)
    } catch { toast.error('Failed to load follow-ups')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchFollowUps() }, [])

  const markDone = async (id) => {
    try {
      await api.put(`/follow-ups/${id}/complete`)
      toast.success('Marked as followed up')
      fetchFollowUps()
    } catch { toast.error('Failed to update') }
  }

  const handleReschedule = async (id) => {
    if (!newDate) return
    try {
      await api.put(`/follow-ups/${id}/reschedule?new_date=${encodeURIComponent(new Date(newDate).toISOString())}`)
      toast.success('Rescheduled')
      setRescheduleId(null)
      setNewDate('')
      fetchFollowUps()
    } catch { toast.error('Failed to reschedule') }
  }

  if (loading) return <LoadingSpinner />

  const today = new Date().toISOString().split('T')[0]
  const dueToday = followUps.filter(fu => !fu.completed && new Date(fu.follow_up_date).toISOString().split('T')[0] === today)
  const upcoming = followUps.filter(fu => !fu.completed && new Date(fu.follow_up_date).toISOString().split('T')[0] > today)
  const completed = followUps.filter(fu => fu.completed)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Follow Ups</h1>

      {/* Due Today */}
      {dueToday.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#F59E0B] mb-3">Due Today ({dueToday.length})</h2>
          <div className="space-y-2">
            {dueToday.map(fu => (
              <div key={fu.id} className="bg-[#1a1a1a] border border-[#F59E0B]/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{fu.client_name || `Client #${fu.client_id}`}</p>
                  <p className="text-[#9CA3AF] text-sm">{fu.notes}</p>
                  <p className="text-[#F59E0B] text-xs">Due: {new Date(fu.follow_up_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => markDone(fu.id)} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/20 transition-colors">
                    ✓ Done
                  </button>
                  <button onClick={() => { setRescheduleId(fu.id); setNewDate('') }} className="px-3 py-1.5 bg-[#2a2a2a] text-[#9CA3AF] rounded-lg text-sm hover:text-white transition-colors">
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Upcoming ({upcoming.length})</h2>
        <div className="space-y-2">
          {upcoming.map(fu => (
            <div key={fu.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{fu.client_name || `Client #${fu.client_id}`}</p>
                <p className="text-[#9CA3AF] text-sm">{fu.notes}</p>
                <p className="text-[#9CA3AF] text-xs">Due: {new Date(fu.follow_up_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => markDone(fu.id)} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/20 transition-colors">
                  ✓ Done
                </button>
                <button onClick={() => { setRescheduleId(fu.id); setNewDate('') }} className="px-3 py-1.5 bg-[#2a2a2a] text-[#9CA3AF] rounded-lg text-sm hover:text-white transition-colors">
                  Reschedule
                </button>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-[#9CA3AF] text-center py-4">No upcoming follow-ups.</p>}
        </div>
      </div>

      {/* Completed */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Completed ({completed.length})</h2>
        <div className="space-y-2">
          {completed.map(fu => (
            <div key={fu.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between opacity-60">
              <div>
                <p className="text-white font-medium">{fu.client_name || `Client #${fu.client_id}`}</p>
                <p className="text-[#9CA3AF] text-sm">{fu.notes}</p>
                <p className="text-green-400 text-xs">Completed: {fu.completed_at ? new Date(fu.completed_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          ))}
          {completed.length === 0 && <p className="text-[#9CA3AF] text-center py-4">No completed follow-ups.</p>}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Reschedule Follow Up</h2>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white mb-4 focus:border-[#F59E0B]" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRescheduleId(null)} className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333]">Cancel</button>
              <button onClick={() => handleReschedule(rescheduleId)} disabled={!newDate} className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg disabled:opacity-50">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}