import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

const templateBytes = fs.readFileSync('./public/template-os.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);
const pages = pdfDoc.getPages();

for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  const { width, height } = page.getSize();
  console.log(`\n=== PAGE ${i + 1} ===`);
  console.log(`Size: ${width} x ${height} pts`);
  
  const node = page.node;
  console.log('Node keys:', Object.keys(node));
  if (node.Contents) {
    console.log('Contents type:', typeof node.Contents, Array.isArray(node.Contents));
    const contents = pdfDoc.context.lookup(node.Contents);
    console.log('Lookup result:', contents);
  }
}
