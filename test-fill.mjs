import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const templateBytes = fs.readFileSync('./public/template-os.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);
const pages = pdfDoc.getPages();
const page1 = pages[0];

const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

// Teste: preenche apenas os campos principais nas posições medidas
// Usando as mesmas coordenadas do código

// ORDEM DE SERVIÇO
page1.drawText("ORDEM DE SERVIÇO", { x: 550, y: 795, size: 14, font: helveticaBold, color: rgb(1,1,1) });
// Ref
page1.drawText("Ref: OS-26/0042", { x: 550, y: 782, size: 9, font: helvetica, color: rgb(12/255, 168/255, 178/255) });
// Status
const statusText = "CONCLUÍDA / PREVENTIVA";
const statusW = helveticaBold.widthOfTextAtSize(statusText, 8) + 16;
page1.drawRectangle({ x: 550 - statusW, y: 768, width: statusW, height: 14, color: rgb(14/255, 30/255, 54/255), borderColor: rgb(0, 136/255, 146/255), borderWidth: 1 });
page1.drawText(statusText, { x: 550 - 8, y: 772, size: 8, font: helveticaBold, color: rgb(1,1,1) });

// EMPRESA CONTRATADA
let yLeft = 735;
page1.drawText("EMPRESA CONTRATADA", { x: 45, y: yLeft, size: 9, font: helveticaBold, color: rgb(14/255, 30/255, 54/255) });
yLeft -= 10;
page1.drawLine({ start: { x: 45, y: yLeft }, end: { x: 295, y: yLeft }, thickness: 0.5, color: rgb(0, 136/255, 146/255) });
yLeft -= 14;

const fieldsLeft = [
  ["Razão Social:", "Intech Elevadores Ltda"],
  ["CNPJ:", "12.345.678/0001-90"],
  ["Endereço:", "Av. Paulista, 1000, Bela Vista, São Paulo/SP"],
  ["Telefone:", "(11) 3000-0000"],
  ["E-mail:", "contato@intech.com.br"],
  ["Website:", "www.intech.com.br"],
];

for (const [label, value] of fieldsLeft) {
  page1.drawText(label, { x: 45, y: yLeft, size: 7, font: helvetica, color: rgb(148/255, 163/255, 184/255) });
  yLeft -= 12;
  page1.drawText(value, { x: 45, y: yLeft, size: 9, font: helveticaBold, color: rgb(15/255, 23/255, 42/255) });
  yLeft -= 22;
}

// CLIENTE / CONDOMÍNIO
let yRight = 735;
page1.drawText("CLIENTE / CONDOMÍNIO", { x: 310, y: yRight, size: 9, font: helveticaBold, color: rgb(14/255, 30/255, 54/255) });
yRight -= 10;
page1.drawLine({ start: { x: 310, y: yRight }, end: { x: 550, y: yRight }, thickness: 0.5, color: rgb(0, 136/255, 146/255) });
yRight -= 14;

const fieldsRight = [
  ["Condomínio:", "Condomínio Edifício Central"],
  ["CNPJ/CPF:", "98.765.432/0001-10"],
  ["Endereço:", "Rua das Flores, 250, Centro, São Paulo/SP"],
  ["Responsável:", "Sr. Roberto Silva (Síndico)"],
  ["Telefone:", "(11) 3261-4500"],
  ["E-mail:", "sindico@edcentral.com.br"],
];

for (const [label, value] of fieldsRight) {
  page1.drawText(label, { x: 310, y: yRight, size: 7, font: helvetica, color: rgb(148/255, 163/255, 184/255) });
  yRight -= 12;
  page1.drawText(value, { x: 310, y: yRight, size: 9, font: helveticaBold, color: rgb(15/255, 23/255, 42/255) });
  yRight -= 22;
}

// DADOS DO ATENDIMENTO
page1.drawText("DADOS DO ATENDIMENTO TÉCNICO", { x: 45, y: 595, size: 10, font: helveticaBold, color: rgb(14/255, 30/255, 54/255) });
page1.drawLine({ start: { x: 45, y: 590 }, end: { x: 550, y: 590 }, thickness: 0.5, color: rgb(0, 136/255, 146/255) });

// Tabela header
page1.drawRectangle({ x: 45, y: 555, width: 505, height: 35, color: rgb(14/255, 30/255, 54/255) });
const headers = ["EQUIPAMENTO", "DATA DE EMISSÃO", "INÍCIO DO TÉCNICO", "TÉRMINO", "STATUS DA MANUTENÇÃO"];
let cx = 45;
for (const h of headers) {
  page1.drawText(h, { x: cx + 4, y: 575, size: 7, font: helveticaBold, color: rgb(1,1,1) });
  cx += 101; // 505/5
}

// Tabela linha
page1.drawRectangle({ x: 45, y: 555, width: 505, height: 18, color: rgb(245/255, 248/255, 252/255) });
const data = ["Elevador de Serviço", "26/09/2026", "09:59", "10:59", "EM CONFORMIDADE"];
cx = 45;
for (let i = 0; i < data.length; i++) {
  const color = i === 4 ? rgb(0, 136/255, 146/255) : rgb(15/255, 23/255, 42/255);
  const font = i === 4 ? helveticaBold : helvetica;
  page1.drawText(data[i], { x: cx + 4, y: 558, size: 9, font, color });
  cx += 101;
}
page1.drawRectangle({ x: 45, y: 555, width: 505, height: 35, borderColor: rgb(0, 136/255, 146/255), borderWidth: 1 });

// ITENS
page1.drawText("ITENS DE VERIFICAÇÃO & MANUTENÇÃO (2)", { x: 45, y: 525, size: 10, font: helveticaBold, color: rgb(14/255, 30/255, 54/255) });
page1.drawText("OK / APROVADO", { x: 550, y: 525, size: 9, font: helveticaBold, color: rgb(0, 136/255, 146/255) });

let itemY = 505;
const items = [
  "REGISTRO 1. POLIAS DE TRAÇÃO E DESVIO",
  "Inspeção visual, alinhamento, desgaste de canais e folga de rolamentos.",
  "",
  "REGISTRO 2. LUBRIFICAÇÃO TÉCNICA",
  "Lubrificação geral de guias de cabine, contrapeso e componentes mecânicos.",
];

for (const line of items) {
  if (line.startsWith("REGISTRO")) {
    page1.drawText(line, { x: 45, y: itemY, size: 9, font: helveticaBold, color: rgb(14/255, 30/255, 54/255) });
    itemY -= 16;
  } else if (line === "") {
    itemY -= 10;
  } else {
    page1.drawText(line, { x: 45, y: itemY, size: 8.5, font: helvetica, color: rgb(71/255, 85/255, 105/255) });
    itemY -= 14;
  }
}

// ASSINATURAS
const sigY = 180;
page1.drawLine({ start: { x: 45, y: sigY }, end: { x: 265, y: sigY }, thickness: 0.5, color: rgb(0, 136/255, 146/255) });
page1.drawLine({ start: { x: 310, y: sigY }, end: { x: 530, y: sigY }, thickness: 0.5, color: rgb(0, 136/255, 146/255) });
page1.drawText("TÉCNICO RESPONSÁVEL - INTECH ELEVADORES", { x: 45, y: 170, size: 8, font: helveticaBold, color: rgb(14/255, 30/255, 54/255) });
page1.drawText("SÍNDICO / RESPONSÁVEL PELO CONDOMÍNIO", { x: 310, y: 170, size: 8, font: helveticaBold, color: rgb(14/255, 30/255, 54/255) });
page1.drawText("Márcio Santos", { x: 45, y: 158, size: 8, font: helvetica, color: rgb(15/255, 23/255, 42/255) });
page1.drawText("Sr. Roberto Silva", { x: 310, y: 158, size: 8, font: helvetica, color: rgb(15/255, 23/255, 42/255) });

// RODAPÉ
page1.drawLine({ start: { x: 45, y: 55 }, end: { x: 550, y: 55 }, thickness: 0.3, color: rgb(0, 136/255, 146/255) });
page1.drawText("Intech Elevadores Ltda | (11) 3000-0000 | contato@intech.com.br", { x: 45, y: 45, size: 7, font: helvetica, color: rgb(148/255, 163/255, 184/255) });
page1.drawText("Página 1 de 2", { x: 550, y: 45, size: 8, font: helveticaBold, color: rgb(0, 136/255, 146/255) });
page1.drawText("INTECH ELEVADORES", { x: 297, y: 35, size: 6, font: helveticaBold, color: rgb(0, 136/255, 146/255) });

const pdfBytes = await pdfDoc.save();
fs.writeFileSync('./public/template-test-filled.pdf', pdfBytes);
console.log('Test filled PDF saved to public/template-test-filled.pdf');
