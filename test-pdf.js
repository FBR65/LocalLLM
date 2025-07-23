import pdfPoppler from 'pdf-poppler';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testPdfConversion() {
  const testPdf = 'c:\\Users\\frank\\Documents\\antrag.pdf';
  const tempDir = path.join(__dirname, 'temp/pdf-images');
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    
    const options = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: 'page',
      page: null
    };
    
    console.log('Teste PDF Konvertierung...');
    const result = await pdfPoppler.convert(testPdf, options);
    console.log('Poppler Result:', result);
    
    const files = await fs.readdir(tempDir);
    console.log('Erstellte Dateien:', files);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      console.log(`Datei: ${file}, Größe: ${stats.size} bytes`);
    }
  } catch (error) {
    console.error('Fehler:', error.message);
  }
}

testPdfConversion();
