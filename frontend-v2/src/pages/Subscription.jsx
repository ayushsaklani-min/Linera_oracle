import { motion } from 'framer-motion'
import { Rocket, Clock } from 'lucide-react'

export default function Subscription() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="glass-card p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-500/10 mb-6"
          >
            <Rocket className="w-12 h-12 text-blue-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4"
          >
            Subscription Plans
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-400 mb-8"
          >
            Coming Soon
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center space-x-2 text-gray-500"
          >
            <Clock className="w-5 h-5" />
            <span>We're working on flexible pricing plans for you</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <p className="text-sm text-gray-400 mb-4">
              Currently, all features are available for free during the buildathon phase.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                ✓ Unlimited API calls
              </div>
              <div className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                ✓ Real-time updates
              </div>
              <div className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                ✓ All features
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
