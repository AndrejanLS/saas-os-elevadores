import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

const templateBytes = fs.readFileSync('./public/template-os.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);

// Tenta extrair texto com posições usando getTextStream (não existe em pdf-lib padrão)
// Vamos usar uma abordagem diferente: medir a partir do layout conhecido

const page1 = pdfDoc.getPages()[0];
const { width, height } = page1.getSize();
console.log(`Page 1: ${width} x ${height} pts`);

// O template tem 3 páginas? Vamos listar
console.log(`Total pages: ${pdfDoc.getPageCount()}`);
