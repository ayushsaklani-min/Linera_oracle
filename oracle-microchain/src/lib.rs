use async_graphql::{Enum, InputObject, Request, Response, SimpleObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
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

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Update price with aggregated data from multiple oracles
    UpdatePriceAggregated {
        token: String,
        aggregated_price: f64,
        oracle_inputs: Vec<OracleInput>,
        median: f64,
        twap: f64,
        vwap: f64,
        timestamp: u64,
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
    /// Update oracle reputation
    UpdateOracleReputation {
        source: String,
        accuracy: f64,
        latency: u64,
        uptime: f64,
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
