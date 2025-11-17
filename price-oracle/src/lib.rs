pub mod state;

use async_graphql::{Request, Response, SimpleObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
};
use serde::{Deserialize, Serialize};

pub struct PriceOracleAbi;

impl ContractAbi for PriceOracleAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for PriceOracleAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    UpdatePrice {
        token: String,
        price: f64,
        source: String,
        network: String,
    },
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct PriceData {
    pub token: String,
    pub price: f64,
    pub timestamp: u64,
    pub source: String,
    pub network: String,
}
