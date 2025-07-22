// src-tauri/src/commands/document_commands.rs - Dokument-Verarbeitung
use super::*;
use std::fs;
use std::path::Path;
use chrono::{DateTime, Utc};

#[tauri::command]
pub async fn scan_documents_folder(
    folder_path: String,
    state: State<'_, Mutex<AppState>>
) -> Result<Vec<DocumentInfo>, String> {
    let _app_state = get_app_state(&state)?;
    
    log::info!("📁 Scanning documents in: {}", folder_path);
    
    let folder = Path::new(&folder_path);
    if !folder.exists() {
        return Err(format!("Ordner nicht gefunden: {}", folder_path));
    }

    let mut documents = Vec::new();
    
    // Rekursiv alle unterstützten Dateien scannen
    if let Ok(entries) = fs::read_dir(folder) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    let path = entry.path();
                    
                    // Nur unterstützte Dateitypen
                    if let Some(extension) = path.extension().and_then(|s| s.to_str()) {
                        let ext_lower = extension.to_lowercase();
                        
                        if matches!(ext_lower.as_str(), "pdf" | "txt" | "doc" | "docx" | "rtf" | "md") {
                            let doc_info = create_document_info(&path, &metadata)?;
                            documents.push(doc_info);
                        }
                    }
                }
            }
        }
    }

    log::info!("✅ Found {} documents", documents.len());
    Ok(documents)
}

#[tauri::command]
pub async fn get_document_content(
    file_path: String,
    _state: State<'_, Mutex<AppState>>
) -> Result<String, String> {
    log::info!("📄 Reading document: {}", file_path);
    
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Datei nicht gefunden: {}", file_path));
    }

    // Je nach Dateityp unterschiedlich verarbeiten
    let extension = path.extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "txt" | "md" => {
            fs::read_to_string(path)
                .map_err(|e| format!("Fehler beim Lesen der Textdatei: {}", e))
        },
        "pdf" => {
            // TODO: PDF-Extraktion mit pdf-extract
            Ok("PDF-Inhalt wird in Phase 3 implementiert".to_string())
        },
        "doc" | "docx" => {
            // TODO: Office-Docs mit calamine
            Ok("Office-Dokument-Inhalt wird in Phase 3 implementiert".to_string())
        },
        _ => Err(format!("Nicht unterstützter Dateityp: {}", extension))
    }
}

#[tauri::command]
pub async fn open_document_with_default_app(
    file_path: String
) -> Result<(), String> {
    log::info!("🚀 Opening document with default app: {}", file_path);
    
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Datei nicht gefunden: {}", file_path));
    }

    // Windows: Verwende Windows Explorer für bessere Datei-Zuordnung
    #[cfg(target_os = "windows")]
    {
        match std::process::Command::new("explorer")
            .arg(&file_path)
            .spawn()
        {
            Ok(_) => {
                log::info!("Document opened successfully");
                Ok(())
            },
            Err(e) => {
                log::error!("Failed to open document: {}", e);
                Err(format!("Fehler beim Öffnen der Datei: {}", e))
            }
        }
    }
    
    // macOS: Verwende 'open' Command
    #[cfg(target_os = "macos")]
    {
        match std::process::Command::new("open")
            .arg(&file_path)
            .spawn()
        {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Fehler beim Öffnen der Datei: {}", e))
        }
    }
    
    // Linux: Verwende 'xdg-open'
    #[cfg(target_os = "linux")]
    {
        match std::process::Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
        {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Fehler beim Öffnen der Datei: {}", e))
        }
    }
}

#[tauri::command]
pub async fn summarize_document(
    file_path: String,
    max_sentences: Option<usize>,
    state: State<'_, Mutex<AppState>>
) -> Result<SummaryResult, String> {
    log::info!("📝 Summarizing document: {}", file_path);
    
    // Content laden
    let content = get_document_content(file_path.clone(), state).await?;
    
    if content.is_empty() {
        return Err("Dokument ist leer".to_string());
    }

    // Einfache deutsche Zusammenfassung (Phase 2: ONNX-Modell)
    let max_sent = max_sentences.unwrap_or(3);
    let sentences: Vec<&str> = content.split('.').take(max_sent).collect();
    let summary = sentences.join(". ") + ".";

    Ok(SummaryResult {
        original_length: content.len(),
        summary_length: summary.len(),
        summary_text: summary,
        key_points: vec![
            "Wichtiger Punkt 1 (wird mit ONNX-Modell extrahiert)".to_string(),
            "Wichtiger Punkt 2 (wird mit ONNX-Modell extrahiert)".to_string(),
        ],
        language_detected: "deutsch".to_string(),
    })
}

#[tauri::command]
pub async fn search_documents(
    query: String,
    folder_path: String,
    state: State<'_, Mutex<AppState>>
) -> Result<Vec<SearchResult>, String> {
    log::info!("🔍 Searching documents for: '{}'", query);
    
    // Dokumente scannen
    let documents = scan_documents_folder(folder_path, state).await?;
    
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();

    // Einfache Textsuche (Phase 3: Vector Search)
    for doc in documents {
        let content = fs::read_to_string(&doc.path).unwrap_or_default();
        
        if content.to_lowercase().contains(&query_lower) || 
           doc.name.to_lowercase().contains(&query_lower) {
            
            // Content-Snippet erstellen
            let snippet = create_content_snippet(&content, &query, 200);
            
            results.push(SearchResult {
                document_path: doc.path,
                title: doc.name,
                content_snippet: snippet,
                relevance_score: 0.8, // Placeholder
                file_type: doc.file_type,
            });
        }
    }

    Ok(results)
}

// Helper Functions
fn create_document_info(path: &Path, metadata: &fs::Metadata) -> Result<DocumentInfo, String> {
    let name = path.file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let file_type = path.extension()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_uppercase();

    // Content Preview (erste 200 Zeichen)
    let content_preview = if file_type == "TXT" || file_type == "MD" {
        fs::read_to_string(path)
            .unwrap_or_default()
            .chars()
            .take(200)
            .collect::<String>()
    } else {
        format!("{}-Datei (Vorschau in Phase 3 verfügbar)", file_type)
    };

    Ok(DocumentInfo {
        path: path.to_string_lossy().to_string(),
        name,
        size: metadata.len(),
        file_type,
        created: format!("{:?}", metadata.created().unwrap_or(std::time::SystemTime::UNIX_EPOCH)),
        modified: format!("{:?}", metadata.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH)),
        content_preview,
    })
}

fn create_content_snippet(content: &str, query: &str, max_length: usize) -> String {
    let query_lower = query.to_lowercase();
    
    if let Some(pos) = content.to_lowercase().find(&query_lower) {
        let start = pos.saturating_sub(max_length / 2);
        let end = (start + max_length).min(content.len());
        
        let snippet = &content[start..end];
        format!("...{}...", snippet)
    } else {
        content.chars().take(max_length).collect::<String>() + "..."
    }
}