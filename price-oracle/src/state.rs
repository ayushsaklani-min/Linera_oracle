use linera_sdk::views::{MapView, RegisterView, RootView, ViewStorageContext};
use crate::PriceData;

/// The application state.
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct PriceOracle {
    pub prices: MapView<String, PriceData>,
    pub latest_price: RegisterView<Option<PriceData>>,
}
