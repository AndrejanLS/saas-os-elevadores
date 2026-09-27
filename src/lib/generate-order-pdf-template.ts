import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
type AnyRecord = Record<string, any>;

export const situationLabel: Record<string, string> = {
  NORMAL: "Em Conformidade",
  WITH_NOTES: "Com apontamentos",
  QUOTE_REQUIRED: "Necessário orçamento",
  IRREGULARITY: "Equipamento com irregularidade",
};

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.filter((p) => p && String(p).trim()).join(", ");
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Página A4: 595.92 x 842.88 pts
// Origem (0,0) = canto inferior esquerdo
// Y cresce para cima

const PAGE_W = 595.92;
const PAGE_H = 842.88;
const MARGIN = 45.36; // 16mm

// Cores do template
const COLORS = {
  navy: rgb(14/255, 30/255, 54/255),       // #0E1E36
  deepNavy: rgb(8/255, 18/255, 32/255),    // #081220
  teal: rgb(0, 136/255, 146/255),          // #008892
  tealLight: rgb(12/255, 168/255, 178/255), // #0CA8B2
  white: rgb(1, 1, 1),
  darkText: rgb(15/255, 23/255, 42/255),   // #0F172A
  medText: rgb(71/255, 85/255, 105/255),   // #475569
  lightText: rgb(148/255, 163/255, 184/255), // #94A3B8
  border: rgb(203/255, 213/255, 225/255),  // #CBD5E1
  lightBg: rgb(245/255, 248/255, 252/255), // #F5F8FC
};

