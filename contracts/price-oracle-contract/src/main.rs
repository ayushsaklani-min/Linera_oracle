#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};
use price_oracle::{state::PriceOracle, Operation, PriceData, PriceOracleAbi};

pub struct PriceOracleContract {
    state: PriceOracle,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(PriceOracleContract);

impl WithContractAbi for PriceOracleContract {
    type Abi = PriceOracleAbi;
}

impl Contract for PriceOracleContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = PriceOracle::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        PriceOracleContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {}

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::UpdatePrice {
                token,
                price,
                source,
                network,
            } => {
                let timestamp = self.runtime.system_time().micros();

                let price_data = PriceData {
                    token: token.clone(),
                    price,
                    timestamp,
                    source,
                    network,
                };

                self.state
                    .prices
                    .insert(&token, price_data.clone())
                    .expect("Failed to insert price");

                self.state.latest_price.set(Some(price_data));
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



