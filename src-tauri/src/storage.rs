use anyhow::Result;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredDocument {
    pub id: String,
    pub file_path: String,
    pub content: String,
    pub metadata: serde_json::Value,
    pub processed_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

pub struct DatabaseStorage {
    db_path: String,
}

impl DatabaseStorage {
    pub fn new(db_path: String) -> Self {
        Self { db_path }
    }

    pub fn initialize(&self) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT NOT NULL,
                processed_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                messages TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        Ok(())
    }

    pub fn store_document(&self, document: &crate::processors::ProcessedDocument) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        conn.execute(
            "INSERT OR REPLACE INTO documents (id, file_path, content, metadata, processed_at, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                document.id,
                document.file_path,
                document.content,
                serde_json::to_string(&document.metadata)?,
                document.processed_at.to_rfc3339(),
                Utc::now().to_rfc3339()
            ],
        )?;

        Ok(())
    }

    pub fn get_documents(&self) -> Result<Vec<StoredDocument>> {
        let conn = Connection::open(&self.db_path)?;
        let mut stmt = conn.prepare(
            "SELECT id, file_path, content, metadata, processed_at, created_at FROM documents ORDER BY created_at DESC"
        )?;

        let document_iter = stmt.query_map([], |row| {
            Ok(StoredDocument {
                id: row.get(0)?,
                file_path: row.get(1)?,
                content: row.get(2)?,
                metadata: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
                processed_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .unwrap_or_default()
                    .with_timezone(&Utc),
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                    .unwrap_or_default()
                    .with_timezone(&Utc),
            })
        })?;

        let mut documents = Vec::new();
        for document in document_iter {
            documents.push(document?);
        }

        Ok(documents)
    }

    pub fn search_documents(&self, query: &str) -> Result<Vec<StoredDocument>> {
        let conn = Connection::open(&self.db_path)?;
        let mut stmt = conn.prepare(
            "SELECT id, file_path, content, metadata, processed_at, created_at 
             FROM documents 
             WHERE content LIKE ?1 OR file_path LIKE ?1 
             ORDER BY created_at DESC"
        )?;

        let search_query = format!("%{}%", query);
        let document_iter = stmt.query_map(params![search_query], |row| {
            Ok(StoredDocument {
                id: row.get(0)?,
                file_path: row.get(1)?,
                content: row.get(2)?,
                metadata: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
                processed_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .unwrap_or_default()
                    .with_timezone(&Utc),
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                    .unwrap_or_default()
                    .with_timezone(&Utc),
            })
        })?;

        let mut documents = Vec::new();
        for document in document_iter {
            documents.push(document?);
        }

        Ok(documents)
    }
}
