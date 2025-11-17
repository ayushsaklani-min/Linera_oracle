/**
 * Multi-oracle price aggregation engine
 * Implements: Median, TWAP, VWAP, Weighted Mean
 */

export class PriceAggregator {
  constructor() {
    this.priceHistory = new Map(); // token -> array of prices
    this.maxHistorySize = 100;
  }

  /**
   * Aggregate prices from multiple oracles
   * @param {Array} oracleInputs - Array of {token, price, source, latency, timestamp}
   * @param {Object} oracleReputations - Map of source -> reputation score
   * @returns {Object} Aggregated result
   */
  aggregate(oracleInputs, oracleReputations = {}) {
    if (!oracleInputs || oracleInputs.length === 0) {
      return null;
    }

    const token = oracleInputs[0].token;
    const prices = oracleInputs.map((input) => input.price);
    const weights = oracleInputs.map((input) => {
      const reputation = oracleReputations[input.source] || 1.0;
      // Weight by reputation and inverse latency
      return reputation / (1 + input.latency / 1000);
    });

    // Calculate different aggregation methods
    const median = this.calculateMedian(prices);
    const weightedMean = this.calculateWeightedMean(prices, weights);
    const twap = this.calculateTWAP(token, prices);
    const vwap = this.calculateVWAP(prices, weights);

    // Store in history for TWAP calculation
    this.addToHistory(token, {
      price: weightedMean,
      timestamp: Date.now(),
    });

    return {
      token,
      aggregated_price: weightedMean,
      median,
      twap,
      vwap,
      oracle_inputs: oracleInputs,
      timestamp: Date.now(),
      num_sources: oracleInputs.length,
    };
  }

  /**
   * Calculate median price
   */
  calculateMedian(prices) {
    if (prices.length === 0) return 0;

    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate weighted mean
   */
  calculateWeightedMean(prices, weights) {
    if (prices.length === 0) return 0;

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = prices.reduce(
      (sum, price, i) => sum + price * weights[i],
      0
    );

    return weightedSum / totalWeight;
  }

  /**
   * Calculate Time-Weighted Average Price (TWAP)
   * Uses historical prices from last N updates
   */
  calculateTWAP(token, currentPrices) {
    const history = this.priceHistory.get(token) || [];

    if (history.length === 0) {
      // No history yet, use current average
      return currentPrices.reduce((sum, p) => sum + p, 0) / currentPrices.length;
    }

    // Use last 20 data points for TWAP
    const recentHistory = history.slice(-20);
    const totalPrice = recentHistory.reduce((sum, item) => sum + item.price, 0);

    return totalPrice / recentHistory.length;
  }

  /**
   * Calculate Volume-Weighted Average Price (VWAP)
   * Uses weights as proxy for volume
   */
  calculateVWAP(prices, weights) {
    return this.calculateWeightedMean(prices, weights);
  }

  /**
   * Add price to history for TWAP calculation
   */
  addToHistory(token, priceData) {
    if (!this.priceHistory.has(token)) {
      this.priceHistory.set(token, []);
    }

    const history = this.priceHistory.get(token);
    history.push(priceData);

    // Keep only last N entries
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Calculate price deviation (for outlier detection)
   */
  calculateDeviation(prices) {
    if (prices.length < 2) return 0;

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
      prices.length;

    return Math.sqrt(variance);
  }

  /**
   * Filter outliers using standard deviation
   */
  filterOutliers(oracleInputs, stdDevThreshold = 2) {
    if (oracleInputs.length < 3) return oracleInputs;

    const prices = oracleInputs.map((input) => input.price);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const stdDev = this.calculateDeviation(prices);

    return oracleInputs.filter((input) => {
      const zScore = Math.abs((input.price - mean) / stdDev);
      return zScore <= stdDevThreshold;
    });
  }

  /**
   * Get confidence score based on oracle agreement
   */
  getConfidenceScore(oracleInputs) {
    if (oracleInputs.length < 2) return 0.5;

    const prices = oracleInputs.map((input) => input.price);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const deviation = this.calculateDeviation(prices);

    // Lower deviation = higher confidence
    const relativeDeviation = deviation / mean;

    if (relativeDeviation < 0.01) return 1.0; // <1% deviation
    if (relativeDeviation < 0.05) return 0.8; // <5% deviation
    if (relativeDeviation < 0.1) return 0.6; // <10% deviation

    return 0.4; // >10% deviation
  }
}
