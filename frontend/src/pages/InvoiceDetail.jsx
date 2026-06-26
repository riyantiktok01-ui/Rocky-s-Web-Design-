import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/invoices/${id}`)
        setInvoice(res.data)
      } catch { toast.error('Failed to load invoice'); navigate('/invoices') }
      finally { setLoading(false) }
    }
    fetch()
  }, [id])

  const handleDownload = async () => {
    try {
      const res = await api.get(`/invoices/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = `invoice-${id}.pdf`; a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch { toast.error('Failed to download PDF') }
  }

  if (loading) return <LoadingSpinner />
  if (!invoice) return null

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/invoices')} className="text-[#9CA3AF] hover:text-white flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Invoices
      </button>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Rocky's Web Design</h1>
            <p className="text-[#9CA3AF]">Professional Websites for Local Businesses</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-[#F59E0B]">INVOICE</h2>
            <p className="text-[#9CA3AF]">#{invoice.invoice_number}</p>
            <p className="text-[#9CA3AF] text-sm">{new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="border-t border-b border-[#2a2a2a] py-6 mb-6">
          <h3 className="text-sm text-[#9CA3AF] mb-1">BILL TO:</h3>
          <p className="text-white font-medium">{invoice.client_name || `Client #${invoice.client_id}`}</p>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left p-3 text-[#9CA3AF] text-sm">Description</th>
              <th className="text-right p-3 text-[#9CA3AF] text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items?.map((item, idx) => (
              <tr key={idx} className="border-b border-[#2a2a2a]">
                <td className="p-3 text-white">{item.description}</td>
                <td className="p-3 text-right text-white">${item.amount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-right">
          <p className="text-[#9CA3AF]">Subtotal: ${invoice.subtotal?.toFixed(2)}</p>
          <p className="text-[#9CA3AF]">Tax: ${invoice.tax?.toFixed(2)}</p>
          <p className="text-2xl font-bold text-white">Total: ${invoice.total?.toFixed(2)}</p>
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={handleDownload}
            className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold rounded-lg transition-colors">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}