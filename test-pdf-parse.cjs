const pdfParse = require('pdf-parse');
const fs = require('fs');

async function testPdfParse() {
  try {
    const pdfPath = 'C:\\Users\\frank\\Downloads\\ntv.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log('Buffer Größe:', pdfBuffer.length);
    
    const pdfData = await pdfParse(pdfBuffer);
    console.log('Seiten:', pdfData.numpages);
    console.log('Text-Länge:', pdfData.text.length);
    console.log('Text Preview:', pdfData.text.substring(0, 500));
    
  } catch (error) {
    console.error('Fehler:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPdfParse();
