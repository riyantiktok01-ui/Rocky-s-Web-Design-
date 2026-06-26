import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Projects from './pages/Projects'
import Revenue from './pages/Revenue'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import CallLog from './pages/CallLog'
import FollowUps from './pages/FollowUps'
import Team from './pages/Team'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="call-log" element={<CallLog />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="team" element={
          <ProtectedRoute adminOnly={true}><Team /></ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
