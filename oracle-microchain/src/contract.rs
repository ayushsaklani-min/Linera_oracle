#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    linera_base_types::{ChainId, StreamUpdate},
    Contract,
    ContractRuntime,
    views::{RootView, View},
};
use oracle_microchain::{
    AlertConfig, Candle, CandleInterval, OracleAbi, OracleEvent, OracleInput, OracleMessage,
    OracleParameters, OracleReputation, Operation, PriceData, ThresholdType, ORACLE_STREAM_NAME,
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
    type Message = OracleMessage;
    type Parameters = OracleParameters;
    type InstantiationArgument = ();
    type EventValue = OracleEvent;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = OracleState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        OracleContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::SubmitPrice {
                token,
                price,
                source,
                timestamp,
            } => {
                log::info!("Operation::SubmitPrice - token: {}, price: {}, source: {}", token, price, source);
                self.handle_submit_price(token, price, source, timestamp).await;
            }
            Operation::SubscribeTo { chain_id } => {
                log::info!("Operation::SubscribeTo - chain_id: {:?}", chain_id);
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime.subscribe_to_events(chain_id, app_id, ORACLE_STREAM_NAME.into());
            }
            Operation::UnsubscribeFrom { chain_id } => {
                log::info!("Operation::UnsubscribeFrom - chain_id: {:?}", chain_id);
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime.unsubscribe_from_events(chain_id, app_id, ORACLE_STREAM_NAME.into());
            }
            Operation::RegisterProvider {
                provider_chain,
                source_name,
            } => {
                log::info!("Operation::RegisterProvider - source: {}, chain: {:?}", source_name, provider_chain);
                self.handle_register_provider(provider_chain, source_name).await;
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
            Operation::RequestAggregation { token } => {
                log::info!("Operation::RequestAggregation - token: {}", token);
                self.handle_request_aggregation(token).await;
            }
        }
    }

    async fn execute_message(&mut self, message: OracleMessage) {
        let origin_chain = self.runtime.message_origin_chain_id().expect("Missing origin chain");
        
        match message {
            OracleMessage::SubmitPrice {
                token,
                price,
                source,
                timestamp,
            } => {
                log::info!("Message::SubmitPrice from {:?} - token: {}, price: {}", origin_chain, token, price);
                self.handle_submit_price(token, price, source, timestamp).await;
            }
            OracleMessage::RequestPrice { token, requester } => {
                log::info!("Message::RequestPrice from {:?} - token: {}", origin_chain, token);
                self.handle_price_request(token, requester).await;
            }
            OracleMessage::AggregationResult {
                token,
                aggregated_price,
                median,
                twap,
                vwap,
                oracle_inputs,
                timestamp,
            } => {
                log::info!("Message::AggregationResult - token: {}, price: {}", token, aggregated_price);
                self.handle_aggregation_result(
                    token,
                    aggregated_price,
                    median,
                    twap,
                    vwap,
                    oracle_inputs,
                    timestamp,
                )
                .await;
            }
            OracleMessage::RegisterProvider {
                provider_chain,
                source_name,
            } => {
                log::info!("Message::RegisterProvider from {:?} - source: {}", origin_chain, source_name);
                let params = self.runtime.application_parameters();
                assert_eq!(
                    origin_chain, params.master_chain,
                    "Only master chain can register providers"
                );
                self.handle_register_provider(provider_chain, source_name).await;
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl OracleContract {
    /// Handle price submission from oracle provider
    async fn handle_submit_price(
        &mut self,
        token: String,
        price: f64,
        source: String,
        timestamp: u64,
    ) {
        // Add to pending prices for aggregation
        let mut pending = self
            .state
            .pending_prices
            .get(&token)
            .await
            .expect("Failed to get pending prices")
            .unwrap_or_default();

        pending.push((source.clone(), price, timestamp));

        self.state
            .pending_prices
            .insert(&token, pending.clone())
            .expect("Failed to insert pending prices");

        // Update reputation
        self.update_provider_reputation(&source, timestamp).await;

        // If we have enough submissions, aggregate
        let provider_count = self.state.providers.count().await.unwrap_or(0);
        if pending.len() >= provider_count.min(3) as usize {
            self.aggregate_and_publish(token, pending).await;
        }
    }

    /// Aggregate prices and publish event
    async fn aggregate_and_publish(&mut self, token: String, submissions: Vec<(String, f64, u64)>) {
        let mut prices: Vec<f64> = submissions.iter().map(|(_, p, _)| *p).collect();
        prices.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let median = if prices.is_empty() {
            0.0
        } else {
            prices[prices.len() / 2]
        };

        let sum: f64 = prices.iter().sum();
        let aggregated_price = sum / prices.len() as f64;

        // Simple TWAP/VWAP (in production, use time-weighted calculations)
        let twap = aggregated_price;
        let vwap = aggregated_price;

        let oracle_inputs: Vec<OracleInput> = submissions
            .iter()
            .map(|(source, price, timestamp)| OracleInput {
                source: source.clone(),
                price: *price,
                latency: 0,
                timestamp: *timestamp,
            })
            .collect();

        let timestamp = self.runtime.system_time().micros();

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

        // Clear pending prices
        self.state
            .pending_prices
            .remove(&token)
            .expect("Failed to clear pending prices");

        // Emit event for subscribers
        self.runtime.emit(
            ORACLE_STREAM_NAME.into(),
            &OracleEvent::PriceUpdate {
                token: token.clone(),
                price: aggregated_price,
                aggregated_price,
                median,
                twap,
                vwap,
                oracle_breakdown: oracle_inputs.clone(),
                timestamp,
            },
        );

        // Check alerts
        self.check_alerts(&token, aggregated_price).await;

        // Increment query counter
        let current_queries = self.state.total_queries.get().clone();
        self.state.total_queries.set(current_queries + 1);

        log::info!("Aggregated price for {}: {} from {} sources", token, aggregated_price, submissions.len());
    }

    /// Register oracle provider
    async fn handle_register_provider(&mut self, provider_chain: ChainId, source_name: String) {
        self.state
            .providers
            .insert(&source_name, provider_chain)
            .expect("Failed to register provider");

        self.runtime.emit(
            ORACLE_STREAM_NAME.into(),
            &OracleEvent::ProviderRegistered {
                source: source_name.clone(),
                chain_id: provider_chain,
            },
        );

        log::info!("Registered provider: {} at chain {:?}", source_name, provider_chain);
    }

    /// Handle price request from consumer
    async fn handle_price_request(&mut self, token: String, requester: ChainId) {
        // Request prices from all providers
        let mut provider_chains = Vec::new();
        let _ = self
            .state
            .providers
            .for_each_index_value(|_source, chain_id| {
                provider_chains.push(chain_id.into_owned());
                Ok(())
            })
            .await;

        for provider_chain in provider_chains {
            self.send_message(
                provider_chain,
                OracleMessage::RequestPrice {
                    token: token.clone(),
                    requester,
                },
            );
        }
    }

    /// Handle aggregation result
    async fn handle_aggregation_result(
        &mut self,
        token: String,
        aggregated_price: f64,
        median: f64,
        twap: f64,
        vwap: f64,
        oracle_inputs: Vec<OracleInput>,
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

        self.state
            .prices
            .insert(&token, price_data.clone())
            .expect("Failed to insert price");

        self.state.latest_price.set(Some(price_data));

        // Emit event
        self.runtime.emit(
            ORACLE_STREAM_NAME.into(),
            &OracleEvent::PriceUpdate {
                token: token.clone(),
                price: aggregated_price,
                aggregated_price,
                median,
                twap,
                vwap,
                oracle_breakdown: oracle_inputs,
                timestamp,
            },
        );

        self.check_alerts(&token, aggregated_price).await;
    }

    /// Request aggregation from providers
    async fn handle_request_aggregation(&mut self, token: String) {
        let requester = self.runtime.chain_id();
        let params = self.runtime.application_parameters();
        
        self.send_message(
            params.aggregator_chain,
            OracleMessage::RequestPrice { token, requester },
        );
    }

    /// Update provider reputation
    async fn update_provider_reputation(&mut self, source: &str, timestamp: u64) {
        let mut reputation = self
            .state
            .oracle_stats
            .get(source)
            .await
            .expect("Failed to get reputation")
            .unwrap_or(OracleReputation {
                source: source.to_string(),
                accuracy: 1.0,
                latency_average: 0,
                uptime: 1.0,
                variance: 0.0,
                total_updates: 0,
                last_update: 0,
            });

        reputation.total_updates += 1;
        reputation.last_update = timestamp;

        self.state
            .oracle_stats
            .insert(source, reputation)
            .expect("Failed to update reputation");
    }

    /// Send message to another chain
    fn send_message(&mut self, destination: ChainId, message: OracleMessage) {
        self.runtime
            .prepare_message(message)
            .with_authentication()
            .send_to(destination);
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
        let mut triggered_alerts = Vec::new();
        
        let _ = self
            .state
            .alerts
            .for_each_index_value(|user_id, alerts| {
                for alert in alerts.iter() {
                    if alert.token == token && alert.active {
                        let triggered = match alert.threshold_type {
                            ThresholdType::Above => price >= alert.threshold_value,
                            ThresholdType::Below => price <= alert.threshold_value,
                        };

                        if triggered {
                            triggered_alerts.push((user_id.clone(), alert.clone()));
                        }
                    }
                }
                Ok(())
            })
            .await;

        // Emit events for triggered alerts
        for (user_id, alert) in triggered_alerts {
            self.runtime.emit(
                ORACLE_STREAM_NAME.into(),
                &OracleEvent::AlertTriggered {
                    user_id,
                    alert_id: alert.id,
                    token: alert.token,
                    price,
                },
            );
        }
    }
}
