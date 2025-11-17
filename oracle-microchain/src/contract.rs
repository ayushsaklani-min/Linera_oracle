#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    Contract,
    ContractRuntime,
    views::{RootView, View},
};
use oracle_microchain::{
    AlertConfig, Candle, CandleInterval, OracleAbi, OracleInput, OracleReputation, 
    Operation, PriceData, ThresholdType,
};

use self::state::OracleState;

pub struct OracleContract {
    state: OracleState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(OracleContract);

impl WithContractAbi for OracleContract {
    type Abi = OracleAbi;
}

impl Contract for OracleContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = OracleState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        OracleContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {}

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::UpdatePriceAggregated {
                token,
                aggregated_price,
                oracle_inputs,
                median,
                twap,
                vwap,
                timestamp,
            } => {
                self.handle_price_update(
                    token,
                    aggregated_price,
                    oracle_inputs,
                    median,
                    twap,
                    vwap,
                    timestamp,
                )
                .await;
            }
            Operation::UpdateCandle {
                token,
                interval,
                candle,
            } => {
                self.handle_candle_update(token, interval, candle).await;
            }
            Operation::SetAlert { user_id, alert } => {
                self.handle_set_alert(user_id, alert).await;
            }
            Operation::RemoveAlert { user_id, alert_id } => {
                self.handle_remove_alert(user_id, alert_id).await;
            }
            Operation::UpdateOracleReputation {
                source,
                accuracy,
                latency,
                uptime,
            } => {
                self.handle_reputation_update(source, accuracy, latency, uptime)
                    .await;
            }
        }
    }

    async fn execute_message(&mut self, _message: ()) {
        panic!("Messages not supported");
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl OracleContract {
    /// Handle aggregated price update from multiple oracles
    async fn handle_price_update(
        &mut self,
        token: String,
        aggregated_price: f64,
        oracle_inputs: Vec<OracleInput>,
        median: f64,
        twap: f64,
        vwap: f64,
        timestamp: u64,
    ) {
        let price_data = PriceData {
            token: token.clone(),
            price: aggregated_price,
            timestamp,
            source: format!("{} oracles", oracle_inputs.len()),
            network: "Multi-Oracle".to_string(),
            median,
            twap,
            vwap,
        };

        // Store in prices map
        self.state
            .prices
            .insert(&token, price_data.clone())
            .expect("Failed to insert price");

        // Update latest price
        self.state.latest_price.set(Some(price_data.clone()));

        // Check alerts
        self.check_alerts(&token, aggregated_price).await;

        // Increment query counter
        let current_queries = self.state.total_queries.get().clone();
        self.state.total_queries.set(current_queries + 1);
    }

    /// Handle OHLC candle update
    async fn handle_candle_update(
        &mut self,
        token: String,
        interval: CandleInterval,
        candle: Candle,
    ) {
        let map_view = match interval {
            CandleInterval::OneSecond => &mut self.state.candles_1s,
            CandleInterval::OneMinute => &mut self.state.candles_1m,
            CandleInterval::OneHour => &mut self.state.candles_1h,
            CandleInterval::TwentyFourHour => &mut self.state.candles_24h,
        };

        // Get existing candles or create new vec
        let mut candles = map_view
            .get(&token)
            .await
            .expect("Failed to get candles")
            .unwrap_or_default();

        // Add new candle
        candles.push(candle);

        // Keep only last 1000 candles to prevent unbounded growth
        if candles.len() > 1000 {
            candles.drain(0..candles.len() - 1000);
        }

        // Store updated candles
        map_view
            .insert(&token, candles)
            .expect("Failed to insert candles");
    }

    /// Set or update price alert
    async fn handle_set_alert(&mut self, user_id: String, alert: AlertConfig) {
        let mut user_alerts = self
            .state
            .alerts
            .get(&user_id)
            .await
            .expect("Failed to get alerts")
            .unwrap_or_default();

        // Remove existing alert with same ID if exists
        user_alerts.retain(|a| a.id != alert.id);

        // Add new alert
        user_alerts.push(alert);

        // Store updated alerts
        self.state
            .alerts
            .insert(&user_id, user_alerts)
            .expect("Failed to insert alerts");
    }

    /// Remove price alert
    async fn handle_remove_alert(&mut self, user_id: String, alert_id: String) {
        if let Ok(Some(mut user_alerts)) = self.state.alerts.get(&user_id).await {
            user_alerts.retain(|a| a.id != alert_id);
            self.state
                .alerts
                .insert(&user_id, user_alerts)
                .expect("Failed to insert alerts");
        }
    }

    /// Update oracle reputation metrics
    async fn handle_reputation_update(
        &mut self,
        source: String,
        accuracy: f64,
        latency: u64,
        uptime: f64,
    ) {
        let timestamp = self.runtime.system_time().micros();

        let mut reputation = self
            .state
            .oracle_stats
            .get(&source)
            .await
            .expect("Failed to get reputation")
            .unwrap_or(OracleReputation {
                source: source.clone(),
                accuracy: 0.0,
                latency_average: 0,
                uptime: 0.0,
                variance: 0.0,
                total_updates: 0,
                last_update: 0,
            });

        // Update metrics with exponential moving average
        let alpha = 0.1; // Smoothing factor
        reputation.accuracy = reputation.accuracy * (1.0 - alpha) + accuracy * alpha;
        reputation.latency_average =
            ((reputation.latency_average as f64) * (1.0 - alpha) + (latency as f64) * alpha)
                as u64;
        reputation.uptime = reputation.uptime * (1.0 - alpha) + uptime * alpha;
        reputation.total_updates += 1;
        reputation.last_update = timestamp;

        self.state
            .oracle_stats
            .insert(&source, reputation)
            .expect("Failed to insert reputation");
    }

    /// Check if any alerts should be triggered
    async fn check_alerts(&mut self, token: &str, price: f64) {
        // Iterate through all user alerts
        let _ = self
            .state
            .alerts
            .for_each_index_value(|_user_id, alerts| {
                for alert in alerts.iter() {
                    if alert.token == token && alert.active {
                        let triggered = match alert.threshold_type {
                            ThresholdType::Above => price >= alert.threshold_value,
                            ThresholdType::Below => price <= alert.threshold_value,
                        };

                        if triggered {
                            // In a real implementation, emit an event here
                            // For now, we just log the trigger
                            // self.runtime.emit_event(AlertTriggered { ... });
                        }
                    }
                }
                Ok(())
            })
            .await;
    }
}
