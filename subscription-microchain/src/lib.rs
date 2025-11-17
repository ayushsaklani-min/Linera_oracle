use async_graphql::{Enum, Request, Response, SimpleObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
};
use serde::{Deserialize, Serialize};

pub struct SubscriptionAbi;

impl ContractAbi for SubscriptionAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for SubscriptionAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Create or update subscription
    SetSubscription {
        user_id: String,
        plan: SubscriptionPlan,
    },
    /// Cancel subscription
    CancelSubscription { user_id: String },
    /// Record API usage
    RecordUsage {
        user_id: String,
        usage_type: UsageType,
        amount: u64,
    },
    /// Reset usage counters (monthly)
    ResetUsage { user_id: String },
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct Subscription {
    pub user_id: String,
    pub plan: SubscriptionPlan,
    pub started_at: u64,
    pub expires_at: u64,
    pub active: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq, Enum, Copy)]
pub enum SubscriptionPlan {
    Free,
    Pro,
    Enterprise,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct PlanLimits {
    pub update_interval_ms: u64,
    pub api_rate_limit_per_day: u64,
    pub alerts_limit: u64,
    pub tokens_access: Vec<String>,
    pub websocket_throttle_ms: u64,
    pub historical_data_days: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct Usage {
    pub user_id: String,
    pub api_calls: u64,
    pub websocket_messages: u64,
    pub alerts_triggered: u64,
    pub period_start: u64,
    pub period_end: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq, Enum, Copy)]
pub enum UsageType {
    ApiCall,
    WebSocketMessage,
    AlertTriggered,
}

impl SubscriptionPlan {
    pub fn get_limits(&self) -> PlanLimits {
        match self {
            SubscriptionPlan::Free => PlanLimits {
                update_interval_ms: 10000, // 10s
                api_rate_limit_per_day: 1000,
                alerts_limit: 10,
                tokens_access: vec!["ETH".to_string(), "BTC".to_string()],
                websocket_throttle_ms: 5000,
                historical_data_days: 7,
            },
            SubscriptionPlan::Pro => PlanLimits {
                update_interval_ms: 1000, // 1s
                api_rate_limit_per_day: 100000,
                alerts_limit: 100,
                tokens_access: vec![
                    "ETH".to_string(),
                    "BTC".to_string(),
                    "SOL".to_string(),
                    "MATIC".to_string(),
                    "LINK".to_string(),
                ],
                websocket_throttle_ms: 100,
                historical_data_days: 90,
            },
            SubscriptionPlan::Enterprise => PlanLimits {
                update_interval_ms: 100, // <1s
                api_rate_limit_per_day: u64::MAX, // Unlimited
                alerts_limit: u64::MAX,           // Unlimited
                tokens_access: vec!["ALL".to_string()],
                websocket_throttle_ms: 0, // No throttle
                historical_data_days: 365,
            },
        }
    }

    pub fn get_price_usd(&self) -> u64 {
        match self {
            SubscriptionPlan::Free => 0,
            SubscriptionPlan::Pro => 49,
            SubscriptionPlan::Enterprise => 299,
        }
    }
}
