// src-tauri/src/commands/database_commands.rs - SQLite-Datenbank-Management
use super::*;
use rusqlite::Connection;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationRecord {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub model_used: String,
    pub message_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageRecord {
    pub id: String,
    pub conversation_id: String,
    pub role: String, // "user" oder "assistant"
    pub content: String,
    pub timestamp: String,
    pub tokens_used: Option<usize>,
}

#[tauri::command]
pub async fn init_database(
    state: State<'_, Mutex<AppState>>
) -> Result<String, String> {
    let app_state = get_app_state(&state)?;
    
    log::info!("🗄️ Initializing SQLite database");
    
    let db_path = &app_state.database_path;
    
    // Verbindung zur SQLite-Datenbank herstellen
    let conn = Connection::open(db_path)
        .map_err(|e| format!("Fehler beim Öffnen der Datenbank: {}", e))?;

    // Tabellen erstellen
    conn.execute(
        "CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            model_used TEXT NOT NULL,
            message_count INTEGER DEFAULT 0
        )",
        [],
    ).map_err(|e| format!("Fehler beim Erstellen der Conversations-Tabelle: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            tokens_used INTEGER,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        )",
        [],
    ).map_err(|e| format!("Fehler beim Erstellen der Messages-Tabelle: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            indexed_at TEXT NOT NULL,
            content_preview TEXT,
            embedding_vector BLOB
        )",
        [],
    ).map_err(|e| format!("Fehler beim Erstellen der Documents-Tabelle: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS pst_emails (
            id TEXT PRIMARY KEY,
            pst_file_path TEXT NOT NULL,
            subject TEXT NOT NULL,
            sender TEXT NOT NULL,
            recipient TEXT NOT NULL,
            date_sent TEXT NOT NULL,
            body_content TEXT,
            has_attachments BOOLEAN NOT NULL,
            attachment_count INTEGER DEFAULT 0,
            folder_name TEXT,
            indexed_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| format!("Fehler beim Erstellen der PST-Emails-Tabelle: {}", e))?;

    // Indizes für bessere Performance
    conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id)", [])
        .map_err(|e| format!("Fehler beim Erstellen des Message-Index: {}", e))?;
    
    conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_path ON documents (file_path)", [])
        .map_err(|e| format!("Fehler beim Erstellen des Document-Index: {}", e))?;
    
    conn.execute("CREATE INDEX IF NOT EXISTS idx_pst_sender ON pst_emails (sender)", [])
        .map_err(|e| format!("Fehler beim Erstellen des PST-Sender-Index: {}", e))?;

    log::info!("✅ Database initialized successfully");
    Ok("✅ Datenbank erfolgreich initialisiert".to_string())
}

#[tauri::command]
pub async fn save_conversation(
    conversation: ConversationRecord,
    messages: Vec<MessageRecord>,
    state: State<'_, Mutex<AppState>>
) -> Result<String, String> {
    let app_state = get_app_state(&state)?;
    
    log::info!("💾 Saving conversation: {}", conversation.title);
    
    let conn = Connection::open(&app_state.database_path)
        .map_err(|e| format!("Datenbankfehler: {}", e))?;

    // Transaktion starten
    let tx = conn.unchecked_transaction()
        .map_err(|e| format!("Transaktionsfehler: {}", e))?;

    // Conversation speichern/aktualisieren
    tx.execute(
        "INSERT OR REPLACE INTO conversations 
         (id, title, created_at, updated_at, model_used, message_count) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        [
            &conversation.id,
            &conversation.title,
            &conversation.created_at,
            &conversation.updated_at,
            &conversation.model_used,
            &conversation.message_count.to_string(),
        ],
    ).map_err(|e| format!("Fehler beim Speichern der Conversation: {}", e))?;

    // Messages speichern
    for message in messages {
        tx.execute(
            "INSERT OR REPLACE INTO messages 
             (id, conversation_id, role, content, timestamp, tokens_used) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            [
                &message.id,
                &message.conversation_id,
                &message.role,
                &message.content,
                &message.timestamp,
                &message.tokens_used.map_or("".to_string(), |t| t.to_string()),
            ],
        ).map_err(|e| format!("Fehler beim Speichern der Message: {}", e))?;
    }

    // Transaktion bestätigen
    tx.commit().map_err(|e| format!("Commit-Fehler: {}", e))?;

    log::info!("✅ Conversation saved successfully");
    Ok("✅ Conversation erfolgreich gespeichert".to_string())
}

#[tauri::command]
pub async fn load_conversations(
    limit: Option<usize>,
    state: State<'_, Mutex<AppState>>
) -> Result<Vec<ConversationRecord>, String> {
    let app_state = get_app_state(&state)?;
    
    log::info!("📚 Loading conversations from database");
    
    let conn = Connection::open(&app_state.database_path)
        .map_err(|e| format!("Datenbankfehler: {}", e))?;

    let limit_clause = if let Some(l) = limit {
        format!(" LIMIT {}", l)
    } else {
        "".to_string()
    };

    let mut stmt = conn.prepare(&format!(
        "SELECT id, title, created_at, updated_at, model_used, message_count 
         FROM conversations 
         ORDER BY updated_at DESC{}",
        limit_clause
    )).map_err(|e| format!("SQL-Vorbereitung fehlgeschlagen: {}", e))?;

    let conversation_iter = stmt.query_map([], |row| {
        Ok(ConversationRecord {
            id: row.get(0)?,
            title: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
            model_used: row.get(4)?,
            message_count: row.get(5)?,
        })
    }).map_err(|e| format!("Query-Ausführung fehlgeschlagen: {}", e))?;

    let mut conversations = Vec::new();
    for conversation in conversation_iter {
        conversations.push(conversation.map_err(|e| format!("Row-Parsing fehlgeschlagen: {}", e))?);
    }

    log::info!("✅ Loaded {} conversations", conversations.len());
    Ok(conversations)
}

#[tauri::command]
pub async fn load_conversation_messages(
    conversation_id: String,
    state: State<'_, Mutex<AppState>>
) -> Result<Vec<MessageRecord>, String> {
    let app_state = get_app_state(&state)?;
    
    log::info!("💬 Loading messages for conversation: {}", conversation_id);
    
    let conn = Connection::open(&app_state.database_path)
        .map_err(|e| format!("Datenbankfehler: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, conversation_id, role, content, timestamp, tokens_used 
         FROM messages 
         WHERE conversation_id = ?1 
         ORDER BY timestamp ASC"
    ).map_err(|e| format!("SQL-Vorbereitung fehlgeschlagen: {}", e))?;

    let message_iter = stmt.query_map([conversation_id], |row| {
        let tokens_used: Option<i64> = row.get(5)?;
        Ok(MessageRecord {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            timestamp: row.get(4)?,
            tokens_used: tokens_used.map(|t| t as usize),
        })
    }).map_err(|e| format!("Query-Ausführung fehlgeschlagen: {}", e))?;

    let mut messages = Vec::new();
    for message in message_iter {
        messages.push(message.map_err(|e| format!("Row-Parsing fehlgeschlagen: {}", e))?);
    }

    log::info!("✅ Loaded {} messages", messages.len());
    Ok(messages)
}

#[tauri::command]
pub async fn search_conversation_history(
    query: String,
    limit: Option<usize>,
    state: State<'_, Mutex<AppState>>
) -> Result<Vec<MessageRecord>, String> {
    let app_state = get_app_state(&state)?;
    
    log::info!("🔍 Searching conversation history for: '{}'", query);
    
    let conn = Connection::open(&app_state.database_path)
        .map_err(|e| format!("Datenbankfehler: {}", e))?;

    let limit_clause = if let Some(l) = limit {
        format!(" LIMIT {}", l)
    } else {
        " LIMIT 50".to_string()
    };

    let mut stmt = conn.prepare(&format!(
        "SELECT id, conversation_id, role, content, timestamp, tokens_used 
         FROM messages 
         WHERE content LIKE '%' || ?1 || '%' 
         ORDER BY timestamp DESC{}",
        limit_clause
    )).map_err(|e| format!("SQL-Vorbereitung fehlgeschlagen: {}", e))?;

    let message_iter = stmt.query_map([query], |row| {
        let tokens_used: Option<i64> = row.get(5)?;
        Ok(MessageRecord {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            timestamp: row.get(4)?,
            tokens_used: tokens_used.map(|t| t as usize),
        })
    }).map_err(|e| format!("Query-Ausführung fehlgeschlagen: {}", e))?;

    let mut messages = Vec::new();
    for message in message_iter {
        messages.push(message.map_err(|e| format!("Row-Parsing fehlgeschlagen: {}", e))?);
    }

    log::info!("✅ Found {} matching messages", messages.len());
    Ok(messages)
}
