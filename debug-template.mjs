import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const templateBytes = fs.readFileSync('./public/template-os.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);
const pages = pdfDoc.getPages();
const page1 = pages[0];

const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

// Desenha grade de referência para medir coordenadas
for (let y = 0; y <= 842; y += 50) {
  page1.drawLine({ start: { x: 0, y }, end: { x: 595, y }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
  page1.drawText(`${y}`, { x: 5, y: y + 2, size: 6, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
}
for (let x = 0; x <= 595; x += 50) {
  page1.drawLine({ start: { x, y: 0 }, end: { x, y: 842 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
  page1.drawText(`${x}`, { x: x + 2, y: 5, size: 6, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
}

// Marca posições chave
const positions = [
  { label: "TÍTULO OS", x: 550, y: 795 },
  { label: "REF", x: 550, y: 782 },
  { label: "STATUS", x: 550, y: 775 },
  { label: "EMPRESA", x: 45, y: 735 },
  { label: "CLIENTE", x: 310, y: 735 },
  { label: "ATENDIMENTO", x: 45, y: 595 },
  { label: "TABELA", x: 45, y: 570 },
  { label: "ITENS", x: 45, y: 525 },
  { label: "ASSINATURAS", x: 45, y: 180 },
  { label: "RODAPÉ", x: 45, y: 55 },
];

for (const p of positions) {
  page1.drawText(p.label, { x: p.x, y: p.y, size: 8, font: helveticaBold, color: rgb(1, 0, 0) });
  page1.drawRectangle({ x: p.x - 2, y: p.y - 2, width: 4, height: 4, color: rgb(1, 0, 0) });
}

const pdfBytes = await pdfDoc.save();
fs.writeFileSync('./public/template-debug.pdf', pdfBytes);
console.log('Debug template saved to public/template-debug.pdf');
