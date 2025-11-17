use linera_sdk::views::{MapView, RegisterView, RootView, ViewStorageContext};
use subscription_microchain::{Subscription, Usage};

/// Subscription microchain state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct SubscriptionState {
    /// User subscriptions: user_id -> subscription
    pub subscriptions: MapView<String, Subscription>,
    
    /// Usage tracking: user_id -> usage
    pub usage: MapView<String, Usage>,
    
    /// Total active subscriptions
    pub total_subscriptions: RegisterView<u64>,
    
    /// Total revenue (in cents)
    pub total_revenue: RegisterView<u64>,
}
