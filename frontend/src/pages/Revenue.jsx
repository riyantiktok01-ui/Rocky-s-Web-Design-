import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/client'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

export default function Revenue() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/revenue/monthly'),
        ])
        setStats(statsRes.data)
        setMonthly(revRes.data)
      } catch (err) {
        console.error('Failed to load revenue data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (user?.role !== 'admin') {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8 text-center">
        <p className="text-[#9CA3AF]">Revenue reports are only available to administrators.</p>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Revenue</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={stats?.total_revenue || 0} color="bg-green-500/10"
          icon={<svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="This Month" value={stats?.this_month_revenue || 0} color="bg-blue-500/10"
          icon={<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <StatCard title="Outstanding" value={stats?.outstanding_payments || 0} color="bg-red-500/10"
          icon={<svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>} />
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <h2 className="text-lg font-bold text-white mb-4">Monthly Revenue</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}