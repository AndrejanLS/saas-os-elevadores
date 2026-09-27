import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const templateBytes = fs.readFileSync('./public/template-os.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);
const pages = pdfDoc.getPages();
const page1 = pages[0];

const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

// Grade mais fina: 20pts
for (let y = 0; y <= 842; y += 20) {
  page1.drawLine({ start: { x: 0, y }, end: { x: 595, y }, thickness: 0.2, color: rgb(0.9, 0.9, 0.9) });
  if (y % 100 === 0) {
    page1.drawText(`${y}`, { x: 5, y: y + 2, size: 5, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
  }
}
for (let x = 0; x <= 595; x += 20) {
  page1.drawLine({ start: { x, y: 0 }, end: { x, y: 842 }, thickness: 0.2, color: rgb(0.9, 0.9, 0.9) });
  if (x % 100 === 0) {
    page1.drawText(`${x}`, { x: x + 2, y: 5, size: 5, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
  }
}

// Linhas de referência horizontais em Y-chave
const keyY = [820, 800, 780, 760, 740, 720, 700, 680, 660, 640, 620, 600, 580, 560, 540, 520, 500, 480, 460, 440, 420, 400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200, 180, 160, 140, 120, 100, 80, 60, 40, 20];
for (const y of keyY) {
  page1.drawLine({ start: { x: 0, y }, end: { x: 595, y }, thickness: 0.5, color: rgb(0.8, 0.2, 0.2) });
  page1.drawText(`Y=${y}`, { x: 2, y: y + 1, size: 5, font: helvetica, color: rgb(0.8, 0.2, 0.2) });
}

const pdfBytes = await pdfDoc.save();
fs.writeFileSync('./public/template-debug-v2.pdf', pdfBytes);
console.log('Debug template v2 saved');
