import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type AnyRecord = Record<string, any>;

const situationLabel: Record<string, string> = {
  NORMAL: "Em Conformidade",
  WITH_NOTES: "Com apontamentos",
  QUOTE_REQUIRED: "Necessário orçamento",
  IRREGULARITY: "Equipamento com irregularidade",
};

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.filter((p) => p && String(p).trim()).join(", ");
}
function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "--";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("pt-BR");
}
function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "--";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 36;
const CONTENT_W = PAGE_W - 2 * M;

const C = {
  navy: rgb(12/255, 26/255, 43/255),
  teal: rgb(6/255, 182/255, 212/255),
  darkText: rgb(30/255, 41/255, 59/255),
  medText: rgb(71/255, 85/255, 105/255),
  lightText: rgb(148/255, 163/255, 184/255),
  border: rgb(203/255, 213/255, 225/255),
  headerBg: rgb(12/255, 26/255, 43/255),
  headerLine: rgb(6/255, 182/255, 212/255),
  sectionBg: rgb(241/255, 245/255, 249/255),
};

const COL_W = CONTENT_W / 2 - 10;
const LABEL_SIZE = 7;
const VALUE_SIZE = 9;
const LINE_H_LABEL = LABEL_SIZE * 1.3;
const LINE_H_VALUE = VALUE_SIZE * 1.4;

// Sanitiza texto para WinAnsi
function sanitizeText(text: string): string {
  if (!text) return "--";
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7EÀ-ÿ]/g, "");
}

function drawTextSafely(page: any, text: string, opts: any) {
  try {
    page.drawText(sanitizeText(text), opts);
  } catch {
    page.drawText("[texto com erro]", opts);
  }
}

function drawFieldPair(page: any, x: number, y: number, label: string, value: string, font: any, fontB: any): number {
  const safeLabel = sanitizeText(label);
  const safeValue = sanitizeText(value);
  drawTextSafely(page, safeLabel, { x, y, size: LABEL_SIZE, font, color: C.medText });
  const maxW = COL_W - 4;
  const valueLines = splitTextToLines(safeValue, maxW, VALUE_SIZE, fontB);
  let vy = y - LINE_H_LABEL - 2;
  for (const line of valueLines) {
    drawTextSafely(page, line, { x, y: vy, size: VALUE_SIZE, font: fontB, color: C.darkText });
    vy -= LINE_H_VALUE;
  }
  return LINE_H_LABEL + 2 + valueLines.length * LINE_H_VALUE + 6;
}

function splitTextToLines(text: string, maxWidth: number, size: number, font: any): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current + (current ? " " : "") + w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ["—"];
}

// Decodifica dataURL para bytes
function extractImageData(dataUrl: string): { bytes: Uint8Array; isPng: boolean } | null {
  if (typeof dataUrl !== "string") return null;
  const idx = dataUrl.indexOf(",");
  if (idx < 0) return null;
  const header = dataUrl.substring(0, idx);
  const isPng = /png/i.test(header);
  const isJpg = /jpe?g/i.test(header);
  if (!isPng && !isJpg) return null;
  const base64Data = dataUrl.substring(idx + 1);
  if (!base64Data) return null;
  try {
    const bytes = Buffer.from(base64Data, "base64");
    return { bytes: new Uint8Array(bytes), isPng };
  } catch {
    return null;
  }
}

async function embedImageFromDataUrl(pdfDoc: any, dataUrl: string) {
  const extracted = extractImageData(dataUrl);
  if (!extracted) return null;
  const { bytes, isPng } = extracted;
  return isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
}

