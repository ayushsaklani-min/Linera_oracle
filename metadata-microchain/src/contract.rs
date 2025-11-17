#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    Contract,
    ContractRuntime,
    views::{RootView, View},
};
use metadata_microchain::{MetadataAbi, Operation, OracleSourceMetadata, SystemConfig, TokenMetadata};

use self::state::MetadataState;

pub struct MetadataContract {
    state: MetadataState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(MetadataContract);

impl WithContractAbi for MetadataContract {
    type Abi = MetadataAbi;
}

impl Contract for MetadataContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = MetadataState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MetadataContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {
        // Initialize with default tokens and oracles
        self.initialize_defaults().await;
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::RegisterToken { token } => {
                self.handle_register_token(token).await;
            }
            Operation::RegisterOracle { oracle } => {
                self.handle_register_oracle(oracle).await;
            }
            Operation::MapTokenToOracles {
                token_symbol,
                oracle_sources,
            } => {
                self.handle_map_token_to_oracles(token_symbol, oracle_sources)
                    .await;
            }
            Operation::UpdateConfig { key, value } => {
                self.handle_update_config(key, value).await;
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

impl MetadataContract {
    async fn initialize_defaults(&mut self) {
        // Register default tokens
        let default_tokens = vec![
            TokenMetadata {
                symbol: "ETH".to_string(),
                name: "Ethereum".to_string(),
                decimals: 18,
                chain: "Ethereum".to_string(),
                contract_address: None,
                logo_url: Some("https://cryptologos.cc/logos/ethereum-eth-logo.png".to_string()),
                coingecko_id: Some("ethereum".to_string()),
                active: true,
            },
            TokenMetadata {
                symbol: "BTC".to_string(),
                name: "Bitcoin".to_string(),
                decimals: 8,
                chain: "Bitcoin".to_string(),
                contract_address: None,
                logo_url: Some("https://cryptologos.cc/logos/bitcoin-btc-logo.png".to_string()),
                coingecko_id: Some("bitcoin".to_string()),
                active: true,
            },
            TokenMetadata {
                symbol: "SOL".to_string(),
                name: "Solana".to_string(),
                decimals: 9,
                chain: "Solana".to_string(),
                contract_address: None,
                logo_url: Some("https://cryptologos.cc/logos/solana-sol-logo.png".to_string()),
                coingecko_id: Some("solana".to_string()),
                active: true,
            },
            TokenMetadata {
                symbol: "MATIC".to_string(),
                name: "Polygon".to_string(),
                decimals: 18,
                chain: "Polygon".to_string(),
                contract_address: None,
                logo_url: Some("https://cryptologos.cc/logos/polygon-matic-logo.png".to_string()),
                coingecko_id: Some("matic-network".to_string()),
                active: true,
            },
            TokenMetadata {
                symbol: "LINK".to_string(),
                name: "Chainlink".to_string(),
                decimals: 18,
                chain: "Ethereum".to_string(),
                contract_address: Some("0x514910771AF9Ca656af840dff83E8264EcF986CA".to_string()),
                logo_url: Some("https://cryptologos.cc/logos/chainlink-link-logo.png".to_string()),
                coingecko_id: Some("chainlink".to_string()),
                active: true,
            },
        ];

        for token in default_tokens {
            let symbol = token.symbol.clone();
            let _ = self.state.tokens.insert(&symbol, token);
        }

        // Register default oracle sources
        let default_oracles = vec![
            OracleSourceMetadata {
                name: "Chainlink".to_string(),
                endpoint: "https://ethereum-sepolia.publicnode.com".to_string(),
                chain: "Ethereum".to_string(),
                contract_address: Some("0x694AA1769357215DE4FAC081bf1f309aDC325306".to_string()),
                api_key_required: false,
                update_frequency_ms: 1000,
                reputation_base: 95.0,
                active: true,
            },
            OracleSourceMetadata {
                name: "Pyth".to_string(),
                endpoint: "https://hermes.pyth.network".to_string(),
                chain: "Multi-chain".to_string(),
                contract_address: None,
                api_key_required: false,
                update_frequency_ms: 400,
                reputation_base: 93.0,
                active: true,
            },
            OracleSourceMetadata {
                name: "API3".to_string(),
                endpoint: "https://api3.org".to_string(),
                chain: "Multi-chain".to_string(),
                contract_address: None,
                api_key_required: true,
                update_frequency_ms: 1000,
                reputation_base: 91.0,
                active: true,
            },
            OracleSourceMetadata {
                name: "RedStone".to_string(),
                endpoint: "https://api.redstone.finance".to_string(),
                chain: "Multi-chain".to_string(),
                contract_address: None,
                api_key_required: false,
                update_frequency_ms: 2000,
                reputation_base: 88.0,
                active: true,
            },
        ];

        for oracle in default_oracles {
            let name = oracle.name.clone();
            let _ = self.state.oracle_sources.insert(&name, oracle);
        }

        // Map tokens to oracles
        let mappings = vec![
            ("ETH", vec!["Chainlink", "Pyth", "API3", "RedStone"]),
            ("BTC", vec!["Chainlink", "Pyth", "RedStone"]),
            ("SOL", vec!["Pyth", "RedStone"]),
            ("MATIC", vec!["Chainlink", "Pyth"]),
            ("LINK", vec!["Chainlink", "Pyth"]),
        ];

        for (token, oracles) in mappings {
            let oracle_names: Vec<String> = oracles.iter().map(|s| s.to_string()).collect();
            let _ = self
                .state
                .token_oracle_mapping
                .insert(&token.to_string(), oracle_names);
        }
    }

    async fn handle_register_token(&mut self, token: TokenMetadata) {
        let symbol = token.symbol.clone();
        self.state
            .tokens
            .insert(&symbol, token)
            .expect("Failed to register token");
    }

    async fn handle_register_oracle(&mut self, oracle: OracleSourceMetadata) {
        let name = oracle.name.clone();
        self.state
            .oracle_sources
            .insert(&name, oracle)
            .expect("Failed to register oracle");
    }

    async fn handle_map_token_to_oracles(
        &mut self,
        token_symbol: String,
        oracle_sources: Vec<String>,
    ) {
        self.state
            .token_oracle_mapping
            .insert(&token_symbol, oracle_sources)
            .expect("Failed to map token to oracles");
    }

    async fn handle_update_config(&mut self, key: String, value: String) {
        let timestamp = self.runtime.system_time().micros();
        let config = SystemConfig {
            key: key.clone(),
            value,
            updated_at: timestamp,
        };

        self.state
            .system_config
            .insert(&key, config)
            .expect("Failed to update config");
    }
}
