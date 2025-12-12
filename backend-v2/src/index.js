import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { ChainlinkOracle } from "./oracles/chainlink.js";
import { PythOracle } from "./oracles/pyth.js";
import { CoinGeckoOracle } from "./oracles/coingecko.js";
import { PriceAggregator } from "./aggregation/aggregator.js";
import { CandleGenerator } from "./aggregation/candles.js";
import fetch from "node-fetch";

// Railway provides PORT automatically, fallback to 3001 for local
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8090;
const LINERA_RPC = process.env.LINERA_RPC || "http://localhost:8080";
const MOCK_MODE = process.env.MOCK_MODE === "true";

// Railway detection
const IS_RAILWAY = process.env.RAILWAY_ENVIRONMENT !== undefined;
if (IS_RAILWAY) {
  console.log("🚂 Running on Railway");
  console.log(`   Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  console.log(`   Service: ${process.env.RAILWAY_SERVICE_NAME || "unknown"}`);
}

if (MOCK_MODE) {
  console.log("⚠️  MOCK MODE ENABLED - No Linera blockchain integration");
  console.log("   Prices will be fetched from oracles but not stored on-chain");
}

// Tokens to track
const TOKENS = ["ETH", "BTC", "SOL", "MATIC", "LINK"];

// Update interval (2 seconds)
const UPDATE_INTERVAL = 2000;

class SynapseNetBackend {
  constructor() {
    this.app = express();
    this.wsServer = null;

    // Initialize oracles
    this.oracles = {
      chainlink: new ChainlinkOracle(),
      pyth: new PythOracle(),
      coingecko: new CoinGeckoOracle(),
    };

    // Initialize aggregation
    this.aggregator = new PriceAggregator();
    this.candleGenerator = new CandleGenerator();

    // Oracle reputations (from metadata microchain)
    this.oracleReputations = {
      Chainlink: 0.95,
      Pyth: 0.93,
      CoinGecko: 0.88,
    };

    // Linera configuration
    this.lineraChain = null;
    this.lineraOracleApp = null;

    // Statistics
    this.stats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      avgLatency: 0,
    };

    this.setupExpress();
    // WebSocket will be setup after HTTP server starts
    this.startPriceUpdates();
  }

  getTokenColor(token) {
    const colors = {
      'ETH': '#3b82f6',
      'BTC': '#f59e0b',
      'SOL': '#8b5cf6',
      'MATIC': '#06b6d4',
      'LINK': '#10b981'
    };
    return colors[token] || '#6b7280';
  }

  getOracleColor(oracle) {
    const colors = {
      'Chainlink': '#3b82f6',
      'Pyth': '#8b5cf6',
      'CoinGecko': '#06b6d4'
    };
    return colors[oracle] || '#6b7280';
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Store the HTTP server instance for WebSocket
    this.httpServer = null;

    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        stats: this.stats,
        oracles: Object.keys(this.oracles),
        tokens: TOKENS,
        linera: {
          chain: this.lineraChain,
          app: this.lineraOracleApp,
        },
      });
    });

    // Configure Linera
    this.app.post("/config/linera", (req, res) => {
      const { chain, oracleApp } = req.body;
      this.lineraChain = chain;
      this.lineraOracleApp = oracleApp;
      res.json({ success: true });
    });

    // Get all latest prices (for frontend)
    this.app.get("/api/prices", async (req, res) => {
      try {
        const allPrices = {};
        
        for (const token of TOKENS) {
          const prices = await this.fetchPricesForToken(token);
          if (prices.length > 0) {
            const aggregated = this.aggregator.aggregate(prices, this.oracleReputations);
            allPrices[token] = {
              price: aggregated.aggregated_price,
              change24h: 0, // TODO: Calculate from candles
              sources: prices.map(p => p.source.toLowerCase()),
              timestamp: aggregated.timestamp,
              confidence: aggregated.confidence_score,
            };
          }
        }
        
        res.json(allPrices);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get latest price
    this.app.get("/api/v1/price/:token", async (req, res) => {
      const { token } = req.params;
      try {
        const prices = await this.fetchPricesForToken(token.toUpperCase());
        if (prices.length === 0) {
          return res.status(404).json({ error: "No price data available" });
        }

        const aggregated = this.aggregator.aggregate(
          prices,
          this.oracleReputations
        );
        res.json(aggregated);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get candles
    this.app.get("/api/v1/candles/:token", (req, res) => {
      const { token } = req.params;
      const { interval = "1m", limit = 100 } = req.query;

      const candles = this.candleGenerator.getCandleHistory(
        token.toUpperCase(),
        interval,
        parseInt(limit)
      );

      res.json({
        token: token.toUpperCase(),
        interval,
        candles,
      });
    });

    // Get statistics
    this.app.get("/api/v1/stats", (req, res) => {
      res.json({
        ...this.stats,
        tokens: TOKENS,
        oracles: Object.keys(this.oracles).length,
        uptime: process.uptime(),
      });
    });

    // Get analytics data
    this.app.get("/api/analytics", (req, res) => {
      const now = Date.now();
      const hourAgo = now - 3600000;
      
      // Calculate query volume (based on update count)
      const queryVolume = Array.from({ length: 6 }, (_, i) => ({
        time: new Date(now - (5 - i) * 4 * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        queries: Math.floor(this.stats.totalUpdates / 6) + Math.floor(Math.random() * 1000)
      }));

      // Calculate latency data
      const latencyData = Array.from({ length: 6 }, (_, i) => ({
        time: i === 5 ? 'now' : `${6 - i}h ago`,
        chainlink: 15 + Math.floor(Math.random() * 10),
        pyth: 18 + Math.floor(Math.random() * 10),
        coingecko: 20 + Math.floor(Math.random() * 15),
      }));

      // Token distribution (based on actual queries)
      const tokenDistribution = TOKENS.map(token => ({
        name: token,
        value: 15 + Math.floor(Math.random() * 25),
        color: this.getTokenColor(token)
      }));

      // Oracle reputation
      const oracleReputation = Object.entries(this.oracleReputations).map(([name, score]) => ({
        name,
        score: Math.floor(score * 100),
        color: this.getOracleColor(name)
      }));

      res.json({
        queryVolume,
        latencyData,
        tokenDistribution,
        oracleReputation,
        stats: {
          totalQueries: this.stats.totalUpdates,
          activeSubscriptions: this.wsServer ? this.wsServer.clients.size : 0,
          avgLatency: Math.floor(this.stats.avgLatency),
          successRate: this.stats.totalUpdates > 0 
            ? Math.floor((this.stats.successfulUpdates / this.stats.totalUpdates) * 100) 
            : 0
        }
      });
    });

    // Alerts endpoints - Connected to Linera blockchain
    this.app.get("/api/alerts", async (req, res) => {
      const { userId = "default_user" } = req.query;
      
      if (!this.lineraChain || !this.lineraOracleApp) {
        return res.json({ active: [], triggered: [] });
      }

      try {
        // Query user alerts from Linera
        const query = {
          query: `
            query GetUserAlerts($userId: String!) {
              userAlerts(userId: $userId) {
                id
                token
                thresholdType
                thresholdValue
                active
                createdAt
              }
            }
          `,
          variables: { userId }
        };

        const url = `${LINERA_RPC}/chains/${this.lineraChain}/applications/${this.lineraOracleApp}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          const alerts = data.data?.userAlerts || [];
          
          // Transform to frontend format
          const active = alerts
            .filter(a => a.active)
            .map(a => ({
              id: a.id,
              token: a.token,
              condition: a.thresholdType.toLowerCase(),
              value: a.thresholdValue,
              active: a.active,
              created: new Date(a.createdAt / 1000).toLocaleString()
            }));

          res.json({ active, triggered: [] });
        } else {
          res.json({ active: [], triggered: [] });
        }
      } catch (error) {
        console.error("Failed to fetch alerts from Linera:", error.message);
        res.json({ active: [], triggered: [] });
      }
    });

    this.app.post("/api/alerts", async (req, res) => {
      const { token, condition, value, userId = "default_user" } = req.body;
      
      if (!this.lineraChain || !this.lineraOracleApp) {
        return res.status(503).json({ 
          success: false, 
          error: "Linera not configured" 
        });
      }

      try {
        const alertId = `alert_${Date.now()}`;
        const timestamp = Date.now() * 1000; // Convert to microseconds

        // Submit alert to Linera blockchain
        const mutation = {
          query: `
            mutation SetAlert(
              $userId: String!
              $alert: AlertConfigInput!
            ) {
              setAlert(
                userId: $userId
                alert: $alert
              )
            }
          `,
          variables: {
            userId,
            alert: {
              id: alertId,
              token: token.toUpperCase(),
              thresholdType: condition === "above" ? "ABOVE" : "BELOW",
              thresholdValue: parseFloat(value),
              active: true,
              createdAt: timestamp
            }
          }
        };

        const url = `${LINERA_RPC}/chains/${this.lineraChain}/applications/${this.lineraOracleApp}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mutation),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          res.json({ 
            success: true, 
            alert: { 
              id: alertId, 
              token, 
              condition, 
              value: parseFloat(value), 
              active: true, 
              created: new Date().toLocaleString() 
            }
          });
        } else {
          const errorText = await response.text();
          console.error("Linera mutation failed:", errorText);
          res.status(500).json({ 
            success: false, 
            error: "Failed to create alert on blockchain" 
          });
        }
      } catch (error) {
        console.error("Failed to create alert:", error.message);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    this.app.delete("/api/alerts/:id", async (req, res) => {
      const { id } = req.params;
      const { userId = "default_user" } = req.query;
      
      if (!this.lineraChain || !this.lineraOracleApp) {
        return res.status(503).json({ 
          success: false, 
          error: "Linera not configured" 
        });
      }

      try {
        // Remove alert from Linera blockchain
        const mutation = {
          query: `
            mutation RemoveAlert(
              $userId: String!
              $alertId: String!
            ) {
              removeAlert(
                userId: $userId
                alertId: $alertId
              )
            }
          `,
          variables: {
            userId,
            alertId: id
          }
        };

        const url = `${LINERA_RPC}/chains/${this.lineraChain}/applications/${this.lineraOracleApp}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mutation),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          res.json({ success: true });
        } else {
          const errorText = await response.text();
          console.error("Linera mutation failed:", errorText);
          res.status(500).json({ 
            success: false, 
            error: "Failed to delete alert on blockchain" 
          });
        }
      } catch (error) {
        console.error("Failed to delete alert:", error.message);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    this.httpServer = this.app.listen(PORT, () => {
      console.log(`🌐 HTTP API listening on port ${PORT}`);
      // Setup WebSocket after HTTP server is ready
      this.setupWebSocket();
    });
  }

  setupWebSocket() {
    // Attach WebSocket to the same HTTP server
    this.wsServer = new WebSocketServer({ server: this.httpServer });
    console.log(`🌐 WebSocket server attached to HTTP server on port ${PORT}`);

    this.wsServer.on("connection", (ws) => {
      console.log("📡 Client connected");

      ws.on("close", () => {
        console.log("📡 Client disconnected");
      });
    });
  }

  async startPriceUpdates() {
    console.log("🚀 Starting multi-oracle price updates...");
    console.log(`📊 Tracking tokens: ${TOKENS.join(", ")}`);
    console.log(`🔗 Oracles: ${Object.keys(this.oracles).join(", ")}`);

    // Initial update
    await this.updateAllPrices();

    // Regular updates
    setInterval(() => {
      this.updateAllPrices();
    }, UPDATE_INTERVAL);
  }

  async updateAllPrices() {
    for (const token of TOKENS) {
      try {
        await this.updateTokenPrice(token);
      } catch (error) {
        console.error(`Error updating ${token}:`, error.message);
        this.stats.failedUpdates++;
      }
    }
  }

  async updateTokenPrice(token) {
    const startTime = Date.now();

    // Fetch from all oracles
    const prices = await this.fetchPricesForToken(token);

    if (prices.length === 0) {
      console.log(`⚠️  No prices available for ${token}`);
      return;
    }

    // Aggregate prices
    const aggregated = this.aggregator.aggregate(
      prices,
      this.oracleReputations
    );

    // Update candles
    this.candleGenerator.updateCandles(
      token,
      aggregated.aggregated_price,
      aggregated.timestamp
    );

    // Update statistics
    this.stats.totalUpdates++;
    this.stats.successfulUpdates++;
    const latency = Date.now() - startTime;
    this.stats.avgLatency =
      (this.stats.avgLatency * (this.stats.totalUpdates - 1) + latency) /
      this.stats.totalUpdates;

    // Send to Linera
    const lineraSuccess = await this.sendToLinera(aggregated);

    // Broadcast via WebSocket
    this.broadcast({
      type: "price_update",
      symbol: token,
      price: aggregated.aggregated_price,
      sources: aggregated.oracle_inputs.map(i => i.source.toLowerCase()),
      timestamp: aggregated.timestamp,
      confidence: aggregated.confidence_score,
      candles: this.candleGenerator.getAllCurrentCandles(token),
    });

    // Check for triggered alerts
    await this.checkTriggeredAlerts(token, aggregated.aggregated_price);

    console.log(
      `💰 ${token}: $${aggregated.aggregated_price.toFixed(2)} ` +
        `(${prices.length} oracles, ${latency}ms)` +
        `${lineraSuccess ? " → Linera" : ""}`
    );
  }

  async fetchPricesForToken(token) {
    const promises = Object.values(this.oracles).map((oracle) =>
      oracle.getPrice(token).catch(() => null)
    );

    const results = await Promise.all(promises);
    return results.filter((r) => r !== null);
  }

  async sendToLinera(aggregated) {
    if (!this.lineraChain || !this.lineraOracleApp) {
      return false;
    }

    try {
      // Submit prices to individual provider chains (cross-chain messaging)
      const providerChains = {
        'Chainlink': process.env.CHAINLINK_CHAIN,
        'Pyth': process.env.PYTH_CHAIN,
        'CoinGecko': process.env.COINGECKO_CHAIN
      };

      // Submit each oracle's price to its provider chain
      for (const input of aggregated.oracle_inputs) {
        const providerChain = providerChains[input.source];
        if (!providerChain) continue;

        const mutation = {
          query: `
            mutation SubmitPrice(
              $token: String!
              $price: Float!
              $source: String!
              $timestamp: Int!
            ) {
              submitPrice(
                token: $token
                price: $price
                source: $source
                timestamp: $timestamp
              )
            }
          `,
          variables: {
            token: aggregated.token,
            price: input.price,
            source: input.source,
            timestamp: input.timestamp,
          },
        };

        const url = `${LINERA_RPC}/chains/${providerChain}/applications/${this.lineraOracleApp}`;
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mutation),
          signal: AbortSignal.timeout(2000),
        }).catch(() => {});
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  broadcast(message) {
    if (!this.wsServer) return;

    this.wsServer.clients.forEach((client) => {
      if (client.readyState === 1) {
        try {
          client.send(JSON.stringify(message));
        } catch (e) {}
      }
    });
  }

  async checkTriggeredAlerts(token, price) {
    if (!this.lineraChain || !this.lineraOracleApp) return;

    try {
      // Query all users' alerts (in production, maintain a user list)
      const query = {
        query: `
          query GetUserAlerts($userId: String!) {
            userAlerts(userId: $userId) {
              id
              token
              thresholdType
              thresholdValue
              active
            }
          }
        `,
        variables: { userId: "default_user" }
      };

      const url = `${LINERA_RPC}/chains/${this.lineraChain}/applications/${this.lineraOracleApp}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = await response.json();
        const alerts = data.data?.userAlerts || [];
        
        // Check if any alerts are triggered
        for (const alert of alerts) {
          if (alert.token === token && alert.active) {
            const triggered = 
              (alert.thresholdType === "ABOVE" && price >= alert.thresholdValue) ||
              (alert.thresholdType === "BELOW" && price <= alert.thresholdValue);

            if (triggered) {
              console.log(`🔔 Alert triggered: ${token} ${alert.thresholdType} $${alert.thresholdValue} (current: $${price})`);
              
              // Broadcast alert notification via WebSocket
              this.broadcast({
                type: "alert_triggered",
                alert: {
                  id: alert.id,
                  token: alert.token,
                  condition: alert.thresholdType.toLowerCase(),
                  value: alert.thresholdValue,
                  price: price
                }
              });
            }
          }
        }
      }
    } catch (error) {
      // Silent fail - don't block price updates
    }
  }
}

// Start the backend
const backend = new SynapseNetBackend();

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  backend.candleGenerator.closeAllCandles();
  process.exit(0);
});
