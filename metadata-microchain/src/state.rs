use linera_sdk::views::{MapView, RootView, ViewStorageContext};
use metadata_microchain::{OracleSourceMetadata, SystemConfig, TokenMetadata};

/// Metadata registry state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct MetadataState {
    /// Token metadata: symbol -> metadata
    pub tokens: MapView<String, TokenMetadata>,
    
    /// Oracle sources: name -> metadata
    pub oracle_sources: MapView<String, OracleSourceMetadata>,
    
    /// Token to oracle mapping: token_symbol -> Vec<oracle_names>
    pub token_oracle_mapping: MapView<String, Vec<String>>,
    
    /// System configuration: key -> value
    pub system_config: MapView<String, SystemConfig>,
}