async function loadTemplate(): Promise<Uint8Array> {
  const res = await fetch("/template-os.pdf");
  if (!res.ok) throw new Error("Template PDF não encontrado em /template-os.pdf");
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function drawText(page: any, text: string, x: number, y: number, size: number, color: any, font: any, align: "left" | "center" | "right" = "left", maxW?: number) {
  if (!text) return;
  const lines = maxW ? wrapText(text, font, size, maxW) : [text];
  let curY = y;
  for (const line of lines) {
    const w = font.widthOfTextAtSize(line, size);
    let drawX = x;
    if (align === "center") drawX = x - w / 2;
    else if (align === "right") drawX = x - w;
    page.drawText(line, { x: drawX, y: curY, size, font, color });
    curY -= size * 1.25; // leading 1.25x
  }
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

export async function generateOrderPdfFromTemplate(params: {
  order?: AnyRecord | null;
  company?: AnyRecord | null;
  customer?: AnyRecord | null;
  elevatorLabel?: string;
  records?: AnyRecord[];
  situation?: string;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  responsibleName?: string;
  responsibleRole?: string;
  technicianName?: string;
  generalNotes?: string;
}) {
  const { order } = params;
  const company: AnyRecord = order?.company || params.company || {};
  const customer: AnyRecord = order?.customer || params.customer || {};

  const elevatorLabel: string =
    order && typeof order.elevator === "string"
      ? order.elevator
      : order?.elevator?.identification || params.elevatorLabel || "—";

  const records: AnyRecord[] = order?.records || params.records || [];
  const situation = order?.situation ?? params.situation ?? "NORMAL";
  const startTime = order?.startTime ?? params.startTime ?? null;
  const endTime = order?.endTime ?? params.endTime ?? null;
  const responsibleName = order?.responsibleName || params.responsibleName || "";
  const responsibleRole = order?.responsibleRole || params.responsibleRole || "";
  const technicianName = order?.technician?.name || order?.technicianName || params.technicianName || "";
  const generalNotes = order?.generalNotes || params.generalNotes || "";

  const number: number = order?.number ?? 0;
  const isDraft = !order;
  const openedAt = order?.openedAt ?? new Date();
  const ref = isDraft ? "OS Nº — (rascunho)" : `Ref: OS-${String(openedAt.getFullYear()).slice(-2)}/${String(number).padStart(4, "0")}`;
  const statusText = situationLabel[situation] || "PREVENTIVA";

  // Carrega template
  const templateBytes = await loadTemplate();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page2 = pages.length > 1 ? pages[1] : null;

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ===== PÁGINA 1 - Coordenadas medidas (origem inferior esquerdo) =====
  // Header topo: y ~ 780-820
  // Título "ORDEM DE SERVIÇO" ~ y=795
  // Ref ~ y=785
  // Status badge ~ y=775

  // EMPRESA CONTRATADA título ~ y=740
  // Linha separadora ~ y=735
  // Campos descendo ~ -22 pts cada

  // CLIENTE / CONDOMÍNIO título ~ y=740 (mesmo Y)
  // Campos descendo ~ -22 pts cada

  // DADOS DO ATENDIMENTO título ~ y=600
  // Tabela header ~ y=585
  // Tabela linha ~ y=570

  // ITENS título ~ y=540
  // Itens descendo

  // Assinaturas ~ y=180
  // Rodapé ~ y=50

  // ===== HEADER =====
  // "ORDEM DE SERVIÇO" - alinhado à direita, margem 16mm = 45.36pts
  drawText(page1, "ORDEM DE SERVIÇO", PAGE_W - MARGIN, 795, 14, COLORS.white, helveticaBold, "right");

  // Ref
  drawText(page1, ref, PAGE_W - MARGIN, 782, 9, COLORS.tealLight, helvetica, "right");

  // Status badge - caixa navy com borda teal
  const statusW = helveticaBold.widthOfTextAtSize(statusText, 8) + 16;
  const statusX = PAGE_W - MARGIN - statusW;
  page1.drawRectangle({
    x: statusX, y: 768, width: statusW, height: 14,
    color: COLORS.navy, borderColor: COLORS.teal, borderWidth: 1,
  });
  drawText(page1, statusText, PAGE_W - MARGIN - 8, 772, 8, COLORS.white, helveticaBold, "right");

  // ===== EMPRESA CONTRATADA (esquerda) =====
  const leftX = MARGIN;
  let yLeft = 735;
  drawText(page1, "EMPRESA CONTRATADA", leftX, yLeft, 9, COLORS.navy, helveticaBold);
  yLeft -= 10;
  page1.drawLine({ start: { x: leftX, y: yLeft }, end: { x: leftX + 250, y: yLeft }, thickness: 0.5, color: COLORS.teal });
  yLeft -= 14;

  const fieldLineH = 22;
  const labelSize = 7;
  const valueSize = 9;
  const maxWLeft = 250;

  // Razão Social
  drawText(page1, "Razão Social:", leftX, yLeft, labelSize, COLORS.lightText, helvetica);
  yLeft -= 12;
  drawText(page1, company.legalName || "—", leftX, yLeft, valueSize, COLORS.darkText, helveticaBold, "left", maxWLeft);
  yLeft -= fieldLineH;

  // CNPJ
  drawText(page1, "CNPJ:", leftX, yLeft, labelSize, COLORS.lightText, helvetica);
  yLeft -= 12;
  drawText(page1, company.taxId || "—", leftX, yLeft, valueSize, COLORS.darkText, helveticaBold, "left", maxWLeft);
  yLeft -= fieldLineH;

  // Endereço
  drawText(page1, "Endereço:", leftX, yLeft, labelSize, COLORS.lightText, helvetica);
  yLeft -= 12;
  drawText(page1, joinParts([company.address, company.number, company.neighborhood, company.city, company.state]) || "—", leftX, yLeft, valueSize, COLORS.darkText, helveticaBold, "left", maxWLeft);
  yLeft -= fieldLineH;

  // Telefone
  drawText(page1, "Telefone:", leftX, yLeft, labelSize, COLORS.lightText, helvetica);
  yLeft -= 12;
  drawText(page1, company.phone || "—", leftX, yLeft, valueSize, COLORS.darkText, helveticaBold, "left", maxWLeft);
  yLeft -= fieldLineH;

  // E-mail
  drawText(page1, "E-mail:", leftX, yLeft, labelSize, COLORS.lightText, helvetica);
  yLeft -= 12;
  drawText(page1, company.email || "—", leftX, yLeft, valueSize, COLORS.darkText, helveticaBold, "left", maxWLeft);
  yLeft -= fieldLineH;

  // Website
  drawText(page1, "Website:", leftX, yLeft, labelSize, COLORS.lightText, helvetica);
  yLeft -= 12;
  drawText(page1, company.website || "—", leftX, yLeft, valueSize, COLORS.darkText, helveticaBold, "left", maxWLeft);

  // ===== CLIENTE / CONDOMÍNIO (direita) =====
  const rightX = PAGE_W / 2 + 10; // ~310
  let yRight = 735;
  drawText(page1, "CLIENTE / CONDOMÍNIO", rightX, yRight, 9, COLORS.navy, helveticaBold);
  yRight -= 10;
  page1.drawLine({ start: { x: rightX, y: yRight }, end: { x: PAGE_W - MARGIN, y: yRight }, thickness: 0.5, color: COLORS.teal });
  yRight -= 14;

  const maxWRight = PAGE_W - MARGIN - rightX;

  // Condomínio
  drawText(page1, "Condomínio:", rightX, yRight, labelSize, COLORS.lightText, helvetica);
  yRight -= 12;
  drawText(page1, customer.name || "—", rightX, yRight, valueSize, COLORS.darkText, helveticaBold, "left", maxWRight);
  yRight -= fieldLineH;

  // CNPJ/CPF
  drawText(page1, "CNPJ/CPF:", rightX, yRight, labelSize, COLORS.lightText, helvetica);
  yRight -= 12;
  drawText(page1, customer.taxId || "—", rightX, yRight, valueSize, COLORS.darkText, helveticaBold, "left", maxWRight);
  yRight -= fieldLineH;

  // Endereço
  drawText(page1, "Endereço:", rightX, yRight, labelSize, COLORS.lightText, helvetica);
  yRight -= 12;
  drawText(page1, joinParts([customer.address, customer.number, customer.neighborhood, customer.city, customer.state]) || "—", rightX, yRight, valueSize, COLORS.darkText, helveticaBold, "left", maxWRight);
  yRight -= fieldLineH;

  // Responsável
  drawText(page1, "Responsável:", rightX, yRight, labelSize, COLORS.lightText, helvetica);
  yRight -= 12;
  drawText(page1, customer.contactName || "—", rightX, yRight, valueSize, COLORS.darkText, helveticaBold, "left", maxWRight);
  yRight -= fieldLineH;

  // Telefone
  drawText(page1, "Telefone:", rightX, yRight, labelSize, COLORS.lightText, helvetica);
  yRight -= 12;
  drawText(page1, customer.phone || "—", rightX, yRight, valueSize, COLORS.darkText, helveticaBold, "left", maxWRight);
  yRight -= fieldLineH;

  // E-mail
  drawText(page1, "E-mail:", rightX, yRight, labelSize, COLORS.lightText, helvetica);
  yRight -= 12;
  drawText(page1, customer.email || "—", rightX, yRight, valueSize, COLORS.darkText, helveticaBold, "left", maxWRight);

  // ===== DADOS DO ATENDIMENTO TÉCNICO =====
  const tableTitleY = 595;
  drawText(page1, "DADOS DO ATENDIMENTO TÉCNICO", MARGIN, tableTitleY, 10, COLORS.navy, helveticaBold);
  page1.drawLine({ start: { x: MARGIN, y: tableTitleY - 5 }, end: { x: PAGE_W - MARGIN, y: tableTitleY - 5 }, thickness: 0.5, color: COLORS.teal });

  // Tabela
  const tableHeaderY = 570;
  const tableRowY = 555;
  const tableRowH = 18;
  const colWidths = [125, 90, 95, 95, 125]; // soma = 530
  const colHeaders = ["EQUIPAMENTO", "DATA DE EMISSÃO", "INÍCIO DO TÉCNICO", "TÉRMINO", "STATUS DA MANUTENÇÃO"];
  const dataRow = [
    elevatorLabel,
    formatDate(openedAt),
    formatTime(startTime),
    formatTime(endTime),
    statusText.toUpperCase(),
  ];

  // Header fundo navy
  page1.drawRectangle({
    x: MARGIN, y: tableRowY, width: 530, height: tableHeaderY - tableRowY + tableRowH,
    color: COLORS.navy,
  });

  // Headers
  let cx = MARGIN;
  for (let i = 0; i < colHeaders.length; i++) {
    drawText(page1, colHeaders[i], cx + 4, tableHeaderY - 2, 7, COLORS.white, helveticaBold, "left", colWidths[i] - 8);
    cx += colWidths[i];
  }

  // Linha de dados
  page1.drawRectangle({
    x: MARGIN, y: tableRowY, width: 530, height: tableRowH,
    color: COLORS.lightBg,
  });
  cx = MARGIN;
  for (let i = 0; i < dataRow.length; i++) {
    const color = i === 4 ? COLORS.teal : COLORS.darkText;
    const font = i === 4 ? helveticaBold : helvetica;
    drawText(page1, dataRow[i] || "—", cx + 4, tableRowY + 5, 9, color, font, "left", colWidths[i] - 8);
    cx += colWidths[i];
  }

  // Borda tabela
  page1.drawRectangle({
    x: MARGIN, y: tableRowY, width: 530, height: tableHeaderY - tableRowY + tableRowH,
    borderColor: COLORS.teal, borderWidth: 1,
  });

  // ===== ITENS DE VERIFICAÇÃO & MANUTENÇÃO =====
  const itemsTitleY = 525;
  drawText(page1, `ITENS DE VERIFICAÇÃO & MANUTENÇÃO (${records.length})`, MARGIN, itemsTitleY, 10, COLORS.navy, helveticaBold);
  drawText(page1, "OK / APROVADO", PAGE_W - MARGIN, itemsTitleY, 9, COLORS.teal, helveticaBold, "right");

  let itemY = itemsTitleY - 20;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const partTitle = `REGISTRO ${i + 1}. ${(record.customPart || record.part || "GERAL").toUpperCase()}`;
    drawText(page1, partTitle, MARGIN, itemY, 9, COLORS.navy, helveticaBold);
    itemY -= 16;
    if (record.notes) {
      itemY = drawWrapped(page1, record.notes, MARGIN, itemY, 8.5, COLORS.medText, helvetica, 500, 14);
    }
    itemY -= 10;
  }

  // ===== ASSINATURAS =====
  const sigY = 180;
  const sigLeftX = MARGIN;
  const sigRightX = PAGE_W / 2 + 10;
  const sigLineW = 220;

  page1.drawLine({ start: { x: sigLeftX, y: sigY }, end: { x: sigLeftX + sigLineW, y: sigY }, thickness: 0.5, color: COLORS.teal });
  page1.drawLine({ start: { x: sigRightX, y: sigY }, end: { x: sigRightX + sigLineW, y: sigY }, thickness: 0.5, color: COLORS.teal });

  drawText(page1, "TÉCNICO RESPONSÁVEL - INTECH ELEVADORES", sigLeftX, sigY - 10, 8, COLORS.navy, helveticaBold);
  drawText(page1, "SÍNDICO / RESPONSÁVEL PELO CONDOMÍNIO", sigRightX, sigY - 10, 8, COLORS.navy, helveticaBold);

  drawText(page1, technicianName || "___________________________________", sigLeftX, sigY - 22, 8, COLORS.darkText, helvetica);
  drawText(page1, responsibleName || customer.contactName || "___________________________________", sigRightX, sigY - 22, 8, COLORS.darkText, helvetica);

  // ===== RODAPÉ PÁGINA 1 =====
  const footerLineY = 55;
  page1.drawLine({ start: { x: MARGIN, y: footerLineY }, end: { x: PAGE_W - MARGIN, y: footerLineY }, thickness: 0.3, color: COLORS.teal });
  drawText(page1, joinParts([company.legalName, company.phone, company.email]), MARGIN, footerLineY - 10, 7, COLORS.lightText, helvetica);
  drawText(page1, "Página 1 de 2", PAGE_W - MARGIN, footerLineY - 10, 8, COLORS.teal, helveticaBold, "right");
  drawText(page1, "INTECH ELEVADORES", PAGE_W / 2, footerLineY - 20, 6, COLORS.teal, helveticaBold, "center");

  // ===== PÁGINA 2 =====
  if (page2 && records.some((r) => Array.isArray(r.photos) && r.photos.length > 0)) {
    // Header página 2
    drawText(page2, "INTECH", MARGIN, 795, 14, COLORS.teal, helveticaBold);
    drawText(page2, "ELEVADORES", MARGIN, 782, 9, COLORS.tealLight, helvetica);
    drawText(page2, "RELATÓRIO FOTOGRÁFICO DE CAMPO", PAGE_W / 2, 795, 13, COLORS.white, helveticaBold, "center");
    drawText(page2, `Anexo técnico da ${ref.replace("Ref: ", "")}`, PAGE_W - MARGIN, 782, 8, COLORS.tealLight, helvetica, "right");
    page2.drawLine({ start: { x: MARGIN, y: 770 }, end: { x: PAGE_W - MARGIN, y: 770 }, thickness: 0.5, color: COLORS.teal });

    // EVIDÊNCIAS FOTOGRÁFICAS
    drawText(page2, "EVIDÊNCIAS FOTOGRÁFICAS DA INSPEÇÃO", MARGIN, 745, 9, COLORS.navy, helveticaBold);

    let photoY = 720;
    const photoW = 255;
    const photoH = 180;
    const photoGap = 20;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const caption = record.customPart || record.part || `Registro ${i + 1}`;
      const photos: string[] = (record.photos || [])
        .map((p: any) => (typeof p === "string" ? p : p?.objectKey))
        .filter((p: any) => typeof p === "string" && p.startsWith("data:image/"));

      for (let p = 0; p < photos.length; p += 2) {
        const x1 = MARGIN;
        const x2 = MARGIN + photoW + photoGap;

        // Placeholder retângulo
        page2.drawRectangle({ x: x1, y: photoY - photoH, width: photoW, height: photoH, borderColor: COLORS.border, borderWidth: 0.5 });
        drawText(page2, `Registro ${i + 1}.${p + 1} - ${caption}`, x1, photoY - photoH - 8, 7, COLORS.medText, helvetica);

        if (p + 1 < photos.length) {
          page2.drawRectangle({ x: x2, y: photoY - photoH, width: photoW, height: photoH, borderColor: COLORS.border, borderWidth: 0.5 });
          drawText(page2, `Registro ${i + 1}.${p + 2} - ${caption}`, x2, photoY - photoH - 8, 7, COLORS.medText, helvetica);
        }
        photoY -= photoH + photoGap + 20;
      }
    }

    // OBSERVAÇÕES GERAIS
    if (generalNotes && generalNotes.trim()) {
      const obsY = Math.max(photoY - 30, 180);
      drawText(page2, "OBSERVAÇÕES GERAIS E PARECER TÉCNICO", MARGIN, obsY, 10, COLORS.navy, helveticaBold);
      page2.drawLine({ start: { x: MARGIN, y: obsY - 5 }, end: { x: PAGE_W - MARGIN, y: obsY - 5 }, thickness: 0.5, color: COLORS.teal });
      drawWrapped(page2, generalNotes, MARGIN, obsY - 20, 9, COLORS.darkText, helvetica, 500, 14);
    }

    // RODAPÉ PÁGINA 2
    page2.drawLine({ start: { x: MARGIN, y: footerLineY }, end: { x: PAGE_W - MARGIN, y: footerLineY }, thickness: 0.3, color: COLORS.teal });
    drawText(page2, joinParts([company.legalName, company.phone, company.email]), MARGIN, footerLineY - 10, 7, COLORS.lightText, helvetica);
    drawText(page2, "Página 2 de 2", PAGE_W - MARGIN, footerLineY - 10, 8, COLORS.teal, helveticaBold, "right");
    drawText(page2, "INTECH ELEVADORES", PAGE_W / 2, footerLineY - 20, 6, COLORS.teal, helveticaBold, "center");
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}