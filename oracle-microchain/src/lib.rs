use async_graphql::{Enum, InputObject, Request, Response, SimpleObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
    linera_base_types::ChainId,
};
use serde::{Deserialize, Serialize};

pub struct OracleAbi;

impl ContractAbi for OracleAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for OracleAbi {
    type Query = Request;
    type QueryResponse = Response;
}

pub const ORACLE_STREAM_NAME: &str = "oracle_price_feed";

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Submit price from oracle provider (called by provider chains)
    SubmitPrice {
        token: String,
        price: f64,
        source: String,
        timestamp: u64,
    },
    /// Subscribe to price feed events
    SubscribeTo {
        chain_id: ChainId,
    },
    /// Unsubscribe from price feed events
    UnsubscribeFrom {
        chain_id: ChainId,
    },
    /// Register as oracle provider (Master chain only)
    RegisterProvider {
        provider_chain: ChainId,
        source_name: String,
    },
    /// Update OHLC candle data
    UpdateCandle {
        token: String,
        interval: CandleInterval,
        candle: Candle,
    },
    /// Create or update price alert
    SetAlert {
        user_id: String,
        alert: AlertConfig,
    },
    /// Remove price alert
    RemoveAlert {
        user_id: String,
        alert_id: String,
    },
    /// Request aggregated price (triggers cross-chain aggregation)
    RequestAggregation {
        token: String,
    },
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct PriceData {
    pub token: String,
    pub price: f64,
    pub timestamp: u64,
    pub source: String,
    pub network: String,
    pub median: f64,
    pub twap: f64,
    pub vwap: f64,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject, InputObject)]
#[graphql(input_name = "OracleInputInput")]
pub struct OracleInput {
    pub source: String,
    pub price: f64,
    pub latency: u64,
    pub timestamp: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject, InputObject)]
#[graphql(input_name = "CandleInput")]
pub struct Candle {
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
    pub timestamp: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq, Hash, Enum, Copy)]
pub enum CandleInterval {
    OneSecond,
    OneMinute,
    OneHour,
    TwentyFourHour,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject, InputObject)]
#[graphql(input_name = "AlertConfigInput")]
pub struct AlertConfig {
    pub id: String,
    pub token: String,
    pub threshold_type: ThresholdType,
    pub threshold_value: f64,
    pub active: bool,
    pub created_at: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq, Enum, Copy)]
pub enum ThresholdType {
    Above,
    Below,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct OracleReputation {
    pub source: String,
    pub accuracy: f64,
    pub latency_average: u64,
    pub uptime: f64,
    pub variance: f64,
    pub total_updates: u64,
    pub last_update: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct AggregatedStats {
    pub total_queries: u64,
    pub avg_latency: u64,
    pub active_oracles: u64,
    pub network_uptime: f64,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum OracleMessage {
    /// Provider submits price to aggregator
    SubmitPrice {
        token: String,
        price: f64,
        source: String,
        timestamp: u64,
    },
    /// Request price aggregation from providers
    RequestPrice {
        token: String,
        requester: ChainId,
    },
    /// Aggregation result sent back to requester
    AggregationResult {
        token: String,
        aggregated_price: f64,
        median: f64,
        twap: f64,
        vwap: f64,
        oracle_inputs: Vec<OracleInput>,
        timestamp: u64,
    },
    /// Register provider chain
    RegisterProvider {
        provider_chain: ChainId,
        source_name: String,
    },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum OracleEvent {
    /// Price update event (streamed to subscribers)
    PriceUpdate {
        token: String,
        price: f64,
        aggregated_price: f64,
        median: f64,
        twap: f64,
        vwap: f64,
        oracle_breakdown: Vec<OracleInput>,
        timestamp: u64,
    },
    /// New oracle provider registered
    ProviderRegistered {
        source: String,
        chain_id: ChainId,
    },
    /// Alert triggered
    AlertTriggered {
        user_id: String,
        alert_id: String,
        token: String,
        price: f64,
    },
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct OracleParameters {
    pub master_chain: ChainId,
    pub aggregator_chain: ChainId,
}
