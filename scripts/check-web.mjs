import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'package.json',
  'capacitor.config.json',
  'www/index.html',
  'www/assets/app.css',
  'www/assets/app.js'
];

console.log('=== KIEM TRA TINH DAY DU CUA MA NGUON WEB & CAPACITOR ===');
let missing = false;

for (const relPath of requiredFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.error('[LOI THIEU FILE]:', relPath);
    missing = true;
  } else {
    const stat = fs.statSync(fullPath);
    console.log('[OK]:', relPath, '(' + stat.size + ' bytes)');
  }
}

if (missing) {
  console.error('Kiem tra that bai! Vui long dam bao day du cac file truoc khi build IPA.');
  process.exit(1);
}
console.log('Tat ca file hop le! San sang dong bo sang du an Xcode iOS 16.2.');
