import fetch from "node-fetch";

const PYTH_PRICE_IDS = {
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  SOL: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  MATIC: "0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52",
  LINK: "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221",
};

export class PythOracle {
  constructor(endpoint = "https://hermes.pyth.network") {
    this.endpoint = endpoint;
    this.name = "Pyth";
  }

  async getPrice(token) {
    const priceId = PYTH_PRICE_IDS[token];
    if (!priceId) {
      throw new Error(`Pyth feed not available for ${token}`);
    }

    const startTime = Date.now();
    try {
      const url = `${this.endpoint}/api/latest_price_feeds?ids[]=${priceId}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const priceData = data[0]?.price;

      if (!priceData) {
        throw new Error("No price data");
      }

      const price = Number(priceData.price) * Math.pow(10, priceData.expo);
      const latency = Date.now() - startTime;

      return {
        token,
        price,
        source: this.name,
        latency,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Pyth error for ${token}:`, error.message);
      return null;
    }
  }

  async getPrices(tokens) {
    const promises = tokens.map((token) => this.getPrice(token));
    const results = await Promise.allSettled(promises);
    return results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);
  }
}
