import fetch from "node-fetch";

const COINGECKO_IDS = {
  ETH: "ethereum",
  BTC: "bitcoin",
  SOL: "solana",
  MATIC: "matic-network",
  LINK: "chainlink",
};

export class CoinGeckoOracle {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.name = "CoinGecko";
    this.baseUrl = apiKey
      ? "https://pro-api.coingecko.com/api/v3"
      : "https://api.coingecko.com/api/v3";
  }

  async getPrice(token) {
    const coinId = COINGECKO_IDS[token];
    if (!coinId) {
      throw new Error(`CoinGecko ID not available for ${token}`);
    }

    const startTime = Date.now();
    try {
      const url = `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd`;
      const headers = this.apiKey
        ? { "x-cg-pro-api-key": this.apiKey }
        : {};

      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const price = data[coinId]?.usd;

      if (!price) {
        throw new Error("No price data");
      }

      const latency = Date.now() - startTime;

      return {
        token,
        price,
        source: this.name,
        latency,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`CoinGecko error for ${token}:`, error.message);
      return null;
    }
  }

  async getPrices(tokens) {
    // CoinGecko allows batch requests
    const coinIds = tokens
      .map((t) => COINGECKO_IDS[t])
      .filter(Boolean)
      .join(",");

    if (!coinIds) return [];

    const startTime = Date.now();
    try {
      const url = `${this.baseUrl}/simple/price?ids=${coinIds}&vs_currencies=usd`;
      const headers = this.apiKey
        ? { "x-cg-pro-api-key": this.apiKey }
        : {};

      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return tokens
        .map((token) => {
          const coinId = COINGECKO_IDS[token];
          const price = data[coinId]?.usd;

          if (!price) return null;

          return {
            token,
            price,
            source: this.name,
            latency,
            timestamp: Date.now(),
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error("CoinGecko batch error:", error.message);
      return [];
    }
  }
}
