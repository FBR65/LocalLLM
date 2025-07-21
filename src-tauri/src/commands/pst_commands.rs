// src-tauri/src/commands/pst_commands.rs - PST-Dateien (Outlook) Verarbeitung
use super::*;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PSTScanResult {
    pub pst_file_path: String,
    pub total_emails: usize,
    pub date_range: (String, String),
    pub folders: Vec<String>,
    pub size_mb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailSearchFilter {
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub sender_filter: Option<String>,
    pub subject_contains: Option<String>,
    pub has_attachments: Option<bool>,
    pub folder_name: Option<String>,
}

#[tauri::command]
pub async fn scan_pst_files(
    pst_directory: String,
    state: State<'_, Mutex<AppState>>
) -> Result<Vec<PSTScanResult>, String> {
    {
            let _app_state = get_app_state(&state)?;
        log::info!("📧 Scanning PST files in: {}", pst_directory);
    }
    
    let pst_dir = Path::new(&pst_directory);
    if !pst_dir.exists() {
        return Err(format!("PST-Verzeichnis nicht gefunden: {}", pst_directory));
    }

    let mut pst_results = Vec::new();
    
    // Alle .pst Dateien im Verzeichnis finden
    if let Ok(entries) = fs::read_dir(pst_dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    let path = entry.path();
                    
                    if let Some(extension) = path.extension().and_then(|s| s.to_str()) {
                        if extension.to_lowercase() == "pst" {
                            let scan_result = analyze_pst_file(&path).await?;
                            pst_results.push(scan_result);
                        }
                    }
                }
            }
        }
    }

    log::info!("✅ Found {} PST files", pst_results.len());
    Ok(pst_results)
}

#[tauri::command]
pub async fn extract_pst_emails(
    pst_file_path: String,
    _folder_filter: Option<String>,
    limit: Option<usize>,
    _state: State<'_, Mutex<AppState>>
) -> Result<Vec<PSTEmailInfo>, String> {
    log::info!("📨 Extracting emails from: {}", pst_file_path);
    
    let path = Path::new(&pst_file_path);
    if !path.exists() {
        return Err(format!("PST-Datei nicht gefunden: {}", pst_file_path));
    }

    // Phase 4: Echte PST-Extraktion mit `pst` crate
    // Für jetzt: Mock-Daten zurückgeben
    let mock_emails = create_mock_pst_emails(limit.unwrap_or(100));
    
    Ok(mock_emails)
}

#[tauri::command]
pub async fn search_pst_content(
    query: String,
    pst_file_path: String,
    search_filter: EmailSearchFilter,
    state: State<'_, Mutex<AppState>>
) -> Result<Vec<PSTEmailInfo>, String> {
    log::info!("🔍 Searching PST content for: '{}'", query);
    
    // Emails extrahieren
    let emails = extract_pst_emails(pst_file_path, search_filter.folder_name.clone(), Some(1000), state).await?;
    
    let mut filtered_emails = Vec::new();
    let query_lower = query.to_lowercase();

    for email in emails {
        // Text-Suche in Subject und Body
        let matches_text = email.subject.to_lowercase().contains(&query_lower) ||
                          email.body_preview.to_lowercase().contains(&query_lower) ||
                          email.sender.to_lowercase().contains(&query_lower);

        // Filter anwenden
        let matches_filter = apply_email_filter(&email, &search_filter);

        if matches_text && matches_filter {
            filtered_emails.push(email);
        }
    }

    log::info!("✅ Found {} matching emails", filtered_emails.len());
    Ok(filtered_emails)
}

