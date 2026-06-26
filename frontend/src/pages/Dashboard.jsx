import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/client'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [agentPerformance, setAgentPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, perfRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/revenue/monthly'),
          api.get('/dashboard/agent-performance').catch(() => ({ data: [] })),
        ])
        setStats(statsRes.data)
        setMonthlyRevenue(revenueRes.data)
        setAgentPerformance(perfRes.data || [])
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={stats?.total_revenue || 0}
          color="bg-green-500/10"
          icon={<svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Revenue This Month"
          value={stats?.this_month_revenue || 0}
          color="bg-blue-500/10"
          icon={<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <StatCard
          title="Outstanding Payments"
          value={stats?.outstanding_payments || 0}
          color="bg-red-500/10"
          icon={<svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
        />
        <StatCard
          title="Active Clients"
          value={stats?.active_clients || 0}
          prefix=""
          color="bg-purple-500/10"
          icon={<svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <StatCard
          title="In Progress"
          value={stats?.in_progress_projects || 0}
          prefix=""
          color="bg-yellow-500/10"
          icon={<svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <h2 className="text-lg font-bold text-white mb-4">Monthly Revenue</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Performance (admin only) */}
        {user?.role === 'admin' && agentPerformance.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Agent Performance</h2>
            <div className="space-y-4">
              {agentPerformance.map((agent, i) => (
                <div key={i} className="border-b border-[#2a2a2a] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{agent.agent_name}</span>
                    <span className="text-[#F59E0B] text-sm font-bold">
                      {(agent.conversion_rate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#9CA3AF]">Calls:</span>
                      <span className="text-white ml-1">{agent.calls_logged}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">Clients:</span>
                      <span className="text-white ml-1">{agent.clients_created}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}