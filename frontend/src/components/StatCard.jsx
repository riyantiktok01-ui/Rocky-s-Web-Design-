import { motion } from 'framer-motion'

export default function StatCard({ title, value, icon, color, prefix = '$' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:bg-[#222222] transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#9CA3AF] text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">
            {prefix && prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${color || 'bg-[#F59E0B]/10'}`}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}