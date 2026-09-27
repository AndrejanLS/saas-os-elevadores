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

const COL_W = CONTENT_W / 2 - 10; // largura de cada coluna (menos gap)
const LABEL_SIZE = 7;
const VALUE_SIZE = 9;
const LINE_H_LABEL = LABEL_SIZE * 1.3;
const LINE_H_VALUE = VALUE_SIZE * 1.4;

function drawFieldPair(page: any, x: number, y: number, label: string, value: string, font: any, fontB: any): number {
  // Label
  page.drawText(label, { x, y, size: LABEL_SIZE, font, color: C.medText });
  // Valor com wrap
  const maxW = COL_W - 4;
  const valueLines = splitTextToLines(value, maxW, VALUE_SIZE, fontB);
  let vy = y - LINE_H_LABEL - 2;
  for (const line of valueLines) {
    page.drawText(line, { x, y: vy, size: VALUE_SIZE, font: fontB, color: C.darkText });
    vy -= LINE_H_VALUE;
  }
  // Retorna a altura total usada (label + gap + linhas do valor)
  return LINE_H_LABEL + 2 + valueLines.length * LINE_H_VALUE + 6; // +6 padding extra
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

async function loadImageBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl);
  return res.arrayBuffer().then((buf) => new Uint8Array(buf));
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
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    const w = font.widthOfTextAtSize(test, size);
    if (w > maxWidth && line) {
      page.drawText(line, { x, y: curY, size, font, color });
      curY -= lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) page.drawText(line, { x, y: curY, size, font, color });
  return curY;
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
  page.drawText(text, {
    x: M + 8, y: y - 10, size: 10, font: fontB, color: rgb(1, 1, 1),
  });
  return y - boxH - 6;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company = {},
      customer = {},
      elevatorLabel = "",
      records = [],
      situation = "NORMAL",
      startTime = null,
      endTime = null,
      responsibleName = "",
      responsibleRole = "",
      technicianName = "",
      generalNotes = "",
      orderNumber = 0,
    } = body;

    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ========== PAGE 1 ==========
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - M;

    // Header: logo + title
    if (company.logoObjectKey?.startsWith("data:image/")) {
      try {
        const imgBytes = await loadImageBytes(company.logoObjectKey);
        const img = company.logoObjectKey.startsWith("data:image/png") || company.logoObjectKey.startsWith("data:image/png;")
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);
        const ratio = img.width / img.height;
        const maxW = 156, maxH = 56;
        let w = maxW, h = w / ratio;
        if (h > maxH) { h = maxH; w = h * ratio; }
        page.drawImage(img, { x: M, y: y - h, width: w, height: h });
        y -= h + 8;
      } catch {}
    }

    page.drawText("ORDEM DE SERVIÇO", {
      x: PAGE_W - M - helveticaBold.widthOfTextAtSize("ORDEM DE SERVIÇO", 14), y: y - 4, size: 14, font: helveticaBold, color: C.teal,
    });
    const numberLabel = orderNumber > 0 ? `OS Nº ${String(orderNumber).padStart(6, "0")}` : "OS Nº — (rascunho)";
    page.drawText(numberLabel, {
      x: PAGE_W - M - helveticaBold.widthOfTextAtSize(numberLabel, 10), y: y - 22, size: 10, font: helveticaBold, color: C.navy,
    });
    const dateLabel = `Emitida em ${formatDate(new Date())}`;
    page.drawText(dateLabel, {
      x: PAGE_W - M - helvetica.widthOfTextAtSize(dateLabel, 8), y: y - 36, size: 8, font: helvetica, color: C.medText,
    });
    y -= 50;

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
        page.drawText(`REGISTRO ${i + 1} · ${caption}`, { x: M, y, size: 9, font: helveticaBold, color: C.teal });
        y -= 14;
        y = drawWrapped(page, record.notes || "", M, y, 9, C.darkText, helvetica, CONTENT_W, 13);

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
            const imgBytes1 = await loadImageBytes(photos[p]);
            const img1 = photos[p].startsWith("data:image/png") || photos[p].startsWith("data:image/png;")
              ? await pdfDoc.embedPng(imgBytes1)
              : await pdfDoc.embedJpg(imgBytes1);
            const r1 = img1.width / img1.height;
            let w1 = photoW, h1calc = w1 / r1;
            if (h1calc > photoH) { h1calc = photoH; w1 = h1calc * r1; }
            h1 = h1calc;
            page.drawImage(img1, { x: x1 + (photoW - w1)/2, y: y - h1, width: w1, height: h1 });
            drew1 = true;
          } catch (e) {
            console.error('[PDF] failed to embed photo 1:', e);
          }
          // Desenha moldura só se desenhou a imagem, senão pula o slot
          if (drew1) {
            page.drawRectangle({ x: x1, y: y - photoH, width: photoW, height: photoH, borderColor: C.border, borderWidth: 0.5 });
            page.drawText(`${caption} ${p + 1}`, { x: x1 + 4, y: y - photoH - 10, size: 7, font: helvetica, color: C.medText });
          }

          if (p + 1 < photos.length) {
            try {
              const imgBytes2 = await loadImageBytes(photos[p + 1]);
              const img2 = photos[p + 1].startsWith("data:image/png") || photos[p + 1].startsWith("data:image/png;")
                ? await pdfDoc.embedPng(imgBytes2)
                : await pdfDoc.embedJpg(imgBytes2);
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
              page.drawText(`${caption} ${p + 2}`, { x: x2 + 4, y: y - photoH - 10, size: 7, font: helvetica, color: C.medText });
            }
          }
          // Avança y pela maior altura real desenhada (ou photoH se nenhuma)
          const rowH = Math.max(drew1 ? h1 : 0, drew2 ? h2 : 0, drew1 || drew2 ? 0 : photoH);
          y -= rowH + photoGap + 8;
        }
        y -= 10;
      }
    }

    // Observações Gerais
    if (generalNotes?.trim()) {
      if (y < M + 80) { page = pdfDoc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - M; }
      y = drawSectionTitle(page, "Observações Gerais", y, helveticaBold);
      y = drawWrapped(page, generalNotes, M, y, 9, C.darkText, helvetica, CONTENT_W, 13);
    }

    // Footer pages
    const pages = pdfDoc.getPages();
    for (let pi = 0; pi < pages.length; pi++) {
      const pg = pages[pi];
      const footerY = 24;
      pg.drawLine({ start: { x: M, y: footerY + 12 }, end: { x: PAGE_W - M, y: footerY + 12 }, thickness: 0.5, color: C.teal });
      pg.drawText(joinParts([company.legalName, company.phone, company.email]), { x: M, y: footerY, size: 7, font: helvetica, color: C.lightText });
      const pageLabel = `Página ${pi + 1} de ${pages.length}`;
      pg.drawText(pageLabel, {
        x: PAGE_W - M - helveticaBold.widthOfTextAtSize(pageLabel, 8),
        y: footerY, size: 8, font: helveticaBold, color: C.teal,
      });
      const brandLabel = "INTECH ELEVADORES";
      pg.drawText(brandLabel, {
        x: PAGE_W / 2 - helveticaBold.widthOfTextAtSize(brandLabel, 6) / 2,
        y: footerY - 12, size: 6, font: helveticaBold, color: C.teal,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const customerName = customer.name || "ordem-de-servico";
    const safeName = customerName.slice(0, 30).replace(/[^\w]+/g, "-").toLowerCase();
    const fileName = orderNumber > 0 ? `os-${String(orderNumber).padStart(6, "0")}-${safeName}.pdf` : `os-rascunho-${safeName}.pdf`;

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