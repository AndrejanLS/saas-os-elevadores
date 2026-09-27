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
  
  // Tenta acessar o conteúdo da página
  const node = page.node;
  if (node.Contents) {
    const contents = pdfDoc.context.lookup(node.Contents);
    if (Array.isArray(contents)) {
      for (const contentRef of contents) {
        const stream = pdfDoc.context.lookup(contentRef);
        if (stream && stream.contents) {
          const text = Buffer.from(stream.contents).toString('utf-8');
          console.log(`Stream: ${text.substring(0, 500)}...`);
        }
      }
    }
  }
}
