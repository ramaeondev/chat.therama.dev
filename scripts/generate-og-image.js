import { createCanvas, loadImage, registerFont } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create images directory if it doesn't exist
const outputDir = join(__dirname, '../src/assets/images');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Canvas dimensions (1200x630 is recommended for OG images)
const width = 1200;
const height = 630;

// Create canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background gradient
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#4f46e5');
gradient.addColorStop(1, '#7c3aed');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add text
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';

// Title
ctx.font = 'bold 72px Arial';
ctx.fillText('QuickChat', width / 2, 280);

// Subtitle
ctx.font = '36px Arial';
ctx.globalAlpha = 0.9;
ctx.fillText('Fast and Secure Messaging', width / 2, 350);

// Add a simple chat bubble
ctx.beginPath();
ctx.moveTo(900, 400);
ctx.lineTo(1000, 350);
ctx.lineTo(1100, 400);
ctx.fillStyle = '#ffffff';
ctx.fill();

// Save the image
const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
const outputPath = join(outputDir, 'og-image.jpg');
writeFileSync(outputPath, buffer);

console.log(`OG image generated at: ${outputPath}`);
