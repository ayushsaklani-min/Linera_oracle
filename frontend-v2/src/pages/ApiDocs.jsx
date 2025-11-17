import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Code, Zap, Key } from 'lucide-react'

const CODE_EXAMPLES = {
  rest: {
    curl: `curl -X GET "https://api.synapsenet.io/v1/price/ETH" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    javascript: `const response = await fetch('https://api.synapsenet.io/v1/price/ETH', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.get(
    'https://api.synapsenet.io/v1/price/ETH',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
data = response.json()
print(data)`,
  },
  websocket: {
    javascript: `const ws = new WebSocket('wss://ws.synapsenet.io');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    tokens: ['ETH', 'BTC']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Price update:', data);
};`,
    python: `import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print('Price update:', data)

ws = websocket.WebSocketApp(
    'wss://ws.synapsenet.io',
    on_message=on_message
)
ws.run_forever()`,
  },
  candles: {
    curl: `curl -X GET "https://api.synapsenet.io/v1/candles/ETH?interval=1m&limit=100" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    javascript: `const response = await fetch(
  'https://api.synapsenet.io/v1/candles/ETH?interval=1m&limit=100',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);
const candles = await response.json();`,
  },
}

export default function ApiDocs() {
  const [copiedCode, setCopiedCode] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [apiKey, setApiKey] = useState('sk_live_...')

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const generateApiKey = () => {
    const key = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setApiKey(key)
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-gray-400 mt-1">Integrate SynapseNet oracle data into your application</p>
      </div>

      {/* API Key Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Key className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold">API Key</h2>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={apiKey}
            readOnly
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 font-mono text-sm"
          />
          <button
            onClick={generateApiKey}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
          >
            Generate New Key
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-3">
          Keep your API key secure. Do not share it publicly or commit it to version control.
        </p>
      </motion.div>

      {/* REST API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Code className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold">REST API</h2>
        </div>

        {/* Endpoint */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Get Latest Price</h3>
          <div className="p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-sm">
            <span className="text-green-400">GET</span> /api/v1/price/:token
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex space-x-2 mb-4">
          {['curl', 'javascript', 'python'].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedLanguage === lang
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="relative">
          <pre className="p-4 rounded-lg bg-black/40 border border-white/10 overflow-x-auto">
            <code className="text-sm text-gray-300">
              {CODE_EXAMPLES.rest[selectedLanguage]}
            </code>
          </pre>
          <button
            onClick={() => copyToClipboard(CODE_EXAMPLES.rest[selectedLanguage], 'rest')}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {copiedCode === 'rest' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Response Example */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3">Response</h4>
          <pre className="p-4 rounded-lg bg-black/40 border border-white/10 overflow-x-auto">
            <code className="text-sm text-gray-300">
{`{
  "token": "ETH",
  "aggregated_price": 3237.45,
  "median": 3235.12,
  "twap": 3240.89,
  "vwap": 3238.67,
  "oracle_inputs": [
    {
      "source": "Chainlink",
      "price": 3235.12,
      "latency": 18
    },
    {
      "source": "Pyth",
      "price": 3239.78,
      "latency": 24
    }
  ],
  "timestamp": 1700000000000
}`}
            </code>
          </pre>
        </div>
      </motion.div>

      {/* WebSocket API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-bold">WebSocket API</h2>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Real-time Price Updates</h3>
          <div className="p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-sm">
            wss://ws.synapsenet.io
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          {['javascript', 'python'].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedLanguage === lang
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="p-4 rounded-lg bg-black/40 border border-white/10 overflow-x-auto">
            <code className="text-sm text-gray-300">
              {CODE_EXAMPLES.websocket[selectedLanguage]}
            </code>
          </pre>
          <button
            onClick={() => copyToClipboard(CODE_EXAMPLES.websocket[selectedLanguage], 'ws')}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {copiedCode === 'ws' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </motion.div>

      {/* OHLC Candles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold mb-6">OHLC Candlestick Data</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Get Candles</h3>
          <div className="p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-sm">
            <span className="text-green-400">GET</span> /api/v1/candles/:token?interval=1m&limit=100
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-lg bg-black/40 border border-white/10 overflow-x-auto">
            <code className="text-sm text-gray-300">
              {CODE_EXAMPLES.candles.javascript}
            </code>
          </pre>
          <button
            onClick={() => copyToClipboard(CODE_EXAMPLES.candles.javascript, 'candles')}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {copiedCode === 'candles' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/5">
            <h4 className="text-sm font-semibold mb-2">Intervals</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 1s - 1 second</li>
              <li>• 1m - 1 minute</li>
              <li>• 1h - 1 hour</li>
              <li>• 24h - 24 hours</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <h4 className="text-sm font-semibold mb-2">Rate Limits</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Free: 1,000/day</li>
              <li>• Pro: 100,000/day</li>
              <li>• Enterprise: Unlimited</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
