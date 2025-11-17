import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Bell } from 'lucide-react'

const ACTIVE_ALERTS = [
  { id: 1, token: 'ETH', condition: 'above', value: 3500, active: true, created: '2 hours ago' },
  { id: 2, token: 'BTC', condition: 'below', value: 65000, active: false, created: '1 day ago' },
]

const TRIGGERED_ALERTS = [
  { id: 1, token: 'ETH', condition: 'above', value: 3500, price: 3523.45, time: '2 hours ago', status: 'active' },
  { id: 2, token: 'BTC', condition: 'below', value: 65000, price: 64850.23, time: '1 day ago', status: 'triggered' },
]

export default function Alerts() {
  const [alerts, setAlerts] = useState(ACTIVE_ALERTS)
  const [newAlert, setNewAlert] = useState({
    token: 'ETH',
    condition: 'above',
    value: '',
  })

  const handleCreateAlert = (e) => {
    e.preventDefault()
    if (!newAlert.value) return

    const alert = {
      id: Date.now(),
      token: newAlert.token,
      condition: newAlert.condition,
      value: parseFloat(newAlert.value),
      active: true,
      created: 'Just now',
    }

    setAlerts([...alerts, alert])
    setNewAlert({ token: 'ETH', condition: 'above', value: '' })
  }

  const handleDeleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold">Alerts</h1>
        <p className="text-gray-400 mt-1">Create and manage price alerts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Alert Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Plus className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Create Price Alert</h2>
          </div>

          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Token
              </label>
              <select
                value={newAlert.token}
                onChange={(e) => setNewAlert({ ...newAlert, token: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="ETH">ETH - Ethereum</option>
                <option value="BTC">BTC - Bitcoin</option>
                <option value="SOL">SOL - Solana</option>
                <option value="MATIC">MATIC - Polygon</option>
                <option value="LINK">LINK - Chainlink</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Condition
              </label>
              <select
                value={newAlert.condition}
                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="above">Price goes above</option>
                <option value="below">Price goes below</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Target Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={newAlert.value}
                onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                placeholder="Enter price"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Alert</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">How it works:</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Alerts are stored on the Linera microchain</li>
              <li>• Alerts checked on every price update</li>
              <li>• Instant notifications via WebSocket</li>
              <li>• Optional: Telegram/Email integration</li>
            </ul>
          </div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold">Active Alerts</h2>
            </div>
            <span className="text-sm px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {alerts.length} active
            </span>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active alerts</p>
                <p className="text-sm text-gray-500 mt-1">Create your first alert to get started</p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-bold text-lg">{alert.token}</span>
                        <span className="text-sm text-gray-400">{alert.condition}</span>
                        <span className="font-bold">${alert.value.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500">Created {alert.created}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Triggered Alerts History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold mb-6">Triggered Alerts</h2>

        <div className="space-y-3">
          {TRIGGERED_ALERTS.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-4 rounded-xl bg-white/5 border-l-4 border-yellow-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold">{alert.token}</span>
                      <span className="text-sm text-gray-400">went {alert.condition}</span>
                      <span className="font-bold">${alert.value.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Current price: <span className="font-medium">${alert.price.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`
                    text-xs px-3 py-1 rounded-full
                    ${alert.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }
                  `}>
                    {alert.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">{alert.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
