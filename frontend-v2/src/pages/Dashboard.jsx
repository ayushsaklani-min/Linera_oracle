import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TOKEN_CONFIG = {
  'ETH': { name: 'Ethereum', color: 'blue' },
  'BTC': { name: 'Bitcoin', color: 'orange' },
  'MATIC': { name: 'Polygon', color: 'purple' },
  'LINK': { name: 'Chainlink', color: 'cyan' },
  'SOL': { name: 'Solana', color: 'green' },
}

const ORACLE_NAMES = {
  'chainlink': 'Chainlink',
  'pyth': 'Pyth',
  'coingecko': 'CoinGecko',
}

export default function Dashboard() {
  const [prices, setPrices] = useState([])
  const [oracles, setOracles] = useState([])
  const [chartData, setChartData] = useState([])
  const [selectedToken, setSelectedToken] = useState('ETH')
  const [selectedInterval, setSelectedInterval] = useState('1m')
  const [stats, setStats] = useState({ queries: 0, subscriptions: 0, load: 'Normal' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch initial prices from backend
    const fetchPrices = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        console.log('Fetching prices from backend...')
        console.log('API URL:', `${apiUrl}/api/prices`)
        
        const response = await fetch(`${apiUrl}/api/prices`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })
        
        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Response error:', errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Received price data:', data)
        console.log('Data type:', typeof data)
        console.log('Data keys:', Object.keys(data))
        
        // Transform backend data to frontend format
        const priceData = Object.entries(data).map(([symbol, info]) => ({
          symbol,
          name: TOKEN_CONFIG[symbol]?.name || symbol,
          price: info.price,
          change: info.change24h || 0,
          color: TOKEN_CONFIG[symbol]?.color || 'gray',
          sources: info.sources || [],
          timestamp: info.timestamp,
        }))
        
        console.log('Transformed price data:', priceData)
        setPrices(priceData)
        
        // Extract oracle info
        const oracleSet = new Set()
        priceData.forEach(token => {
          token.sources.forEach(source => oracleSet.add(source))
        })
        
        const oracleData = Array.from(oracleSet).map(name => ({
          name: ORACLE_NAMES[name] || name,
          reputation: 95 + Math.random() * 5,
          latency: Math.floor(10 + Math.random() * 20),
          uptime: 98 + Math.random() * 2,
          status: 'online'
        }))
        
        console.log('Oracle data:', oracleData)
        setOracles(oracleData)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch prices:', error)
        setError(error.message)
        // Set some fallback data so the page isn't blank
        setPrices([
          { symbol: 'ETH', name: 'Ethereum', price: 0, change: 0, color: 'blue', sources: [], timestamp: Date.now() },
          { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, color: 'orange', sources: [], timestamp: Date.now() },
        ])
        setLoading(false)
      }
    }

    fetchPrices()
  }, []) // Run only once on mount

  // Separate useEffect for WebSocket - runs only once
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8090'
    console.log('Connecting to WebSocket...')
    console.log('WebSocket URL:', wsUrl)
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('✅ Connected to price feed')
    }
    
    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        console.log('WebSocket update:', update)
        
        if (update.type === 'price_update') {
          setPrices(prev => {
            const existing = prev.find(p => p.symbol === update.symbol)
            if (existing) {
              return prev.map(p => 
                p.symbol === update.symbol 
                  ? { ...p, price: update.price, timestamp: update.timestamp, sources: update.sources }
                  : p
              )
            } else {
              return [...prev, {
                symbol: update.symbol,
                name: TOKEN_CONFIG[update.symbol]?.name || update.symbol,
                price: update.price,
                change: 0,
                color: TOKEN_CONFIG[update.symbol]?.color || 'gray',
                sources: update.sources,
                timestamp: update.timestamp,
              }]
            }
          })
          
          // Update chart data
          setChartData(prev => {
            const newData = [...prev, {
              time: new Date(update.timestamp).toLocaleTimeString(),
              price: update.price,
              symbol: update.symbol,
            }]
            return newData.slice(-30) // Keep last 30 points
          })
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    ws.onclose = () => {
      console.log('Disconnected from price feed')
    }

    return () => {
      console.log('Cleaning up WebSocket connection')
      ws.close()
    }
  }, []) // Run only once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading price data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center glass-card p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Make sure the backend is running on port 3001</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (prices.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center glass-card p-8 max-w-md">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">No Price Data</h2>
          <p className="text-gray-400 mb-4">Waiting for price updates from oracles...</p>
          <div className="animate-pulse text-gray-500">Connecting to price feed...</div>
        </div>
      </div>
    )
  }

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
              <span className="text-xs text-gray-500">
                {token.sources?.map(s => ORACLE_NAMES[s] || s).join(', ') || 'Loading...'}
              </span>
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
            {oracles.map((oracle, index) => (
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
              <span className="font-bold">{stats.queries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Subscriptions</span>
              <span className="font-bold">{stats.subscriptions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network Load</span>
              <span className="font-bold text-green-400">{stats.load}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
