use linera_sdk::views::{MapView, RegisterView, RootView, ViewStorageContext};
use oracle_microchain::{AlertConfig, Candle, CandleInterval, OracleReputation, PriceData};

/// Oracle microchain state with full feature set
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct OracleState {
    /// All price data indexed by token
    pub prices: MapView<String, PriceData>,
    
    /// Latest price for quick access
    pub latest_price: RegisterView<Option<PriceData>>,
    
    /// 1-second candles: timestamp -> candle
    pub candles_1s: MapView<String, Vec<Candle>>,
    
    /// 1-minute candles: timestamp -> candle
    pub candles_1m: MapView<String, Vec<Candle>>,
    
    /// 1-hour candles: timestamp -> candle
    pub candles_1h: MapView<String, Vec<Candle>>,
    
    /// 24-hour candles: timestamp -> candle
    pub candles_24h: MapView<String, Vec<Candle>>,
    
    /// User alerts: user_id -> alerts
    pub alerts: MapView<String, Vec<AlertConfig>>,
    
    /// Oracle reputation tracking: source -> reputation
    pub oracle_stats: MapView<String, OracleReputation>,
    
    /// Total queries counter
    pub total_queries: RegisterView<u64>,
    
    /// Active subscriptions counter
    pub active_subscriptions: RegisterView<u64>,
}
