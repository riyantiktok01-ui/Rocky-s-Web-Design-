import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F59E0B]"></div>
      </div>
    )
  }

  if (!user) {
    window.location.href = '/login'
    return null
  }

  if (adminOnly && user.role !== 'admin') {
    toast.error('Admin access required')
    window.location.href = '/'
    return null
  }

  return children
}