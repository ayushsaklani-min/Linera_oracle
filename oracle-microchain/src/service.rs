#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{abi::WithServiceAbi, Service, ServiceRuntime, views::View};
use oracle_microchain::{
    AggregatedStats, AlertConfig, Candle, CandleInterval, OracleAbi, OracleReputation, PriceData,
};

use self::state::OracleState;

pub struct OracleService {
    state: Arc<OracleState>,
}

linera_sdk::service!(OracleService);

impl WithServiceAbi for OracleService {
    type Abi = OracleAbi;
}

impl Service for OracleService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = OracleState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        OracleService {
            state: Arc::new(state),
        }
    }

    async fn handle_query(&self, request: Self::Query) -> Self::QueryResponse {
        let schema = Schema::build(
            QueryRoot {
                state: self.state.clone(),
            },
            EmptyMutation,
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    state: Arc<OracleState>,
}

#[Object]
impl QueryRoot {
    /// Get latest price for any token
    async fn latest_price(&self) -> Option<PriceData> {
        self.state.latest_price.get().clone()
    }

    /// Get price for specific token
    async fn price(&self, token: String) -> Option<PriceData> {
        match self.state.prices.get(&token).await {
            Ok(Some(data)) => Some(data),
            _ => None,
        }
    }

    /// Get all stored prices
    async fn all_prices(&self) -> Vec<PriceData> {
        let mut prices = Vec::new();
        let _ = self
            .state
            .prices
            .for_each_index_value(|_key, value| {
                prices.push(value.into_owned());
                Ok(())
            })
            .await;
        prices
    }

    /// Get historical prices for a token (last N entries)
    async fn price_history(&self, token: String, limit: Option<i32>) -> Vec<PriceData> {
        // In a real implementation, we'd store a time-series
        // For now, return the single stored price
        match self.state.prices.get(&token).await {
            Ok(Some(data)) => vec![data],
            _ => vec![],
        }
    }

    /// Get OHLC candles for specific interval
    async fn candles(
        &self,
        token: String,
        interval: String,
        limit: Option<i32>,
    ) -> Vec<Candle> {
        let map_view = match interval.as_str() {
            "1s" => &self.state.candles_1s,
            "1m" => &self.state.candles_1m,
            "1h" => &self.state.candles_1h,
            "24h" => &self.state.candles_24h,
            _ => return vec![],
        };

        match map_view.get(&token).await {
            Ok(Some(candles)) => {
                let limit = limit.unwrap_or(100) as usize;
                candles.into_iter().rev().take(limit).collect()
            }
            _ => vec![],
        }
    }

    /// Get user's active alerts
    async fn user_alerts(&self, user_id: String) -> Vec<AlertConfig> {
        match self.state.alerts.get(&user_id).await {
            Ok(Some(alerts)) => alerts.to_vec(),
            _ => vec![],
        }
    }

    /// Get oracle reputation scores
    async fn oracle_reputation(&self, source: String) -> Option<OracleReputation> {
        match self.state.oracle_stats.get(&source).await {
            Ok(Some(rep)) => Some(rep),
            _ => None,
        }
    }

    /// Get all oracle reputations
    async fn all_oracle_reputations(&self) -> Vec<OracleReputation> {
        let mut reputations = Vec::new();
        let _ = self
            .state
            .oracle_stats
            .for_each_index_value(|_key, value| {
                reputations.push(value.into_owned());
                Ok(())
            })
            .await;
        reputations
    }

    /// Get aggregated network statistics
    async fn network_stats(&self) -> AggregatedStats {
        let total_queries = self.state.total_queries.get().clone();

        // Calculate active oracles
        let mut active_oracles = 0u64;
        let mut total_latency = 0u64;
        let mut total_uptime = 0.0f64;

        let _ = self
            .state
            .oracle_stats
            .for_each_index_value(|_key, rep| {
                active_oracles += 1;
                total_latency += rep.latency_average;
                total_uptime += rep.uptime;
                Ok(())
            })
            .await;

        let avg_latency = if active_oracles > 0 {
            total_latency / active_oracles
        } else {
            0
        };

        let network_uptime = if active_oracles > 0 {
            total_uptime / active_oracles as f64
        } else {
            0.0
        };

        AggregatedStats {
            total_queries,
            avg_latency,
            active_oracles,
            network_uptime,
        }
    }

    /// Get TWAP (Time-Weighted Average Price) for a token
    async fn twap(&self, token: String) -> Option<f64> {
        match self.state.prices.get(&token).await {
            Ok(Some(data)) => Some(data.twap),
            _ => None,
        }
    }

    /// Get VWAP (Volume-Weighted Average Price) for a token
    async fn vwap(&self, token: String) -> Option<f64> {
        match self.state.prices.get(&token).await {
            Ok(Some(data)) => Some(data.vwap),
            _ => None,
        }
    }

    /// Get median price for a token
    async fn median(&self, token: String) -> Option<f64> {
        match self.state.prices.get(&token).await {
            Ok(Some(data)) => Some(data.median),
            _ => None,
        }
    }
}

struct EmptyMutation;

#[Object]
impl EmptyMutation {
    async fn dummy(&self) -> bool {
        true
    }
}
