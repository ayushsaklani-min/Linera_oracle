/**
 * OHLC Candle Generator
 * Generates 1s, 1m, 1h, 24h candles from price updates
 */

export class CandleGenerator {
  constructor() {
    this.candles = {
      "1s": new Map(), // token -> current candle
      "1m": new Map(),
      "1h": new Map(),
      "24h": new Map(),
    };

    this.candleHistory = {
      "1s": new Map(), // token -> array of candles
      "1m": new Map(),
      "1h": new Map(),
      "24h": new Map(),
    };

    this.intervals = {
      "1s": 1000,
      "1m": 60 * 1000,
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    };
  }

  /**
   * Update candles with new price
   */
  updateCandles(token, price, timestamp = Date.now()) {
    const intervals = ["1s", "1m", "1h", "24h"];

    intervals.forEach((interval) => {
      this.updateCandle(token, price, timestamp, interval);
    });
  }

  /**
   * Update specific interval candle
   */
  updateCandle(token, price, timestamp, interval) {
    const intervalMs = this.intervals[interval];
    const candleTimestamp = Math.floor(timestamp / intervalMs) * intervalMs;

    const currentCandle = this.candles[interval].get(token);

    if (!currentCandle || currentCandle.timestamp !== candleTimestamp) {
      // Close previous candle and start new one
      if (currentCandle) {
        this.closeCandle(token, currentCandle, interval);
      }

      // Start new candle
      const newCandle = {
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 1,
        timestamp: candleTimestamp,
      };

      this.candles[interval].set(token, newCandle);
    } else {
      // Update existing candle
      currentCandle.high = Math.max(currentCandle.high, price);
      currentCandle.low = Math.min(currentCandle.low, price);
      currentCandle.close = price;
      currentCandle.volume += 1;
    }
  }

  /**
   * Close candle and add to history
   */
  closeCandle(token, candle, interval) {
    if (!this.candleHistory[interval].has(token)) {
      this.candleHistory[interval].set(token, []);
    }

    const history = this.candleHistory[interval].get(token);
    history.push({ ...candle });

    // Keep only last 1000 candles
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * Get current candle for token and interval
   */
  getCurrentCandle(token, interval) {
    return this.candles[interval].get(token);
  }

  /**
   * Get candle history for token and interval
   */
  getCandleHistory(token, interval, limit = 100) {
    const history = this.candleHistory[interval].get(token) || [];
    return history.slice(-limit);
  }

  /**
   * Get all current candles for a token
   */
  getAllCurrentCandles(token) {
    return {
      "1s": this.getCurrentCandle(token, "1s"),
      "1m": this.getCurrentCandle(token, "1m"),
      "1h": this.getCurrentCandle(token, "1h"),
      "24h": this.getCurrentCandle(token, "24h"),
    };
  }

  /**
   * Force close all current candles (for shutdown)
   */
  closeAllCandles() {
    const intervals = ["1s", "1m", "1h", "24h"];

    intervals.forEach((interval) => {
      this.candles[interval].forEach((candle, token) => {
        this.closeCandle(token, candle, interval);
      });
      this.candles[interval].clear();
    });
  }

  /**
   * Get candle statistics
   */
  getCandleStats(token, interval) {
    const history = this.candleHistory[interval].get(token) || [];

    if (history.length === 0) {
      return null;
    }

    const prices = history.map((c) => c.close);
    const volumes = history.map((c) => c.volume);

    return {
      count: history.length,
      avgPrice:
        prices.reduce((sum, p) => sum + p, 0) / prices.length,
      avgVolume:
        volumes.reduce((sum, v) => sum + v, 0) / volumes.length,
      highestPrice: Math.max(...prices),
      lowestPrice: Math.min(...prices),
      totalVolume: volumes.reduce((sum, v) => sum + v, 0),
    };
  }
}
