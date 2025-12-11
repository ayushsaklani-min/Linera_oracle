import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Zap, Users, Activity } from 'lucide-react'

export default function Analytics() {
  const [queryVolumeData, setQueryVolumeData] = useState([])
  const [latencyData, setLatencyData] = useState([])
  const [tokenDistribution, setTokenDistribution] = useState([])
  const [oracleReputation, setOracleReputation] = useState([])
  const [stats, setStats] = useState({
    totalQueries: 0,
    activeSubscriptions: 0,
    avgLatency: 0,
    successRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/analytics')
        const data = await response.json()
        
        setQueryVolumeData(data.queryVolume)
        setLatencyData(data.latencyData)
        setTokenDistribution(data.tokenDistribution)
        setOracleReputation(data.oracleReputation)
        setStats(data.stats)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        setLoading(false)
      }
    }

    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-400 mt-1">Network performance and usage statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Queries (24h)</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalQueries.toLocaleString()}</h3>
              <p className="text-sm text-green-400 mt-2">Success: {stats.successRate}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Latency</p>
              <h3 className="text-3xl font-bold mt-2">{stats.avgLatency}ms</h3>
              <p className="text-sm text-gray-400 mt-2">Oracle response time</p>
            </div>
            <Zap className="w-10 h-10 text-yellow-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Subscriptions</p>
              <h3 className="text-3xl font-bold mt-2">{stats.activeSubscriptions}</h3>
              <p className="text-sm text-gray-400 mt-2">WebSocket connections</p>
            </div>
            <Users className="w-10 h-10 text-purple-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Network Uptime</p>
              <h3 className="text-3xl font-bold mt-2">99.98%</h3>
              <p className="text-sm text-gray-400 mt-2">Last 30 days</p>
            </div>
            <Activity className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Volume Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Query Volume (24h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={queryVolumeData}>
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="queries" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Oracle Latency Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Oracle Latency Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyData}>
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="Chainlink" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Pyth" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="API3" stroke="#06b6d4" strokeWidth={2} />
              <Line type="monotone" dataKey="RedStone" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Token Query Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Token Query Distribution</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tokenDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tokenDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4">
            {tokenDistribution.map((token) => (
              <div key={token.name} className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: token.color }} />
                  <span className="text-sm font-medium">{token.name}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{token.value}%</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Oracle Reputation Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Oracle Reputation Scores</h2>
          <div className="space-y-6">
            {oracleReputation.map((oracle, index) => (
              <div key={oracle.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{oracle.name}</span>
                  <span className="text-sm font-bold">{oracle.score}/100</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${oracle.score}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: oracle.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Accuracy Score</span>
              <span className="font-bold">99.7%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Data Sources</span>
              <span className="font-bold">4 Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Consensus</span>
              <span className="font-bold text-green-400">High</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
