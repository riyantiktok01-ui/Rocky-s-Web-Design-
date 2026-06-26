import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      // Error handled in AuthContext
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F59E0B] rounded-2xl mb-4">
            <span className="text-2xl font-bold text-black">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Rocky's Web Design</h1>
          <p className="text-[#9CA3AF] mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-colors"
              placeholder="admin@rockyweb.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}