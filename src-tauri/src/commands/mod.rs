// src-tauri/src/commands/mod.rs - Tauri Commands
use tauri::State;
use std::sync::Mutex;
use crate::AppState;
use serde::{Serialize, Deserialize};

pub mod document_commands;
pub mod pst_commands; 
pub mod onnx_commands;
pub mod database_commands;

// Re-export all commands
pub use document_commands::*;
pub use pst_commands::*;
pub use onnx_commands::*;
pub use database_commands::*;

// Ordnerauswahl-Command (vereinfacht)
#[tauri::command]
pub async fn select_folder(title: Option<String>) -> Result<Option<String>, String> {
    log::info!("Ordnerauswahl angefordert: {:?}", title);
    
    // Für jetzt verwenden wir einen festen Pfad - kann später durch echte Dialog-API ersetzt werden
    // Der Benutzer kann den Pfad manuell eingeben oder wir implementieren eine andere Lösung
    Ok(Some("C:\\Users\\frank\\Documents".to_string()))
}

// Common Data Structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub file_type: String,
    pub created: String,
    pub modified: String,
    pub content_preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub document_path: String,
    pub title: String,
    pub content_snippet: String,
    pub relevance_score: f32,
    pub file_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PSTEmailInfo {
    pub subject: String,
    pub sender: String,
    pub recipient: String,
    pub date: String,
    pub body_preview: String,
    pub has_attachments: bool,
    pub attachment_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryResult {
    pub original_length: usize,
    pub summary_length: usize,
    pub summary_text: String,
    pub key_points: Vec<String>,
    pub language_detected: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResult {
    pub source_language: String,
    pub target_language: String,
    pub original_text: String,
    pub translated_text: String,
    pub confidence_score: f32,
}

// Helper function to get app state
pub fn get_app_state<'a>(state: &'a State<Mutex<AppState>>) -> Result<std::sync::MutexGuard<'a, AppState>, String> {
    state.lock().map_err(|e| format!("Failed to lock app state: {}", e))
}