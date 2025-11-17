#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{abi::WithServiceAbi, Service, ServiceRuntime, views::View};
use metadata_microchain::{MetadataAbi, OracleSourceMetadata, SystemConfig, TokenMetadata, TokenOracleMapping};

use self::state::MetadataState;

pub struct MetadataService {
    state: Arc<MetadataState>,
}

linera_sdk::service!(MetadataService);

impl WithServiceAbi for MetadataService {
    type Abi = MetadataAbi;
}

impl Service for MetadataService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MetadataState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MetadataService {
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
    state: Arc<MetadataState>,
}

#[Object]
impl QueryRoot {
    /// Get token metadata
    async fn token(&self, symbol: String) -> Option<TokenMetadata> {
        match self.state.tokens.get(&symbol).await {
            Ok(Some(token)) => Some(token),
            _ => None,
        }
    }

    /// Get all tokens
    async fn all_tokens(&self) -> Vec<TokenMetadata> {
        let mut tokens = Vec::new();
        let _ = self
            .state
            .tokens
            .for_each_index_value(|_key, value| {
                if value.active {
                    tokens.push(value.into_owned());
                }
                Ok(())
            })
            .await;
        tokens
    }

    /// Get oracle source metadata
    async fn oracle_source(&self, name: String) -> Option<OracleSourceMetadata> {
        match self.state.oracle_sources.get(&name).await {
            Ok(Some(oracle)) => Some(oracle),
            _ => None,
        }
    }

    /// Get all oracle sources
    async fn all_oracle_sources(&self) -> Vec<OracleSourceMetadata> {
        let mut oracles = Vec::new();
        let _ = self
            .state
            .oracle_sources
            .for_each_index_value(|_key, value| {
                if value.active {
                    oracles.push(value.into_owned());
                }
                Ok(())
            })
            .await;
        oracles
    }

    /// Get token to oracle mapping
    async fn token_oracles(&self, token_symbol: String) -> Option<TokenOracleMapping> {
        match self.state.token_oracle_mapping.get(&token_symbol).await {
            Ok(Some(oracle_sources)) => {
                let primary_source = oracle_sources.first().cloned().unwrap_or_default();
                Some(TokenOracleMapping {
                    token_symbol,
                    oracle_sources: oracle_sources.to_vec(),
                    primary_source,
                })
            }
            _ => None,
        }
    }

    /// Get system configuration
    async fn config(&self, key: String) -> Option<SystemConfig> {
        match self.state.system_config.get(&key).await {
            Ok(Some(config)) => Some(config),
            _ => None,
        }
    }

    /// Get all system configurations
    async fn all_configs(&self) -> Vec<SystemConfig> {
        let mut configs = Vec::new();
        let _ = self
            .state
            .system_config
            .for_each_index_value(|_key, value| {
                configs.push(value.into_owned());
                Ok(())
            })
            .await;
        configs
    }
}

struct EmptyMutation;

#[Object]
impl EmptyMutation {
    async fn dummy(&self) -> bool {
        true
    }
}
