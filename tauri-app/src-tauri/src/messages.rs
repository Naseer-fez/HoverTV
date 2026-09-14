// MIRROR OF: extension/src/types/messages.ts
use serde::{Deserialize, Serialize};

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum ExtensionMessage {
    PLAY_URL {
        url: String,
        #[serde(default)]
        title: Option<String>,
        source: String,
    },
    SYNC_STATE {
        state: String,
    },
    SOURCE_LOST,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum AppMessage {
    READY,
    STATUS {
        status: String,
    },
}
