// Extrai texto de um PDF (streams flate) para verificação do layout gerado.
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const pdf = readFileSync(process.argv[2]);
const text = pdf.toString("latin1");
const chunks = [];
const re = /stream\r?\n/g;
let m;
while ((m = re.exec(text))) {
  const start = m.index + m[0].length;
  const end = text.indexOf("endstream", start);
  if (end === -1) continue;
  const raw = Buffer.from(text.slice(start, end).replace(/\r?\n$/, ""), "latin1");
  try {
    chunks.push(inflateSync(raw).toString("latin1"));
  } catch {
    // não-flate: ignora
  }
}

const out = [];
for (const c of chunks) {
  // captura texto entre parênteses em operadores Tj/TJ
  const tj = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let t;
  while ((t = tj.exec(c))) out.push(t[0].replace(/\)\s*Tj$/, "").slice(1));
  const tja = /\[(.*?)\]\s*TJ/gs;
  while ((t = tja.exec(c))) {
    const parts = [...t[1].matchAll(/\((?:\\.|[^\\)])*\)/g)].map((p) => p[0].slice(1, -1));
    out.push(parts.join(""));
  }
}
console.log(out.map((s) => s.replace(/\\([()\\])/g, "$1").replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))).join("\n"));
