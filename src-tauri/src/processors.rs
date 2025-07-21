use std::path::Path;
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedDocument {
    pub id: String,
    pub file_path: String,
    pub content: String,
    pub metadata: DocumentMetadata,
    pub processed_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub file_name: String,
    pub file_size: u64,
    pub file_type: String,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub modified_at: Option<chrono::DateTime<chrono::Utc>>,
}

pub struct DocumentProcessor;

impl DocumentProcessor {
    pub fn new() -> Self {
        Self
    }

    pub async fn process_document(&self, file_path: &Path) -> Result<ProcessedDocument> {
        let metadata = self.extract_metadata(file_path)?;
        let content = self.extract_content(file_path).await?;
        
        let processed_doc = ProcessedDocument {
            id: uuid::Uuid::new_v4().to_string(),
            file_path: file_path.to_string_lossy().to_string(),
            content,
            metadata,
            processed_at: chrono::Utc::now(),
        };

        Ok(processed_doc)
    }

    fn extract_metadata(&self, file_path: &Path) -> Result<DocumentMetadata> {
        let metadata = std::fs::metadata(file_path)?;
        let file_name = file_path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        let file_type = file_path.extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        Ok(DocumentMetadata {
            file_name,
            file_size: metadata.len(),
            file_type,
            created_at: metadata.created().ok().map(|t| chrono::DateTime::from(t)),
            modified_at: metadata.modified().ok().map(|t| chrono::DateTime::from(t)),
        })
    }

    async fn extract_content(&self, file_path: &Path) -> Result<String> {
        let extension = file_path.extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase();

        match extension.as_str() {
            "pdf" => self.extract_pdf_content(file_path),
            "txt" => self.extract_text_content(file_path),
            _ => Ok(format!("Unsupported file type: {}", extension)),
        }
    }

    fn extract_pdf_content(&self, file_path: &Path) -> Result<String> {
        match pdf_extract::extract_text(file_path) {
            Ok(content) => Ok(content),
            Err(e) => {
                log::warn!("Failed to extract PDF content: {}", e);
                Ok(format!("Failed to extract PDF content: {}", e))
            }
        }
    }

    fn extract_text_content(&self, file_path: &Path) -> Result<String> {
        Ok(std::fs::read_to_string(file_path)?)
    }
}
