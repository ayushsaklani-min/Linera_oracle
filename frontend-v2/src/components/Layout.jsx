import { Link, useLocation } from 'react-router-dom'
import { Activity, BarChart3, Bell, CreditCard, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

const navigation = [
  { name: 'Dashboard', path: '/', icon: Activity },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Subscription', path: '/subscription', icon: CreditCard },
  { name: 'API Docs', path: '/api-docs', icon: FileText },
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">SynapseNet</h1>
                <p className="text-xs text-gray-400">Decentralized Oracle Network on Linera</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400">Connected</span>
              </div>
              <div className="text-sm text-gray-400">17ms</div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative"
                >
                  <div
                    className={`
                      flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-all
                      ${isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
