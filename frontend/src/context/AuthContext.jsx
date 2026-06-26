import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', {
        email: email,
        password: password,
        name: '',
        role: 'agent'
      })
      
      const { access_token } = res.data
      localStorage.setItem('token', access_token)
      
      // Fetch user info
      const userRes = await api.get('/auth/me')
      setUser(userRes.data)
      localStorage.setItem('user', JSON.stringify(userRes.data))
      
      toast.success('Welcome back!')
      return userRes.data
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed'
      toast.error(msg)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
