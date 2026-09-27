// Teste direto do generator reescrito (compilado)
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 45.36;

const C = {
  navy: rgb(14/255, 30/255, 54/255),
  deepNavy: rgb(8/255, 18/255, 32/255),
  teal: rgb(0, 136/255, 146/255),
  tealLight: rgb(12/255, 168/255, 178/255),
  white: rgb(1, 1, 1),
  darkText: rgb(15/255, 23/255, 42/255),
  medText: rgb(71/255, 85/255, 105/255),
  lightText: rgb(148/255, 163/255, 184/255),
  border: rgb(203/255, 213/255, 225/255),
  lightBg: rgb(245/255, 248/255, 252/255),
};

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

function drawText(page: any, text: string, x: number, y: number, size: number, color: any, font: any, align: "left" | "center" | "right" = "left", maxW?: number): number {
  if (!text) return y;
  const lines = maxW ? wrapText(text, font, size, maxW) : [text];
  let curY = y;
  for (const line of lines) {
    const w = font.widthOfTextAtSize(line, size);
    let drawX = x;
    if (align === "center") drawX = x - w / 2;
    else if (align === "right") drawX = x - w;
    page.drawText(line, { x: drawX, y: curY, size, font, color });
    curY -= size * 1.25;
  }
  return curY;
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

function drawWrapped(page: any, text: string, x: number, y: number, size: number, color: any, font: any, maxW: number, lineH: number): number {
  if (!text) return y;
  const lines = wrapText(text, font, size, maxW);
  let curY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: curY, size, font, color });
    curY -= lineH;
  }
  return curY;
}

// ===== HEADER =====
page.drawRectangle({ x: 0, y: PAGE_H - 100, width: PAGE_W, height: 100, color: C.deepNavy });
const segW = (PAGE_W - 2 * M) / 3;
const decoY = PAGE_H - 100;
page.drawLine({ start: { x: M, y: decoY }, end: { x: M + segW, y: decoY }, thickness: 1, color: C.teal });
page.drawLine({ start: { x: M + segW, y: decoY }, end: { x: M + segW * 2, y: decoY }, thickness: 1.5, color: C.white });
page.drawLine({ start: { x: M + segW * 2, y: decoY }, end: { x: PAGE_W - M, y: decoY }, thickness: 1, color: C.teal });

drawText(page, "INTECH", M, PAGE_H - 45, 22, C.teal, helveticaBold);
drawText(page, "ELEVADORES", M, PAGE_H - 65, 11, C.tealLight, helvetica);
drawText(page, "ORDEM DE SERVIÇO", PAGE_W - M, PAGE_H - 40, 14, C.white, helveticaBold, "right");
drawText(page, "Ref: OS-26/0042", PAGE_W - M, PAGE_H - 55, 9, C.tealLight, helvetica, "right");

const statusText = "CONCLUÍDA / PREVENTIVA";
const statusW = helveticaBold.widthOfTextAtSize(statusText, 8) + 16;
const statusX = PAGE_W - M - statusW;
page.drawRectangle({ x: statusX, y: PAGE_H - 78, width: statusW, height: 14, color: C.navy, borderColor: C.teal, borderWidth: 1 });
drawText(page, statusText, PAGE_W - M - 8, PAGE_H - 74, 8, C.white, helveticaBold, "right");

// ===== EMPRESA / CLIENTE =====
let y = PAGE_H - 130;
drawText(page, "EMPRESA CONTRATADA", M, y, 9, C.navy, helveticaBold);
drawText(page, "CLIENTE / CONDOMÍNIO", PAGE_W / 2 + 10, y, 9, C.navy, helveticaBold);
y -= 8;
page.drawLine({ start: { x: M, y }, end: { x: PAGE_W / 2 - 5, y }, thickness: 0.5, color: C.teal });
page.drawLine({ start: { x: PAGE_W / 2 + 10, y }, end: { x: PAGE_W - M, y }, thickness: 0.5, color: C.teal });
y -= 14;

const leftFields = [
  ["Razão Social:", "Intech Elevadores Ltda"],
  ["CNPJ:", "12.345.678/0001-90"],
  ["Endereço:", "Av. Paulista, 1000, Bela Vista, São Paulo/SP"],
  ["Telefone:", "(11) 3000-0000"],
  ["E-mail:", "contato@intech.com.br"],
  ["Website:", "www.intech.com.br"],
];

const rightFields = [
  ["Condomínio:", "Condomínio Edifício Central"],
  ["CNPJ/CPF:", "98.765.432/0001-10"],
  ["Endereço:", "Rua das Flores, 250, Centro, São Paulo/SP"],
  ["Responsável:", "Sr. Roberto Silva (Síndico)"],
  ["Telefone:", "(11) 3261-4500"],
  ["E-mail:", "sindico@edcentral.com.br"],
];

