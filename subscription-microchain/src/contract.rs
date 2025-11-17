#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    Contract,
    ContractRuntime,
    views::{RootView, View},
};
use subscription_microchain::{Operation, Subscription, SubscriptionAbi, SubscriptionPlan, Usage, UsageType};

use self::state::SubscriptionState;

pub struct SubscriptionContract {
    state: SubscriptionState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(SubscriptionContract);

impl WithContractAbi for SubscriptionContract {
    type Abi = SubscriptionAbi;
}

impl Contract for SubscriptionContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = SubscriptionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        SubscriptionContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {}

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::SetSubscription { user_id, plan } => {
                self.handle_set_subscription(user_id, plan).await;
            }
            Operation::CancelSubscription { user_id } => {
                self.handle_cancel_subscription(user_id).await;
            }
            Operation::RecordUsage {
                user_id,
                usage_type,
                amount,
            } => {
                self.handle_record_usage(user_id, usage_type, amount).await;
            }
            Operation::ResetUsage { user_id } => {
                self.handle_reset_usage(user_id).await;
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

impl SubscriptionContract {
    async fn handle_set_subscription(&mut self, user_id: String, plan: SubscriptionPlan) {
        let timestamp = self.runtime.system_time().micros();
        let expires_at = timestamp + (30 * 24 * 60 * 60 * 1_000_000); // 30 days

        let subscription = Subscription {
            user_id: user_id.clone(),
            plan: plan.clone(),
            started_at: timestamp,
            expires_at,
            active: true,
        };

        // Check if new subscription
        let is_new = self
            .state
            .subscriptions
            .get(&user_id)
            .await
            .expect("Failed to get subscription")
            .is_none();

        self.state
            .subscriptions
            .insert(&user_id, subscription)
            .expect("Failed to insert subscription");

        // Update counters
        if is_new {
            let total = self.state.total_subscriptions.get().clone();
            self.state.total_subscriptions.set(total + 1);
        }

        // Update revenue
        let price = plan.get_price_usd() * 100; // Convert to cents
        let revenue = self.state.total_revenue.get().clone();
        self.state.total_revenue.set(revenue + price);

        // Initialize usage tracking
        let usage = Usage {
            user_id: user_id.clone(),
            api_calls: 0,
            websocket_messages: 0,
            alerts_triggered: 0,
            period_start: timestamp,
            period_end: expires_at,
        };

        self.state
            .usage
            .insert(&user_id, usage)
            .expect("Failed to insert usage");
    }

    async fn handle_cancel_subscription(&mut self, user_id: String) {
        if let Ok(Some(mut subscription)) = self.state.subscriptions.get(&user_id).await {
            subscription.active = false;
            self.state
                .subscriptions
                .insert(&user_id, subscription)
                .expect("Failed to update subscription");

            let total = self.state.total_subscriptions.get().clone();
            if total > 0 {
                self.state.total_subscriptions.set(total - 1);
            }
        }
    }

    async fn handle_record_usage(&mut self, user_id: String, usage_type: UsageType, amount: u64) {
        if let Ok(Some(mut usage)) = self.state.usage.get(&user_id).await {
            match usage_type {
                UsageType::ApiCall => usage.api_calls += amount,
                UsageType::WebSocketMessage => usage.websocket_messages += amount,
                UsageType::AlertTriggered => usage.alerts_triggered += amount,
            }

            self.state
                .usage
                .insert(&user_id, usage)
                .expect("Failed to update usage");
        }
    }

    async fn handle_reset_usage(&mut self, user_id: String) {
        if let Ok(Some(mut usage)) = self.state.usage.get(&user_id).await {
            let timestamp = self.runtime.system_time().micros();
            usage.api_calls = 0;
            usage.websocket_messages = 0;
            usage.alerts_triggered = 0;
            usage.period_start = timestamp;
            usage.period_end = timestamp + (30 * 24 * 60 * 60 * 1_000_000);

            self.state
                .usage
                .insert(&user_id, usage)
                .expect("Failed to reset usage");
        }
    }
}
