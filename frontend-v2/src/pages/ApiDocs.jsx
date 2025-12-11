import { motion } from 'framer-motion'
import { Code, Clock, BookOpen } from 'lucide-react'

export default function ApiDocs() {
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
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-500/10 mb-6"
          >
            <Code className="w-12 h-12 text-purple-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4"
          >
            API Documentation
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
            <span>Comprehensive API documentation is being prepared</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <p className="text-sm font-semibold text-gray-300">
                Current API Endpoints Available:
              </p>
            </div>
            
            <div className="space-y-3 text-left max-w-lg mx-auto">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <code className="text-sm text-green-400">GET</code>
                <code className="text-sm text-gray-300 ml-2">/api/prices</code>
                <p className="text-xs text-gray-500 mt-1">Get all token prices</p>
              </div>
              
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <code className="text-sm text-green-400">GET</code>
                <code className="text-sm text-gray-300 ml-2">/api/v1/price/:token</code>
                <p className="text-xs text-gray-500 mt-1">Get specific token price</p>
              </div>
              
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <code className="text-sm text-green-400">GET</code>
                <code className="text-sm text-gray-300 ml-2">/api/analytics</code>
                <p className="text-xs text-gray-500 mt-1">Get network analytics</p>
              </div>
              
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <code className="text-sm text-blue-400">WS</code>
                <code className="text-sm text-gray-300 ml-2">ws://localhost:8090</code>
                <p className="text-xs text-gray-500 mt-1">Real-time price updates</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Full documentation with examples, SDKs, and integration guides coming soon
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
