// Funktionierendes parseDocument für main.js
async function parseDocument(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    console.log('Backend: Parse Dokument:', filePath, 'Typ:', ext);
    
    switch (ext) {
      case '.pdf': {
        // PDF mit pdf-parse - funktioniert jetzt!
        console.log('Backend: Verwende pdf-parse für PDF');
        
        const pdfBuffer = await fs.readFile(filePath);
        console.log('Backend: PDF-Buffer gelesen, Größe:', pdfBuffer.length);
        
        // Standard pdf-parse (funktioniert bereits perfekt)
        const pdfData = await pdfParse(pdfBuffer);
        
        console.log('Backend: PDF-Parse Ergebnis:');
        console.log('  - Seiten:', pdfData.numpages);
        console.log('  - Text-Länge:', pdfData.text?.length || 0);
        
        const extractedText = pdfData.text || '';
        const cleanText = extractedText.trim();
        
        if (cleanText.length === 0) {
          return {
            success: false,
            error: 'PDF enthält keinen extrahierbaren Text'
          };
        }
        
        console.log('Backend: PDF-Parse erfolgreich, Text-Länge:', cleanText.length);
        
        return {
          success: true,
          text: cleanText,
          metadata: {
            pages: pdfData.numpages,
            info: pdfData.info,
            extractionMethod: 'pdf-parse'
          }
        };
      }
      
      case '.docx': {
        // DOCX mit mammoth
        const docxBuffer = await fs.readFile(filePath);
        const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
        console.log('Backend: DOCX geparsed, Text-Länge:', docxResult.value.length);
        return {
          success: true,
          text: docxResult.value.trim(),
          metadata: {
            extractionMethod: 'mammoth',
            messages: docxResult.messages
          }
        };
      }
      
      case '.xlsx':
      case '.xls': {
        // Excel mit xlsx
        const workbook = XLSX.readFile(filePath);
        let excelText = '';
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const sheetText = XLSX.utils.sheet_to_txt(sheet);
          excelText += `=== ${sheetName} ===\n${sheetText}\n\n`;
        });
        console.log('Backend: Excel geparsed, Text-Länge:', excelText.length);
        return {
          success: true,
          text: excelText.trim(),
          metadata: {
            sheets: workbook.SheetNames.length,
            extractionMethod: 'xlsx'
          }
        };
      }
      
      case '.txt':
      case '.md':
      case '.json': {
        // Text-Dateien direkt lesen
        const textContent = await fs.readFile(filePath, 'utf-8');
        return {
          success: true,
          text: textContent,
          metadata: {
            extractionMethod: 'direct-read'
          }
        };
      }
      
      default:
        return {
          success: false,
          error: `Dateityp ${ext} wird nicht unterstützt`
        };
    }
    
  } catch (error) {
    console.error('Backend: Fehler beim Parsen:', filePath, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