#[tauri::command]
pub async fn extract_pst_attachments(
    pst_file_path: String,
    output_directory: String,
    _email_filter: Option<EmailSearchFilter>,
    _state: State<'_, Mutex<AppState>>
) -> Result<Vec<String>, String> {
    log::info!("📎 Extracting attachments from: {}", pst_file_path);
    
    // Ausgabe-Verzeichnis erstellen
    let output_dir = Path::new(&output_directory);
    std::fs::create_dir_all(output_dir)
        .map_err(|e| format!("Fehler beim Erstellen des Ausgabe-Verzeichnisses: {}", e))?;

    // Phase 4: Echte Anhang-Extraktion
    // Für jetzt: Mock-Pfade zurückgeben
    let mock_attachments = vec![
        format!("{}/dokument_2024_01_15.pdf", output_directory),
        format!("{}/bericht_quartal_q4.docx", output_directory),
        format!("{}/budget_2024.xlsx", output_directory),
    ];

    log::info!("✅ Extracted {} attachments", mock_attachments.len());
    Ok(mock_attachments)
}

// Helper Functions
async fn analyze_pst_file(pst_path: &Path) -> Result<PSTScanResult, String> {
    let metadata = fs::metadata(pst_path)
        .map_err(|e| format!("Fehler beim Lesen der PST-Metadaten: {}", e))?;

    let size_mb = metadata.len() as f64 / (1024.0 * 1024.0);
    
    // Phase 4: Echte PST-Analyse
    // Für jetzt: Mock-Daten
    Ok(PSTScanResult {
        pst_file_path: pst_path.to_string_lossy().to_string(),
        total_emails: 2847, // Mock
        date_range: ("2020-01-01".to_string(), "2024-12-31".to_string()),
        folders: vec![
            "Posteingang".to_string(),
            "Gesendet".to_string(),
            "Entwürfe".to_string(),
            "Projekte".to_string(),
            "Archiv".to_string(),
        ],
        size_mb,
    })
}

fn create_mock_pst_emails(limit: usize) -> Vec<PSTEmailInfo> {
    let mock_subjects = vec![
        "Projektbesprechung nächste Woche",
        "Quartalsbericht Q4 2024",
        "Re: Budget-Planung 2025", 
        "Urlaubsantrag - Frank Reis",
        "Neue ONNX-Modelle verfügbar",
        "Meeting-Protokoll vom 15.01.2025",
        "Vertragsentwurf zur Prüfung",
        "Re: Tauri Desktop App Status",
    ];

    let mock_senders = vec![
        "kollege@firma.de",
        "chef@unternehmen.com",
        "kunde@projekt.org",
        "partner@software.net",
    ];

    (0..limit.min(mock_subjects.len() * 10))
        .map(|i| {
            let subject_idx = i % mock_subjects.len();
            let sender_idx = i % mock_senders.len();
            
            PSTEmailInfo {
                subject: mock_subjects[subject_idx].to_string(),
                sender: mock_senders[sender_idx].to_string(),
                recipient: "frank@localllm.de".to_string(),
                date: format!("2024-{:02}-{:02}", (i % 12) + 1, (i % 28) + 1),
                body_preview: format!("E-Mail Inhalt Preview für: {}. Hier würde der echte E-Mail-Text stehen...", mock_subjects[subject_idx]),
                has_attachments: i % 3 == 0, // Jede 3. E-Mail hat Anhänge
                attachment_count: if i % 3 == 0 { (i % 3) + 1 } else { 0 },
            }
        })
        .collect()
}

fn apply_email_filter(email: &PSTEmailInfo, filter: &EmailSearchFilter) -> bool {
    // Datum-Filter
    if let Some(date_from) = &filter.date_from {
        if email.date < *date_from {
            return false;
        }
    }
    
    if let Some(date_to) = &filter.date_to {
        if email.date > *date_to {
            return false;
        }
    }

    // Absender-Filter
    if let Some(sender_filter) = &filter.sender_filter {
        if !email.sender.to_lowercase().contains(&sender_filter.to_lowercase()) {
            return false;
        }
    }

    // Subject-Filter
    if let Some(subject_contains) = &filter.subject_contains {
        if !email.subject.to_lowercase().contains(&subject_contains.to_lowercase()) {
            return false;
        }
    }

    // Anhang-Filter
    if let Some(has_attachments) = filter.has_attachments {
        if email.has_attachments != has_attachments {
            return false;
        }
    }

    true
}