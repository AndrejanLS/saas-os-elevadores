import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

const templateBytes = fs.readFileSync('./public/template-os.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);
const pages = pdfDoc.getPages();

for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  const { width, height } = page.getSize();
  console.log(`\n=== PAGE ${i + 1} ===`);
  
  const node = page.node;
  const contentsRef = node.dict.get('Contents');
  console.log('Contents ref:', contentsRef);
  
  if (contentsRef) {
    const contents = pdfDoc.context.lookup(contentsRef);
    console.log('Lookup type:', typeof contents, Array.isArray(contents));
    
    if (Array.isArray(contents)) {
      for (const contentRef of contents) {
        const stream = pdfDoc.context.lookup(contentRef);
        if (stream && stream.contents) {
          const text = Buffer.from(stream.contents).toString('utf-8');
          console.log(`Stream (${text.length} chars):`);
          console.log(text.substring(0, 3000));
          console.log('---');
        }
      }
    } else if (contents) {
      const stream = pdfDoc.context.lookup(contents);
      if (stream && stream.contents) {
        const text = Buffer.from(stream.contents).toString('utf-8');
        console.log(`Stream (${text.length} chars):`);
        console.log(text.substring(0, 3000));
      }
    }
  }
}
