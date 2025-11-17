import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { ChainlinkOracle } from "./oracles/chainlink.js";
import { PythOracle } from "./oracles/pyth.js";
import { CoinGeckoOracle } from "./oracles/coingecko.js";
import { PriceAggregator } from "./aggregation/aggregator.js";
import { CandleGenerator } from "./aggregation/candles.js";
import fetch from "node-fetch";

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8090;
const LINERA_RPC = process.env.LINERA_RPC || "http://localhost:8080";

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
    this.setupWebSocket();
    this.startPriceUpdates();
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());

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

    this.app.listen(PORT, () => {
      console.log(`🌐 HTTP API listening on port ${PORT}`);
    });
  }

  setupWebSocket() {
    this.wsServer = new WebSocketServer({ port: WS_PORT });
    console.log(`🌐 WebSocket server on port ${WS_PORT}`);

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
      data: {
        ...aggregated,
        candles: this.candleGenerator.getAllCurrentCandles(token),
      },
    });

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
      const mutation = {
        query: `
          mutation UpdatePriceAggregated(
            $token: String!
            $aggregatedPrice: Float!
            $oracleInputs: [OracleInputInput!]!
            $median: Float!
            $twap: Float!
            $vwap: Float!
            $timestamp: Int!
          ) {
            updatePriceAggregated(
              token: $token
              aggregatedPrice: $aggregatedPrice
              oracleInputs: $oracleInputs
              median: $median
              twap: $twap
              vwap: $vwap
              timestamp: $timestamp
            )
          }
        `,
        variables: {
          token: aggregated.token,
          aggregatedPrice: aggregated.aggregated_price,
          oracleInputs: aggregated.oracle_inputs.map((input) => ({
            source: input.source,
            price: input.price,
            latency: input.latency,
            timestamp: input.timestamp,
          })),
          median: aggregated.median,
          twap: aggregated.twap,
          vwap: aggregated.vwap,
          timestamp: aggregated.timestamp,
        },
      };

      const url = `${LINERA_RPC}/chains/${this.lineraChain}/applications/${this.lineraOracleApp}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation),
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
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
}

// Start the backend
const backend = new SynapseNetBackend();

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  backend.candleGenerator.closeAllCandles();
  process.exit(0);
});
