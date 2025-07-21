// src-tauri/src/main.rs - Desktop App Entry Point
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(dead_code)] // Erlaube ungenutzte Funktionen für Development

use tauri::Manager;
use std::sync::Mutex;
use std::path::PathBuf;

mod commands;
mod processors;
mod storage;

use commands::*;

// App State für globale Daten
#[derive(Debug, Default)]
pub struct AppState {
    pub models_dir: PathBuf,
    pub documents_dir: PathBuf,
    pub pst_files_dir: PathBuf,
    pub current_model: Option<String>,
    pub database_path: PathBuf,
}

#[tauri::command]
async fn greet(name: &str) -> Result<String, String> {
    Ok(format!("Hallo {}, willkommen bei LocalLLM Desktop! 🚀", name))
}

// App-Verzeichnisse initialisieren
fn setup_app_directories() -> Result<AppState, Box<dyn std::error::Error>> {
    let app_data_dir = dirs::data_local_dir()
        .ok_or("Could not find local app data directory")?
        .join("LocalLLM");

    // Erstelle Verzeichnisse falls sie nicht existieren
    std::fs::create_dir_all(&app_data_dir)?;
    
    let models_dir = app_data_dir.join("models");
    let documents_dir = app_data_dir.join("documents");
    let pst_files_dir = app_data_dir.join("pst_files");
    let database_path = app_data_dir.join("localllm.db");

    std::fs::create_dir_all(&models_dir)?;
    std::fs::create_dir_all(&documents_dir)?;
    std::fs::create_dir_all(&pst_files_dir)?;

    Ok(AppState {
        models_dir,
        documents_dir,
        pst_files_dir,
        current_model: None,
        database_path,
    })
}

fn main() {
    // Logging Setup
    env_logger::init();
    
    // App State initialisieren
    let app_state = setup_app_directories()
        .expect("Failed to setup app directories");

    log::info!("🚀 Starting LocalLLM Desktop...");
    log::info!("📁 Models dir: {:?}", app_state.models_dir);
    log::info!("📄 Documents dir: {:?}", app_state.documents_dir);
    log::info!("📧 PST files dir: {:?}", app_state.pst_files_dir);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(app_state))
        .invoke_handler(tauri::generate_handler![
            greet,
            select_folder,
            // Document Commands
            scan_documents_folder,
            get_document_content,
            open_document_with_default_app,
            summarize_document,
            search_documents,
            // PST Commands  
            scan_pst_files,
            extract_pst_emails,
            search_pst_content,
            // ONNX Commands
            get_available_models,
            download_model_from_huggingface,
            load_german_model,
            generate_german_text,
            translate_text,
            // Database Commands
            init_database,
            save_conversation,
            load_conversations,
        ])
        .setup(|app| {
            // Window-Konfiguration
            let window = app.get_webview_window("main").unwrap();
            window.set_title("LocalLLM Desktop - Deutsche KI für Dokumente & PST-Dateien")?;
            
            // DevTools nur bei expliziter Anfrage öffnen
            // #[cfg(debug_assertions)]
            // window.open_devtools();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}