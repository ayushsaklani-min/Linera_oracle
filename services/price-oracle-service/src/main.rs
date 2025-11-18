#![cfg_attr(target_arch = "wasm32", no_main)]

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{abi::WithServiceAbi, views::View, Service, ServiceRuntime};
use price_oracle::{state::PriceOracle, PriceData, PriceOracleAbi};

pub struct PriceOracleService {
    state: Arc<PriceOracle>,
}

linera_sdk::service!(PriceOracleService);

impl WithServiceAbi for PriceOracleService {
    type Abi = PriceOracleAbi;
}

impl Service for PriceOracleService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = PriceOracle::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        PriceOracleService {
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
    state: Arc<PriceOracle>,
}

#[Object]
impl QueryRoot {
    async fn latest_price(&self) -> Option<PriceData> {
        self.state.latest_price.get().clone()
    }

    async fn price(&self, token: String) -> Option<PriceData> {
        match self.state.prices.get(&token).await {
            Ok(Some(data)) => Some(data),
            _ => None,
        }
    }

    async fn all_prices(&self) -> Vec<PriceData> {
        let mut prices = Vec::new();
        let _ = self
            .state
            .prices
            .for_each_index_value(|_, value| {
                prices.push(value.into_owned());
                Ok(())
            })
            .await;
        prices
    }
}

struct EmptyMutation;

#[Object]
impl EmptyMutation {
    async fn dummy(&self) -> bool {
        true
    }
}






