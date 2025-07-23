import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testVisionAPI() {
  try {
    const imagePath = path.join(__dirname, 'temp/pdf-images/page-1.png');
    
    // Prüfe ob Bild existiert
    try {
      const stats = await fs.stat(imagePath);
      console.log(`Bildgröße: ${stats.size} bytes`);
    } catch (err) {
      console.error('Bild nicht gefunden:', imagePath);
      return;
    }
    
    // Bild laden und als Base64 kodieren
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    console.log(`Base64 Größe: ${base64Image.length} Zeichen`);
    
    // Vision API Request
    const visionRequest = {
      model: 'gemma3:latest', // Gemma3 wie vom Benutzer angewiesen
      prompt: 'Extrahiere allen sichtbaren Text aus diesem Bild. Gib nur den reinen Text zurück, keine Beschreibungen.',
      images: [base64Image],
      stream: false,
      options: {
        temperature: 0.1
      }
    };
    
    console.log('Sende Vision API Anfrage...');
    
    const response = await axios.post('http://localhost:11434/api/generate', visionRequest, {
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Vision API Response Status:', response.status);
    console.log('Response Data:', response.data);
    
    if (response.data && response.data.response) {
      console.log('=== EXTRAHIERTER TEXT ===');
      console.log(response.data.response);
      console.log('=== ENDE ===');
    } else {
      console.log('Keine Response erhalten');
    }
    
  } catch (error) {
    console.error('Vision API Fehler:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testVisionAPI();
