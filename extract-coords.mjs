import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

const templateBytes = fs.readFileSync('./public/template-os.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);
const pages = pdfDoc.getPages();

console.log(`Total pages: ${pages.length}`);
const w = pages[0].getWidth();
const h = pages[0].getHeight();
console.log(`Page size: ${w} x ${h} pts (${(w/2.83465).toFixed(1)} x ${(h/2.83465).toFixed(1)} mm)`);
