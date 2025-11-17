#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{abi::WithServiceAbi, Service, ServiceRuntime, views::View};
use subscription_microchain::{PlanLimits, Subscription, SubscriptionAbi, SubscriptionPlan, Usage};

use self::state::SubscriptionState;

pub struct SubscriptionService {
    state: Arc<SubscriptionState>,
}

linera_sdk::service!(SubscriptionService);

impl WithServiceAbi for SubscriptionService {
    type Abi = SubscriptionAbi;
}

impl Service for SubscriptionService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = SubscriptionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        SubscriptionService {
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
    state: Arc<SubscriptionState>,
}

#[Object]
impl QueryRoot {
    /// Get user subscription
    async fn subscription(&self, user_id: String) -> Option<Subscription> {
        match self.state.subscriptions.get(&user_id).await {
            Ok(Some(sub)) => Some(sub),
            _ => None,
        }
    }

    /// Get user usage statistics
    async fn usage(&self, user_id: String) -> Option<Usage> {
        match self.state.usage.get(&user_id).await {
            Ok(Some(usage)) => Some(usage),
            _ => None,
        }
    }

    /// Get plan limits for a specific plan
    async fn plan_limits(&self, plan: String) -> Option<PlanLimits> {
        let subscription_plan = match plan.as_str() {
            "free" => SubscriptionPlan::Free,
            "pro" => SubscriptionPlan::Pro,
            "enterprise" => SubscriptionPlan::Enterprise,
            _ => return None,
        };
        Some(subscription_plan.get_limits())
    }

    /// Check if user can perform action based on limits
    async fn can_perform_action(&self, user_id: String, action: String) -> bool {
        let subscription = match self.state.subscriptions.get(&user_id).await {
            Ok(Some(sub)) => sub,
            _ => return false,
        };

        if !subscription.active {
            return false;
        }

        let usage = match self.state.usage.get(&user_id).await {
            Ok(Some(u)) => u,
            _ => return false,
        };

        let limits = subscription.plan.get_limits();

        match action.as_str() {
            "api_call" => usage.api_calls < limits.api_rate_limit_per_day,
            "websocket" => true, // Always allowed, just throttled
            "alert" => usage.alerts_triggered < limits.alerts_limit,
            _ => false,
        }
    }

    /// Get total active subscriptions
    async fn total_subscriptions(&self) -> u64 {
        self.state.total_subscriptions.get().clone()
    }

    /// Get total revenue
    async fn total_revenue(&self) -> u64 {
        self.state.total_revenue.get().clone()
    }

    /// Get all active subscriptions
    async fn all_subscriptions(&self) -> Vec<Subscription> {
        let mut subscriptions = Vec::new();
        let _ = self
            .state
            .subscriptions
            .for_each_index_value(|_key, value| {
                if value.active {
                    subscriptions.push(value.into_owned());
                }
                Ok(())
            })
            .await;
        subscriptions
    }
}

struct EmptyMutation;

#[Object]
impl EmptyMutation {
    async fn dummy(&self) -> bool {
        true
    }
}
