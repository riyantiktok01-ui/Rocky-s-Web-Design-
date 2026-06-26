const statusColors = {
  lead: 'bg-gray-500/20 text-gray-300',
  contacted: 'bg-blue-500/20 text-blue-300',
  meeting_booked: 'bg-yellow-500/20 text-yellow-300',
  proposal_sent: 'bg-orange-500/20 text-orange-300',
  closed_won: 'bg-green-500/20 text-green-300',
  closed_lost: 'bg-red-500/20 text-red-300',
  not_started: 'bg-gray-500/20 text-gray-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  review: 'bg-orange-500/20 text-orange-300',
  done: 'bg-green-500/20 text-green-300',
  draft: 'bg-gray-500/20 text-gray-300',
  sent: 'bg-blue-500/20 text-blue-300',
  paid: 'bg-green-500/20 text-green-300',
  no_answer: 'bg-gray-500/20 text-gray-300',
  not_interested: 'bg-red-500/20 text-red-300',
  callback: 'bg-yellow-500/20 text-yellow-300',
  interested: 'bg-blue-500/20 text-blue-300',
  closed: 'bg-green-500/20 text-green-300',
}

export default function StatusBadge({ status }) {
  const color = statusColors[status] || 'bg-gray-500/20 text-gray-300'
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}