const colW = PAGE_W / 2 - M - 15;
let yLeft = y, yRight = y;
for (const [label, value] of leftFields) {
  yLeft = drawText(page, label, M, yLeft, 7, C.lightText, helvetica, "left", colW);
  yLeft = drawText(page, value, M, yLeft, 9, C.darkText, helveticaBold, "left", colW);
  yLeft -= 4;
}
for (const [label, value] of rightFields) {
  yRight = drawText(page, label, PAGE_W / 2 + 10, yRight, 7, C.lightText, helvetica, "left", colW);
  yRight = drawText(page, value, PAGE_W / 2 + 10, yRight, 9, C.darkText, helveticaBold, "left", colW);
  yRight -= 4;
}
y = Math.min(yLeft, yRight) - 10;

// ===== DADOS DO ATENDIMENTO =====
drawText(page, "DADOS DO ATENDIMENTO TÉCNICO", M, y, 10, C.navy, helveticaBold);
y -= 8;
page.drawLine({ start: { x: M, y }, end: { x: PAGE_W - M, y }, thickness: 0.5, color: C.teal });
y -= 14;

const headers = ["EQUIPAMENTO", "DATA DE EMISSÃO", "INÍCIO DO TÉCNICO", "TÉRMINO", "STATUS DA MANUTENÇÃO"];
const dataRow = ["Elevador de Serviço", "26/09/2026", "09:59", "10:59", "EM CONFORMIDADE"];
const colWidths = [125, 95, 95, 95, 125];
const tableRowH = 22;

page.drawRectangle({ x: M, y: y - tableRowH, width: 530, height: tableRowH, color: C.navy });
let cx = M;
for (let i = 0; i < headers.length; i++) {
  drawText(page, headers[i], cx + 4, y - 4, 7, C.white, helveticaBold, "left", colWidths[i] - 8);
  cx += colWidths[i];
}
y -= tableRowH;
page.drawRectangle({ x: M, y: y - tableRowH + 2, width: 530, height: tableRowH - 2, color: C.lightBg });
cx = M;
for (let i = 0; i < dataRow.length; i++) {
  const color = i === 4 ? C.teal : C.darkText;
  const font = i === 4 ? helveticaBold : helvetica;
  drawText(page, dataRow[i], cx + 4, y - 4, 9, color, font, "left", colWidths[i] - 8);
  cx += colWidths[i];
}
page.drawRectangle({ x: M, y: y - tableRowH, width: 530, height: tableRowH * 2, borderColor: C.teal, borderWidth: 1 });
y -= tableRowH * 2 + 10;

// ===== ITENS =====
drawText(page, "ITENS DE VERIFICAÇÃO & MANUTENÇÃO (2)", M, y, 10, C.navy, helveticaBold);
drawText(page, "OK / APROVADO", PAGE_W - M, y, 9, C.teal, helveticaBold, "right");
y -= 20;

const items = [
  "REGISTRO 1. POLIAS DE TRAÇÃO E DESVIO",
  "Inspeção visual, alinhamento, desgaste de canais e folga de rolamentos.",
  "",
  "REGISTRO 2. LUBRIFICAÇÃO TÉCNICA",
  "Lubrificação geral de guias de cabine, contrapeso e componentes mecânicos.",
];
for (const line of items) {
  if (line.startsWith("REGISTRO")) {
    y = drawText(page, line, M, y, 9, C.navy, helveticaBold);
    y -= 4;
  } else if (line === "") {
    y -= 10;
  } else {
    y = drawWrapped(page, line, M, y, 8.5, C.medText, helvetica, 510, 13);
  }
}

// ===== ASSINATURAS =====
const sigY = 130;
const sigLineW = 230;
page.drawLine({ start: { x: M, y: sigY }, end: { x: M + sigLineW, y: sigY }, thickness: 0.5, color: C.teal });
page.drawLine({ start: { x: PAGE_W / 2 + 10, y: sigY }, end: { x: PAGE_W / 2 + 10 + sigLineW, y: sigY }, thickness: 0.5, color: C.teal });
drawText(page, "TÉCNICO RESPONSÁVEL - INTECH ELEVADORES", M, sigY - 10, 8, C.navy, helveticaBold);
drawText(page, "SÍNDICO / RESPONSÁVEL PELO CONDOMÍNIO", PAGE_W / 2 + 10, sigY - 10, 8, C.navy, helveticaBold);
drawText(page, "Márcio Santos", M, sigY - 22, 8, C.darkText, helvetica);
drawText(page, "Sr. Roberto Silva", PAGE_W / 2 + 10, sigY - 22, 8, C.darkText, helvetica);

// ===== RODAPÉ =====
const footerY = 40;
page.drawLine({ start: { x: M, y: footerY }, end: { x: PAGE_W - M, y: footerY }, thickness: 0.3, color: C.teal });
drawText(page, "Intech Elevadores Ltda | (11) 3000-0000 | contato@intech.com.br", M, footerY - 10, 7, C.lightText, helvetica);
drawText(page, "Página 1 de 2", PAGE_W - M, footerY - 10, 8, C.teal, helveticaBold, "right");
drawText(page, "INTECH ELEVADORES", PAGE_W / 2, footerY - 20, 6, C.teal, helveticaBold, "center");

const pdfBytes = await pdfDoc.save();
fs.writeFileSync('./test-output-direct.pdf', pdfBytes);
console.log('Direct test PDF saved to test-output-direct.pdf');