function drawWrapped(
  page: any,
  text: string,
  x: number,
  y: number,
  size: number,
  color: any,
  font: any,
  maxWidth: number,
  lineHeight: number,
  pdfDoc: any,
  fontB: any
): { page: any; y: number } {
  const rawText = text || "";
  const paragraphs = rawText.split(/\r?\n/);
  let curY = y;
  let currentPage = page;
  const minY = M + 50; // Não desenha abaixo do footer

  for (const para of paragraphs) {
    if (!para.trim()) {
      // Se linha vazia e vai estourar, quebra página
      if (curY - lineHeight * 0.6 < minY) {
        currentPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
        curY = PAGE_H - M;
      } else {
        curY -= lineHeight * 0.6;
      }
      continue;
    }
    const safePara = sanitizeText(para);
    const words = safePara.split(" ");
    let line = "";
    for (const word of words) {
      const test = line + (line ? " " : "") + word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxWidth && line) {
        // Quebra de página se necessário
        if (curY - lineHeight < minY) {
          currentPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
          curY = PAGE_H - M;
        }
        drawTextSafely(currentPage, line, { x, y: curY, size, font, color });
        curY -= lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      // Quebra de página se necessário
      if (curY - lineHeight < minY) {
        currentPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
        curY = PAGE_H - M;
      }
      drawTextSafely(currentPage, line, { x, y: curY, size, font, color });
      curY -= lineHeight;
    }
  }
  return { page: currentPage, y: curY };
}

function drawSectionTitle(page: any, title: string, y: number, fontB: any) {
  const boxH = 20;
  page.drawRectangle({
    x: M, y: y - boxH + 4, width: CONTENT_W, height: boxH,
    color: C.headerBg,
  });
  page.drawLine({
    start: { x: M, y: y + 4 }, end: { x: PAGE_W - M, y: y + 4 },
    thickness: 1.2, color: C.headerLine,
  });
  const text = title.toUpperCase();
  drawTextSafely(page, text, {
    x: M + 8, y: y - 10, size: 10, font: fontB, color: rgb(1, 1, 1),
  });
  return y - boxH - 6;
}

// === LAYOUT HELPERS ===

// Calcula altura necessária para texto com wrap (preservando quebras de linha)
function measureTextHeight(text: string, maxWidth: number, size: number, font: any, lineHeight: number): number {
  if (!text?.trim()) return 0;
  const safeText = sanitizeText(text);
  const paragraphs = safeText.split(/\r?\n/);
  let totalLines = 0;
  for (const para of paragraphs) {
    if (!para.trim()) {
      totalLines += 0.6; // linha em branco conta parcial
      continue;
    }
    const words = para.split(" ");
    let line = "";
    let lines = 0;
    for (const word of words) {
      const test = line + (line ? " " : "") + word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines++;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines++;
    totalLines += lines;
  }
  return Math.ceil(totalLines) * lineHeight;
}

// Verifica se há espaço suficiente na página atual
function ensureSpace(page: any, y: number, neededHeight: number, pdfDoc: any, fontB: any): { page: any; y: number } {
  const minBottomMargin = M + 30; // margem inferior + footer
  if (y - neededHeight < minBottomMargin) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - M;
  }
  return { page, y };
}

