import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

async function testPdfParse() {
  try {
    console.log('PDF-Parse Test gestartet...');
    
    // Prüfe verfügbare PDF-Dateien im Documents-Ordner
    const documentsPath = 'c:/Users/frank/Documents';
    const files = fs.readdirSync(documentsPath);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    console.log('Gefundene PDF-Dateien:', pdfFiles);
    
    if (pdfFiles.length === 0) {
      console.log('Keine PDF-Dateien im Documents-Ordner gefunden');
      return;
    }
    
    // Teste die erste PDF-Datei
    const pdfPath = `${documentsPath}/${pdfFiles[0]}`;
    console.log('Teste PDF:', pdfPath);
    
    const buffer = fs.readFileSync(pdfPath);
    console.log('Buffer-Größe:', buffer.length);
    
    // Standard pdf-parse
    console.log('\n=== Standard pdf-parse ===');
    const result1 = await pdfParse(buffer);
    console.log('Seiten:', result1.numpages);
    console.log('Text-Länge:', result1.text?.length || 0);
    console.log('Text-Anfang:', result1.text?.substring(0, 200) || 'KEIN TEXT');
    
    // Alternative Optionen
    console.log('\n=== Mit normalizeWhitespace: true ===');
    const result2 = await pdfParse(buffer, { normalizeWhitespace: true });
    console.log('Text-Länge:', result2.text?.length || 0);
    console.log('Text-Anfang:', result2.text?.substring(0, 200) || 'KEIN TEXT');
    
    // Weitere Optionen
    console.log('\n=== Mit disableCombineTextItems: true ===');
    const result3 = await pdfParse(buffer, { disableCombineTextItems: true });
    console.log('Text-Länge:', result3.text?.length || 0);
    console.log('Text-Anfang:', result3.text?.substring(0, 200) || 'KEIN TEXT');
    
    // Kombinierte Optionen
    console.log('\n=== Kombinierte Optionen ===');
    const result4 = await pdfParse(buffer, { 
      normalizeWhitespace: true, 
      disableCombineTextItems: true 
    });
    console.log('Text-Länge:', result4.text?.length || 0);
    console.log('Text-Anfang:', result4.text?.substring(0, 200) || 'KEIN TEXT');
    
    console.log('\n=== PDF-Info ===');
    console.log('Info:', result1.info);
    console.log('Metadata:', result1.metadata);
    
  } catch (error) {
    console.error('Fehler beim PDF-Test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPdfParse();
