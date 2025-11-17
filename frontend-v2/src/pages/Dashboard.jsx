import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', price: 3237.401, change: 2.05, color: 'blue' },
  { symbol: 'BTC', name: 'Bitcoin', price: 68156.085, change: 3.31, color: 'orange' },
  { symbol: 'MATIC', name: 'Polygon', price: 0.883, change: 1.66, color: 'purple' },
  { symbol: 'LINK', name: 'Chainlink', price: 14.423, change: 4.45, color: 'cyan' },
  { symbol: 'SOL', name: 'Solana', price: 98.264, change: 3.13, color: 'green' },
]

const ORACLES = [
  { name: 'Chainlink', reputation: 95.51, latency: 19, uptime: 99.98, status: 'online' },
  { name: 'Pyth', reputation: 97.13, latency: 24, uptime: 98, status: 'online' },
  { name: 'API3', reputation: 91.97, latency: 18, uptime: 90, status: 'online' },
  { name: 'RedStone', reputation: 92.06, latency: 11, uptime: 90, status: 'online' },
]

export default function Dashboard() {
  const [prices, setPrices] = useState(TOKENS)
  const [chartData, setChartData] = useState([])
  const [selectedInterval, setSelectedInterval] = useState('1m')

  useEffect(() => {
    // Generate mock chart data
    const data = []
    for (let i = 0; i < 30; i++) {
      data.push({
        time: `${i}m`,
        price: 3200 + Math.random() * 100,
      })
    }
    setChartData(data)

    // Simulate WebSocket updates
    const interval = setInterval(() => {
      setPrices(prev => prev.map(token => ({
        ...token,
        price: token.price * (1 + (Math.random() - 0.5) * 0.001),
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time oracle network monitoring</p>
        </div>
      </div>

      {/* Token Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {prices.map((token, index) => (
          <motion.div
            key={token.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full bg-${token.color}-500 animate-pulse`} />
                  <span className="text-sm font-medium text-gray-400">{token.symbol}</span>
                </div>
                <h3 className="text-2xl font-bold mt-1 group-hover:text-blue-400 transition-colors">
                  ${token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                </h3>
              </div>
              {token.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Updated just now</span>
              <span className={`font-medium ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
              </span>
            </div>
            
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="text-xs text-gray-500">Chainlink</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">ETH/USD Price Chart</h2>
              <p className="text-sm text-gray-400 mt-1">Real-time OHLC candlestick data</p>
            </div>
            
            <div className="flex space-x-2">
              {['1s', '1m', '1h', '24h'].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSelectedInterval(interval)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${selectedInterval === interval
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }
                  `}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="time" 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-gray-500">Open</p>
              <p className="text-lg font-bold mt-1">$3,263.25</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">High</p>
              <p className="text-lg font-bold text-green-400 mt-1">$3,277.01</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Low</p>
              <p className="text-lg font-bold text-red-400 mt-1">$3,213.32</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Close</p>
              <p className="text-lg font-bold mt-1">$3,231.15</p>
            </div>
          </div>
        </motion.div>

        {/* Oracle Network Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Oracle Network Status</h2>
          </div>

          <div className="space-y-4">
            {ORACLES.map((oracle, index) => (
              <motion.div
                key={oracle.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium">{oracle.name}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    {oracle.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Reputation</span>
                    <span className="font-medium">{oracle.reputation.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Latency</span>
                    <span className="font-medium">{oracle.latency}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Uptime</span>
                    <span className="font-medium">{oracle.uptime}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Queries (24h)</span>
              <span className="font-bold">1,234,567</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Subscriptions</span>
              <span className="font-bold">8,934</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network Load</span>
              <span className="font-bold text-green-400">Normal</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