// Desenha a área de assinatura completa (com ou sem imagem)
async function drawSignatureSection(page: any, y: number, signature: string | null, pdfDoc: any, helvetica: any, helveticaBold: any, company: AnyRecord, customer: AnyRecord): Promise<{ page: any; y: number }> {
  const minSignatureHeight = 120; // altura mínima reservada para assinatura
  const result = ensureSpace(page, y, minSignatureHeight, pdfDoc, helveticaBold);
  page = result.page;
  y = result.y;

  // Título da seção
  y = drawSectionTitle(page, "Assinatura do Responsável", y, helveticaBold);

  // Espaço após título
  y -= 8;

  // Linha para "Responsável pela aprovação"
  drawTextSafely(page, "RESPONSÁVEL PELA APROVAÇÃO", { x: M, y, size: 9, font: helveticaBold, color: C.teal });
  y -= 18;

  // Campo: Nome
  drawTextSafely(page, "Nome:", { x: M, y, size: 8, font: helveticaBold, color: C.darkText });
  drawTextSafely(page, "_______________________________________________", { x: M + 60, y, size: 8, font: helvetica, color: C.medText });
  y -= 16;

  // Campo: Data
  const today = new Date().toLocaleDateString("pt-BR");
  drawTextSafely(page, "Data:", { x: M, y, size: 8, font: helveticaBold, color: C.darkText });
  drawTextSafely(page, today, { x: M + 60, y, size: 8, font: helvetica, color: C.darkText });
  y -= 16;

  // Campo: Assinatura
  drawTextSafely(page, "Assinatura:", { x: M, y, size: 8, font: helveticaBold, color: C.darkText });
  y -= 10;

  // Se há assinatura digital, desenha a imagem
  if (signature?.startsWith("data:image/")) {
    try {
      const img = await embedImageFromDataUrl(pdfDoc, signature);
      if (img) {
        const ratio = img.width / img.height;
        const maxW = 280;
        const maxH = 100;
        let w = maxW, h = w / ratio;
        if (h > maxH) { h = maxH; w = h * ratio; }
        page.drawImage(img, { x: M, y: y - h, width: w, height: h });
        y -= h + 10;
      }
    } catch (e) {
      console.error('[PDF] failed to embed signature:', e);
      // Fallback: linha para assinatura manuscrita
      page.drawLine({ start: { x: M, y }, end: { x: M + 280, y }, thickness: 0.8, color: C.border });
      y -= 20;
    }
  } else {
    // Sem assinatura digital: desenha linha para assinatura manuscrita
    page.drawLine({ start: { x: M, y }, end: { x: M + 280, y }, thickness: 0.8, color: C.border });
    y -= 20;
  }

  // Linha de identificação do responsável (se houver nome)
  const respName = customer.contactName || "";
  if (respName) {
    drawTextSafely(page, respName, { x: M, y, size: 8, font: helveticaBold, color: C.darkText });
    y -= 12;
  }

  return { page, y };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Suporta ambos os formatos: { orderNumber: 26500 } ou { order: { number: 26500, formattedNumber: "26/500", ... } }
    const order = body.order || {};
    // orderNumber pode vir em body.orderNumber, body.number, order.number
    const orderNumber = body.orderNumber ?? body.number ?? order.number ?? 0;
    const {
      company = order.company || {},
      customer = order.customer || {},
      elevatorLabel = order.elevatorLabel || order.elevator?.identification || "",
      records = order.records || [],
      situation = order.situation || "NORMAL",
      startTime = order.startTime || null,
      endTime = order.endTime || null,
      responsibleName = order.responsibleName || "",
      responsibleRole = order.responsibleRole || "",
      technicianName = order.technicianName || order.technician?.name || "",
      generalNotes = order.generalNotes || "",
      signature = order.signature || null,
    } = body;

    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ========== PAGE 1 ==========
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - M;

    // Header: logo + title
    // Carrega logo padrão da Intech (442x118px PNG)
    let intechLogo: any = null;
    try {
      const fs = require('fs');
      const path = require('path');
      const logoPath = path.join(process.cwd(), 'public', 'uploads', 'intech-logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      intechLogo = await pdfDoc.embedPng(logoBuffer);
    } catch (error) {
      console.warn('[PDF] logo não encontrado, usando fallback de texto');
    }

    // Desenha logo se disponível
    if (intechLogo) {
      const logoWidth = 180;
      const logoHeight = (intechLogo.height / intechLogo.width) * logoWidth;
      page.drawImage(intechLogo, {
        x: M, y: y - logoHeight - 8,
        width: logoWidth, height: logoHeight,
      });
      y -= logoHeight + 16; // espaço após logo
    } else {
      // Fallback: texto estilizado
      drawTextSafely(page, "INTECH", {
        x: M, y: y - 24, size: 24, font: helveticaBold, color: C.navy,
      });
      drawTextSafely(page, "ELEVADORES", {
        x: M, y: y - 40, size: 11, font: helvetica, color: C.teal,
      });
      y -= 48;
    }

    // Se company tem logo próprio, usa ele
    if (company.logoObjectKey?.startsWith("data:image/")) {
      try {
        const img = await embedImageFromDataUrl(pdfDoc, company.logoObjectKey);
        if (img) {
          const ratio = img.width / img.height;
          const maxW = 156, maxH = 56;
          let w = maxW, h = w / ratio;
          if (h > maxH) { h = maxH; w = h * ratio; }
          page.drawImage(img, { x: M, y: y - h, width: w, height: h });
          y -= h + 8;
        }
      } catch {}
    }

    drawTextSafely(page, "ORDEM DE SERVIÇO", {
      x: PAGE_W - M - helveticaBold.widthOfTextAtSize("ORDEM DE SERVIÇO", 18), y: y - 4, size: 18, font: helveticaBold, color: C.teal,
    });
    // Formata número da OS: 26/500 (ano + sequência)
    // orderNumber = 26500 → year=26, seq=500 → "26/500"
    // orderNumber = 26531 → year=26, seq=531 → "26/531"
    const year = orderNumber > 0 ? Math.floor(orderNumber / 1000) : 0; // 26500 / 1000 = 26
    const seq = orderNumber > 0 ? orderNumber % 1000 : 0; // 26500 % 1000 = 500
    const numberLabel = orderNumber > 0 ? `OS ${year.toString().slice(-2)}/${String(seq).padStart(3, "0")}` : "OS — (rascunho)";
    drawTextSafely(page, numberLabel, {
      x: PAGE_W - M - helveticaBold.widthOfTextAtSize(numberLabel, 12), y: y - 26, size: 12, font: helveticaBold, color: C.navy,
    });
    y -= 40;

    // Empresa Contratada
    y = drawSectionTitle(page, "Empresa Contratada", y, helveticaBold);
    const compFields = [
      ["Razão Social", company.legalName || "—"],
      ["Nome Fantasia", company.tradeName || "—"],
      ["CNPJ", company.taxId || "—"],
      ["Endereço", joinParts([company.address, company.number, company.neighborhood, company.city, company.state, company.postalCode]) || "—"],
      ["Telefone", company.phone || "—"],
      ["WhatsApp", company.whatsapp || "—"],
      ["E-mail", company.email || "—"],
      ["Site", company.website || "—"],
    ];
    for (let i = 0; i < compFields.length; i += 2) {
      const f1 = compFields[i];
      const f2 = compFields[i + 1];
      const h1 = drawFieldPair(page, M, y, f1[0], f1[1], helvetica, helveticaBold);
      let rowH = h1;
      if (f2) {
        const h2 = drawFieldPair(page, PAGE_W / 2 + 10, y, f2[0], f2[1], helvetica, helveticaBold);
        rowH = Math.max(rowH, h2);
      }
      y -= rowH;
    }
    y -= 8;

    // Cliente / Condomínio
    y = drawSectionTitle(page, "Cliente / Condomínio", y, helveticaBold);
    const custFields = [
      ["Nome", customer.name || "—"],
      ["CNPJ / CPF", customer.taxId || "—"],
      ["Endereço", joinParts([customer.address, customer.number, customer.complement, customer.neighborhood, customer.city, customer.state, customer.postalCode]) || "—"],
      ["Responsável", customer.contactName || "—"],
      ["Telefone", customer.phone || "—"],
      ["E-mail", customer.email || "—"],
    ];
    for (let i = 0; i < custFields.length; i += 2) {
      const f1 = custFields[i];
      const f2 = custFields[i + 1];
      const h1 = drawFieldPair(page, M, y, f1[0], f1[1], helvetica, helveticaBold);
      let rowH = h1;
      if (f2) {
        const h2 = drawFieldPair(page, PAGE_W / 2 + 10, y, f2[0], f2[1], helvetica, helveticaBold);
        rowH = Math.max(rowH, h2);
      }
      y -= rowH;
    }
    y -= 8;

    // Dados do Atendimento
    y = drawSectionTitle(page, "Dados do Atendimento", y, helveticaBold);
    const attFields = [
      ["Elevador", elevatorLabel || "—"],
      ["Situação", situationLabel[situation] || "Não informada"],
      ["Início", formatDate(startTime)],
      ["Término", formatDate(endTime)],
      ["Técnico", technicianName || "—"],
      ["Responsável", joinParts([responsibleName, responsibleRole]) || "—"],
    ];
    for (let i = 0; i < attFields.length; i += 2) {
      const f1 = attFields[i];
      const f2 = attFields[i + 1];
      const h1 = drawFieldPair(page, M, y, f1[0], f1[1], helvetica, helveticaBold);
      let rowH = h1;
      if (f2) {
        const h2 = drawFieldPair(page, PAGE_W / 2 + 10, y, f2[0], f2[1], helvetica, helveticaBold);
        rowH = Math.max(rowH, h2);
      }
      y -= rowH;
    }
    y -= 8;

    // Registros de Manutenção
    if (records.length > 0) {
      y = drawSectionTitle(page, `Registros de Manutenção (${records.length})`, y, helveticaBold);

      const photoW = 230;
      const photoH = 156;
      const photoGap = 20;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const caption = record.customPart || record.part || `Registro ${i + 1}`;

        // Verifica espaço antes do registro
        const recordEstHeight = 14 + measureTextHeight(record.notes || "", CONTENT_W, 9, helvetica, 13) + 20;
        const { page: newPage, y: newY } = ensureSpace(page, y, recordEstHeight, pdfDoc, helveticaBold);
        page = newPage; y = newY;

        drawTextSafely(page, `REGISTRO ${i + 1} · ${caption}`, { x: M, y, size: 9, font: helveticaBold, color: C.teal });
        y -= 14;
        const wrappedResult = drawWrapped(page, record.notes || "", M, y, 9, C.darkText, helvetica, CONTENT_W, 13, pdfDoc, helveticaBold);
        page = wrappedResult.page;
        y = wrappedResult.y;

        const photos: string[] = (record.photos || [])
          .map((p: any) => (typeof p === "string" ? p : p?.objectKey))
          .filter((p: any) => typeof p === "string" && p.startsWith("data:image/"));

        for (let p = 0; p < photos.length; p += 2) {
          if (y - photoH < M + 40) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            y = PAGE_H - M;
          }
          const x1 = M;
          const x2 = M + photoW + photoGap;
          let drew1 = false, drew2 = false;
          let h1 = 0, h2 = 0;
          try {
            const img1 = await embedImageFromDataUrl(pdfDoc, photos[p]);
            if (!img1) throw new Error('not a data URL');
            const r1 = img1.width / img1.height;
            let w1 = photoW, h1calc = w1 / r1;
            if (h1calc > photoH) { h1calc = photoH; w1 = h1calc * r1; }
            h1 = h1calc;
            page.drawImage(img1, { x: x1 + (photoW - w1)/2, y: y - h1, width: w1, height: h1 });
            drew1 = true;
          } catch (e) {
            console.error('[PDF] failed to embed photo 1:', e);
          }
          if (drew1) {
            page.drawRectangle({ x: x1, y: y - photoH, width: photoW, height: photoH, borderColor: C.border, borderWidth: 0.5 });
            drawTextSafely(page, `${caption} ${p + 1}`, { x: x1 + 4, y: y - photoH - 10, size: 7, font: helvetica, color: C.medText });
          }

          if (p + 1 < photos.length) {
            try {
              const img2 = await embedImageFromDataUrl(pdfDoc, photos[p + 1]);
              if (!img2) throw new Error('not a data URL');
              const r2 = img2.width / img2.height;
              let w2 = photoW, h2calc = w2 / r2;
              if (h2calc > photoH) { h2calc = photoH; w2 = h2calc * r2; }
              h2 = h2calc;
              page.drawImage(img2, { x: x2 + (photoW - w2)/2, y: y - h2, width: w2, height: h2 });
              drew2 = true;
            } catch (e) {
              console.error('[PDF] failed to embed photo 2:', e);
            }
            if (drew2) {
              page.drawRectangle({ x: x2, y: y - photoH, width: photoW, height: photoH, borderColor: C.border, borderWidth: 0.5 });
              drawTextSafely(page, `${caption} ${p + 2}`, { x: x2 + 4, y: y - photoH - 10, size: 7, font: helvetica, color: C.medText });
            }
          }
          const rowH = Math.max(drew1 ? h1 : 0, drew2 ? h2 : 0, drew1 || drew2 ? 0 : photoH);
          y -= rowH + photoGap + 8;
        }
        y -= 10;
      }
    }

    // ===== OBSERVAÇÕES GERAIS - COM ALTURA DINÂMICA =====
    if (generalNotes?.trim()) {
      // Calcula altura necessária
      const titleHeight = 26; // drawSectionTitle height
      const contentHeight = measureTextHeight(generalNotes, CONTENT_W, 9, helvetica, 13);
      const totalNotesHeight = titleHeight + contentHeight + 20; // + espaçamento

      const { page: newPage, y: newY } = ensureSpace(page, y, totalNotesHeight, pdfDoc, helveticaBold);
      page = newPage; y = newY;

      y = drawSectionTitle(page, "Observações Gerais", y, helveticaBold);
      y -= 4; // pequeno espaçamento
      const wrappedResult = drawWrapped(page, generalNotes, M, y, 9, C.darkText, helvetica, CONTENT_W, 13, pdfDoc, helveticaBold);
      page = wrappedResult.page;
      y = wrappedResult.y;
    }

    // ===== ASSINATURA - POSICIONADA APÓS OBSERVAÇÕES COM ESPAÇAMENTO =====
    // Sempre desenha a seção de assinatura (com ou sem imagem digital)
    // Adiciona espaçamento visual entre observações e assinatura
    y -= 16; // gap entre seções

    const sigResult = await drawSignatureSection(page, y, signature, pdfDoc, helvetica, helveticaBold, company, customer);
    page = sigResult.page;
    y = sigResult.y;

    // Footer pages
    const pages = pdfDoc.getPages();
    for (let pi = 0; pi < pages.length; pi++) {
      const pg = pages[pi];
      const footerY = 24;
      pg.drawLine({ start: { x: M, y: footerY + 12 }, end: { x: PAGE_W - M, y: footerY + 12 }, thickness: 0.5, color: C.teal });
      drawTextSafely(pg, joinParts([company.legalName, company.phone, company.email]), { x: M, y: footerY, size: 7, font: helvetica, color: C.lightText });
      const pageLabel = `Página ${pi + 1} de ${pages.length}`;
      drawTextSafely(pg, pageLabel, {
        x: PAGE_W - M - helveticaBold.widthOfTextAtSize(pageLabel, 8),
        y: footerY, size: 8, font: helveticaBold, color: C.teal,
      });
      const brandLabel = "INTECH ELEVADORES";
      drawTextSafely(pg, brandLabel, {
        x: PAGE_W / 2 - helveticaBold.widthOfTextAtSize(brandLabel, 6) / 2,
        y: footerY - 12, size: 6, font: helveticaBold, color: C.teal,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const customerName = customer.name || "ordem-de-servico";
    const safeName = customerName.slice(0, 30).replace(/[^\w]+/g, "-").toLowerCase();
    const fileName = orderNumber > 0 ? `os_${year.toString().slice(-2)}-${String(seq).padStart(3, "0")}-${safeName}.pdf` : `os-rascunho-${safeName}.pdf`;

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (err: any) {
    console.error("[generate-pdf] error:", err);
    return NextResponse.json({ error: err?.message || "Erro ao gerar PDF" }, { status: 500 });
  }
}