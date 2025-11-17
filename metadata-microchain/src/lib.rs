use async_graphql::{InputObject, Request, Response, SimpleObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
};
use serde::{Deserialize, Serialize};

pub struct MetadataAbi;

impl ContractAbi for MetadataAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for MetadataAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Register or update token metadata
    RegisterToken { token: TokenMetadata },
    /// Register or update oracle source
    RegisterOracle { oracle: OracleSourceMetadata },
    /// Map token to oracle sources
    MapTokenToOracles {
        token_symbol: String,
        oracle_sources: Vec<String>,
    },
    /// Update system configuration
    UpdateConfig { key: String, value: String },
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject, InputObject)]
#[graphql(input_name = "TokenMetadataInput")]
pub struct TokenMetadata {
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    pub chain: String,
    pub contract_address: Option<String>,
    pub logo_url: Option<String>,
    pub coingecko_id: Option<String>,
    pub active: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject, InputObject)]
#[graphql(input_name = "OracleSourceMetadataInput")]
pub struct OracleSourceMetadata {
    pub name: String,
    pub endpoint: String,
    pub chain: String,
    pub contract_address: Option<String>,
    pub api_key_required: bool,
    pub update_frequency_ms: u64,
    pub reputation_base: f64,
    pub active: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct TokenOracleMapping {
    pub token_symbol: String,
    pub oracle_sources: Vec<String>,
    pub primary_source: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct SystemConfig {
    pub key: String,
    pub value: String,
    pub updated_at: u64,
}
