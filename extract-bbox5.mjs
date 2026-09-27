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
  console.log('Dict:', node.dict);
  console.log('Dict keys:', [...node.dict.map.keys()]);
  
  const contents = node.dict.get('Contents');
  console.log('Contents:', contents);
  
  if (contents) {
    const resolved = pdfDoc.context.lookupMaybe(contents);
    console.log('Resolved:', resolved);
    if (Array.isArray(resolved)) {
      for (const ref of resolved) {
        const stream = pdfDoc.context.lookup(ref);
        if (stream && stream.contents) {
          const text = Buffer.from(stream.contents).toString('utf-8');
          console.log(`Stream (${text.length} chars):`);
          console.log(text.substring(0, 3000));
          console.log('---');
        }
      }
    } else if (resolved) {
      const stream = pdfDoc.context.lookup(resolved);
      if (stream && stream.contents) {
        const text = Buffer.from(stream.contents).toString('utf-8');
        console.log(`Stream (${text.length} chars):`);
        console.log(text.substring(0, 3000));
      }
    }
  }
}
