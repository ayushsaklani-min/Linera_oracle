import { motion } from 'framer-motion'
import { Check, Zap, Rocket, Building2 } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: 0,
    icon: Zap,
    features: [
      '10 second updates',
      'Basic price feeds',
      '5 tokens',
      '10 alerts',
      'Community support',
    ],
    limits: {
      updateRate: '10s',
      apiLimit: '1,000/day',
      alerts: '10',
    },
    current: false,
  },
  {
    name: 'Pro',
    price: 49,
    icon: Rocket,
    popular: true,
    features: [
      '1 second updates',
      'All price feeds',
      'Unlimited tokens',
      '100 alerts',
      'Priority support',
      'WebSocket access',
      'Historical data',
    ],
    limits: {
      updateRate: '1s',
      apiLimit: '100,000/day',
      alerts: '100',
    },
    current: true,
  },
  {
    name: 'Enterprise',
    price: 299,
    icon: Building2,
    features: [
      'Sub-second updates',
      'Dedicated oracle node',
      'Custom aggregation',
      'Unlimited alerts',
      '24/7 support',
      'SLA guarantee',
      'White-label API',
      'Custom integrations',
    ],
    limits: {
      updateRate: '<1s',
      apiLimit: 'Unlimited',
      alerts: 'Unlimited',
    },
    current: false,
  },
]

export default function Subscription() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-gray-400 mt-2">Manage your subscription and usage</p>
      </div>

      {/* Current Plan Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Current Plan: Pro</h2>
            <p className="text-sm text-gray-400 mt-1">Manage your subscription and usage</p>
          </div>
          <span className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            Most Popular
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-400 mb-1">API Calls</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">42,891</span>
              <span className="text-sm text-gray-500">of 100,000 requests</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '42.9%' }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-400 mb-1">Active Alerts</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">23</span>
              <span className="text-sm text-gray-500">of 100 alerts</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '23%' }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-400 mb-1">Billing Cycle</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">12 days</span>
              <span className="text-sm text-gray-500">until renewal</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                glass-card p-6 relative
                ${plan.current ? 'ring-2 ring-blue-500' : ''}
                ${plan.popular ? 'scale-105' : ''}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-blue-500 text-white text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-400">/per month</span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Update Rate</span>
                  <span className="font-medium">{plan.limits.updateRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API Limit</span>
                  <span className="font-medium">{plan.limits.apiLimit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Alerts</span>
                  <span className="font-medium">{plan.limits.alerts}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`
                  w-full py-3 rounded-lg font-medium transition-all
                  ${plan.current
                    ? 'bg-white/5 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }
                `}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Custom Solution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-8 text-center"
      >
        <h3 className="text-2xl font-bold mb-2">Need a custom solution?</h3>
        <p className="text-gray-400 mb-6">
          Contact our team for custom oracle infrastructure, dedicated nodes, and enterprise SLAs.
        </p>
        <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all">
          Contact Sales
        </button>
      </motion.div>
    </div>
  )
}
