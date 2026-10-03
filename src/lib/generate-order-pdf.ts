import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

// Logo da Intech Elevadores (base64 webp)
const INTECH_LOGO_BASE64 = "UklGRsR5AABXRUJQVlA4WAoAAAAgAAAAzwcAmgIASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

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

// Página A4 em pontos (pdf-lib usa pontos, origem bottom-left)
const PAGE_W = 595.28;  // 210mm
const PAGE_H = 841.89;  // 297mm
const M = 45.36;        // 16mm margin

// Cores do sistema Intech Elevadores
const C = {
  primary: rgb(14/255, 30/255, 54/255),       // #0E1E36 Navy
  secondary: rgb(0, 136/255, 146/255),        // #008892 Teal
  accent: rgb(12/255, 168/255, 178/255),      // #0CA8B2 Teal Light
  success: rgb(34/255, 197/255, 94/255),      // #22C55E Green
  warning: rgb(245/255, 158/255, 11/255),     // #F59E0B Amber
  danger: rgb(239/255, 68/255, 68/255),       // #EF4444 Red
  white: rgb(1, 1, 1),
  darkText: rgb(15/255, 23/255, 42/255),      // #0F172A
  medText: rgb(71/255, 85/255, 105/255),      // #475569
  lightText: rgb(148/255, 163/255, 184/255),  // #94A3B8
  border: rgb(203/255, 213/255, 225/255),     // #CBD5E1
  lightBg: rgb(245/255, 248/255, 252/255),    // #F5F8FC
};

function drawText(
  page: any,
  text: string,
  x: number,
  y: number,
  size: number,
  color: any,
  font: any,
  align: "left" | "center" | "right" = "left",
  maxW?: number,
): number {
  if (!text) return y;
  // WinAnsi sanitize: strip combining marks and non-encodable chars
  const safe = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7EÀ-ÿ]/g, "");
  const lines = maxW ? wrapText(safe, font, size, maxW) : [safe];
  let curY = y;
  for (const line of lines) {
    const w = font.widthOfTextAtSize(line, size);
    let drawX = x;
    if (align === "center") drawX = x - w / 2;
    else if (align === "right") drawX = x - w;
    try {
      page.drawText(line, { x: drawX, y: curY, size, font, color });
    } catch {
      page.drawText("[texto]", { x: drawX, y: curY, size, font, color });
    }
    curY -= size * 1.2;
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

function drawWrapped(
  page: any,
  text: string,
  x: number,
  y: number,
  size: number,
  color: any,
  font: any,
  maxW: number,
  lineH: number,
): number {
  if (!text) return y;
  const safe = text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7EÀ-ÿ]/g, "");
  const lines = wrapText(safe, font, size, maxW);
  let curY = y;
  for (const line of lines) {
    try {
      page.drawText(line, { x, y: curY, size, font, color });
    } catch {
      page.drawText("[texto]", { x, y: curY, size, font, color });
    }
    curY -= lineH;
  }
  return curY;
}

// Desenha coluna de campos (label + value)
function drawFieldCol(
  page: any,
  fields: Array<[string, string]>,
  x: number,
  y: number,
  maxW: number,
  font: any,
  fontBold: any,
): number {
  let curY = y;
  for (const [label, value] of fields) {
    // Label
    curY = drawText(page, label, x, curY, 7, C.lightText, font, "left", maxW);
    // Value
    curY = drawText(page, value || "—", x, curY, 9, C.darkText, fontBold, "left", maxW);
    curY -= 3; // gap entre campos
  }
  return curY;
}

// Função para converter base64 para imagem PDF
async function base64ToPdfImage(
  pdfDoc: PDFDocument,
  base64Str: string,
): Promise<any> {
  try {
    // Remove o prefixo data:image/...;base64,
    const cleanBase64 = base64Str.split(",")[1];
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    return await pdfDoc.embedJpg(imageBuffer);
  } catch (error) {
    console.error("Erro ao converter imagem base64:", error);
    // Retorna um placeholder simples
    return await pdfDoc.embedPng(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      ),
    );
  }
}

// Gera QR code como imagem PNG
async function generateQrCodeImage(
  pdfDoc: PDFDocument,
  data: string,
): Promise<any> {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(data, {
      width: 100,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return await pdfDoc.embedPng(qrCodeBuffer);
  } catch (error) {
    console.error("Erro ao gerar QR code:", error);
    // Retorna um placeholder simples
    return await pdfDoc.embedPng(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      ),
    );
  }
}

export async function generateOrderPdf(params: {
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
  signature?: string | null;
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
  const signature = order?.signature || params.signature || null;

  const number: number = order?.number ?? 0;
  const isDraft = !order;
  const openedAtRaw = order?.openedAt ?? new Date();
  const openedAt = openedAtRaw instanceof Date ? openedAtRaw : new Date(openedAtRaw);
  const ref = isDraft
    ? "OS Nº — (rascunho)"
    : `Ref: OS-${String(openedAt.getFullYear()).slice(-2)}/${String(number).padStart(4, "0")}`;
  const statusText = situationLabel[situation] || "PREVENTIVA";

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  // Fontes
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Carregar logo da Intech
  let intechLogo: any = null;
  try {
    const logoBuffer = Buffer.from(INTECH_LOGO_BASE64, "base64");
    intechLogo = await pdfDoc.embedPng(logoBuffer);
  } catch (error) {
    console.warn("Não foi possível carregar logo, usando texto:", error);
  }

  // ============================================================
  // PÁGINA 1 - ORDEM DE SERVIÇO PRINCIPAL
  // ============================================================

  // Fundo superior com gradiente simulado (rectângulo)
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 120,
    width: PAGE_W,
    height: 120,
    color: C.primary,
  });

  // Logo da Intech Elevadores (imagem real)
  if (intechLogo) {
    const logoWidth = 140;
    const logoHeight = (intechLogo.height / intechLogo.width) * logoWidth;
    page.drawImage(intechLogo, {
      x: M + 20,
      y: PAGE_H - 115,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    // Fallback: texto estilizado
    drawText(page, "INTECH", M + 20, PAGE_H - 80, 28, C.white, helveticaBold);
    drawText(page, "ELEVADORES", M + 20, PAGE_H - 50, 14, C.accent, helvetica);
  }

  // QR Code para verificação online (lado direito superior)
  const verificationUrl = `https://verify.intech.com.br/os/${number > 0 ? String(number).padStart(6, "0") : "rascunho"}`;
  const qrImage = await generateQrCodeImage(pdfDoc, verificationUrl);
  const qrSize = 80;
  page.drawImage(qrImage, {
    x: PAGE_W - M - qrSize,
    y: PAGE_H - M - qrSize,
    width: qrSize,
    height: qrSize,
  });
  drawText(
    page,
    "Verifique a autenticidade desta OS online",
    PAGE_W - M - qrSize,
    PAGE_H - M - qrSize - 10,
    7,
    C.white,
    helvetica,
    "center",
    qrSize,
  );

  // Título principal
  drawText(page, "ORDEM DE SERVIÇO", PAGE_W / 2, PAGE_H - 40, 20, C.white, helveticaBold, "center");

  // Número da OS e referência
  drawText(
    page,
    `Nº ${number > 0 ? String(number).padStart(6, "0") : " — "}`,
    PAGE_W / 2,
    PAGE_H - 60,
    16,
    C.white,
    helveticaBold,
    "center",
  );
  drawText(page, ref, PAGE_W / 2, PAGE_H - 75, 9, C.white, helvetica, "center");

  // Status badge
  const statusColors: Record<string, any> = {
    COMPLETED: C.success,
    DRAFT: C.warning,
    CANCELLED: C.danger,
    NORMAL: C.secondary,
    WITH_NOTES: C.accent,
    QUOTE_REQUIRED: C.warning,
    IRREGULARITY: C.danger,
  };
  const statusBgColor = statusColors[situation as keyof typeof statusColors] || C.secondary;
  const statusW = helveticaBold.widthOfTextAtSize(statusText, 10) + 24;
  const statusX = PAGE_W - M - statusW;
  page.drawRectangle({
    x: statusX,
    y: PAGE_H - 95,
    width: statusW,
    height: 18,
    color: statusBgColor,
    borderColor: C.white,
    borderWidth: 1,
  });
  drawText(page, statusText, PAGE_W - M - 8, PAGE_H - 89, 10, C.white, helveticaBold, "right");

  // Linha divisória
  page.drawLine({
    start: { x: M, y: PAGE_H - 130 },
    end: { x: PAGE_W - M, y: PAGE_H - 130 },
    thickness: 1,
    color: C.border,
  });

  // Seção de dados das empresas
  let yPos = PAGE_H - 160;

  drawText(page, "EMPRESA CONTRATADA", M, yPos, 10, C.primary, helveticaBold);
  drawText(page, "CLIENTE / CONDOMÍNIO", PAGE_W / 2 + 15, yPos, 10, C.primary, helveticaBold);
  yPos -= 18;

  // Linhas separadoras
  page.drawLine({
    start: { x: M, y: yPos },
    end: { x: PAGE_W / 2 - 5, y: yPos },
    thickness: 0.5,
    color: C.secondary,
  });
  page.drawLine({
    start: { x: PAGE_W / 2 + 15, y: yPos },
    end: { x: PAGE_W - M, y: yPos },
    thickness: 0.5,
    color: C.secondary,
  });
  yPos -= 12;

  const leftFields: Array<[string, string]> = [
    ["Razão Social:", company.legalName || "—"],
    ["Nome Fantasia:", company.tradeName || "—"],
    ["CNPJ:", company.taxId || "—"],
    ["Endereço:", joinParts([company.address, company.number, company.neighborhood, company.city, company.state]) || "—"],
    ["Telefone:", company.phone || "—"],
    ["WhatsApp:", company.whatsapp || "—"],
    ["E-mail:", company.email || "—"],
    ["Website:", company.website || "—"],
  ];

  const rightFields: Array<[string, string]> = [
    ["Condomínio:", customer.name || "—"],
    ["CNPJ/CPF:", customer.taxId || "—"],
    ["Endereço:", joinParts([customer.address, customer.number, customer.neighborhood, customer.city, customer.state]) || "—"],
    ["Responsável:", customer.contactName || "—"],
    ["Telefone:", customer.phone || "—"],
    ["WhatsApp:", customer.whatsapp || "—"],
    ["E-mail:", customer.email || "—"],
  ];

  const colW = PAGE_W / 2 - M - 20;
  let yLeft = drawFieldCol(page, leftFields, M, yPos, colW, helvetica, helveticaBold);
  let yRight = drawFieldCol(page, rightFields, PAGE_W / 2 + 15, yPos, colW, helvetica, helveticaBold);
  yPos = Math.min(yLeft, yRight) - 15;

  // Divisória
  page.drawLine({
    start: { x: M, y: yPos },
    end: { x: PAGE_W - M, y: yPos },
    thickness: 1,
    color: C.border,
  });
  yPos -= 15;

  // Seção de dados do atendimento
  drawText(page, "DADOS DO ATENDIMENTO", M, yPos, 10, C.primary, helveticaBold);
  yPos -= 18;

  // Informações do equipamento e horários
  const infoFields: Array<[string, string]> = [
    ["Equipamento / Elevador:", elevatorLabel],
    ["Data de Emissão:", formatDate(openedAt)],
    ["Início do Técnico:", formatTime(startTime) || "—"],
    ["Término:", formatTime(endTime) || "—"],
    ["Situação:", statusText.toUpperCase()],
    ["Técnico Responsável:", technicianName || "—"],
  ];

  yPos = drawFieldCol(page, infoFields, M, yPos, PAGE_W - 2 * M, helvetica, helveticaBold);
  yPos -= 15;

  // Divisória
  page.drawLine({
    start: { x: M, y: yPos },
    end: { x: PAGE_W - M, y: yPos },
    thickness: 1,
    color: C.border,
  });
  yPos -= 15;

  // Seção de itens de verificação
  drawText(page, `ITENS DE VERIFICAÇÃO & MANUTENÇÃO (${records.length})`, M, yPos, 10, C.primary, helveticaBold);
  yPos -= 20;

  if (records.length > 0) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const partName = record.customPart || record.part || "GERAL";
      const notes = record.notes || "";

      // Título do registro
      drawText(
        page,
        `REGISTRO ${i + 1}: ${partName.toUpperCase()}`,
        M,
        yPos,
        9,
        C.primary,
        helveticaBold,
      );
      yPos -= 12;

      // Notas do registro (se houver)
      if (notes.trim()) {
        yPos = drawWrapped(page, notes, M, yPos, 8, C.medText, helvetica, PAGE_W - 2 * M, 12);
        yPos -= 8;
      }

      // Indicador visual de status (círculo)
      page.drawCircle({
        x: M + 8,
        y: yPos + 4,
        radius: 3,
        color: C.success,
      });
      drawText(page, "OK", M + 20, yPos + 1, 8, C.darkText, helvetica);

      yPos -= 18;

      // Quebra de página se necessário
      if (yPos < 100 && i < records.length - 1) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        yPos = PAGE_H - 100;
        drawText(page, "ITENS DE VERIFICAÇÃO & MANUTENÇÃO (continuação)", M, yPos, 10, C.primary, helveticaBold);
        yPos -= 20;
      }
    }
  } else {
    drawText(page, "Nenhum registro de verificação encontrado.", M, yPos, 10, C.medText, helveticaOblique);
    yPos -= 20;
  }

  // ===== POSIÇÃO DINÂMICA DAS ASSINATURAS =====
  // Deixa espaço mínimo de 100pt do rodapé + 150pt para área de assinaturas
  const minSignatureY = 100 + 150; // 250pt do rodapé
  // Se yPos (fim dos registros) está muito baixo, usa yPos - gap, senão usa posição fixa
  const signatureY = yPos > minSignatureY + 50 ? yPos - 60 : minSignatureY;
  const signatureLineWidth = 200;
  const signatureSpacing = (PAGE_W - 2 * M - 2 * signatureLineWidth) / 3;

  // 7cm abaixo da linha de assinatura (para ficar bem separado das observações)
  const signatureLabelOffset = 196;

  // Linhas de assinatura
  page.drawLine({
    start: { x: M, y: signatureY },
    end: { x: M + signatureLineWidth, y: signatureY },
    thickness: 0.5,
    color: C.secondary,
  });
  page.drawLine({
    start: { x: PAGE_W / 2 + signatureSpacing, y: signatureY },
    end: { x: PAGE_W / 2 + signatureSpacing + signatureLineWidth, y: signatureY },
    thickness: 0.5,
    color: C.secondary,
  });

  // Rótulos das assinaturas (7cm abaixo da linha)
  drawText(page, "TÉCNICO RESPONSÁVEL", M, signatureY - signatureLabelOffset, 8, C.primary, helveticaBold);
  drawText(page, "SÍNDICO / RESPONSÁVEL", PAGE_W / 2 + signatureSpacing, signatureY - signatureLabelOffset, 8, C.primary, helveticaBold);

  // Assinatura digital (se houver) - posicionada acima dos rótulos
  if (signature) {
    try {
      const sigImage = await base64ToPdfImage(pdfDoc, signature);
      page.drawImage(sigImage, {
        x: M + 5,
        y: signatureY - signatureLabelOffset + 5,
        width: signatureLineWidth - 10,
        height: 50,
      });
    } catch (error) {
      console.error("Erro ao carregar assinatura:", error);
      page.drawLine({
        start: { x: M + 10, y: signatureY - signatureLabelOffset + 25 },
        end: { x: M + signatureLineWidth - 10, y: signatureY - signatureLabelOffset + 25 },
        thickness: 1.5,
        color: C.primary,
      });
    }
  }

  // Nome por extenso abaixo do rótulo
  drawText(page, technicianName || "_________________________", M, signatureY - signatureLabelOffset - 12, 8, C.darkText, helvetica);
  drawText(page, responsibleName || customer.contactName || "_________________________", PAGE_W / 2 + signatureSpacing, signatureY - signatureLabelOffset - 12, 8, C.darkText, helvetica);

  // Rodapé
  const footerY = 40;
  page.drawLine({
    start: { x: M, y: footerY },
    end: { x: PAGE_W - M, y: footerY },
    thickness: 0.3,
    color: C.border,
  });
  drawText(
    page,
    joinParts([company.legalName, company.phone, company.email]),
    M,
    footerY - 10,
    7,
    C.lightText,
    helvetica,
  );
  drawText(page, "Página 1 de X", PAGE_W - M, footerY - 10, 8, C.secondary, helvetica, "right");
  drawText(page, "INTECH ELEVADORES", PAGE_W / 2, footerY - 18, 6, C.secondary, helveticaBold, "center");

  // ============================================================
  // PÁGINA 2 - ANEXO FOTOGRÁFICO (se houver fotos)
  // ============================================================
  const hasPhotos = records.some((r) => Array.isArray(r.photos) && r.photos.length > 0);
  if (hasPhotos) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Header da página 2
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 100,
      width: PAGE_W,
      height: 100,
      color: C.primary,
    });
    page.drawLine({
      start: { x: M, y: PAGE_H - 100 },
      end: { x: PAGE_W - M, y: PAGE_H - 100 },
      thickness: 1,
      color: C.secondary,
    });

    // Logo da Intech na página 2
    if (intechLogo) {
      const logoWidth = 120;
      const logoHeight = (intechLogo.height / intechLogo.width) * logoWidth;
      page.drawImage(intechLogo, {
        x: M + 20,
        y: PAGE_H - 95,
        width: logoWidth,
        height: logoHeight,
      });
    } else {
      drawText(page, "INTECH", M + 20, PAGE_H - 65, 24, C.white, helveticaBold);
      drawText(page, "ELEVADORES", M + 20, PAGE_H - 40, 12, C.accent, helvetica);
    }
    drawText(
      page,
      "ANEXO FOTOGRÁFICO DE CAMPO",
      PAGE_W / 2,
      PAGE_H - 55,
      16,
      C.white,
      helveticaBold,
      "center",
    );
    drawText(
      page,
      `Anexo técnico da ${ref.replace("Ref: ", "")}`,
      PAGE_W - M,
      PAGE_H - 40,
      8,
      C.white,
      helvetica,
      "right",
      150,
    );

    let y2 = PAGE_H - 130;
    drawText(page, "EVIDÊNCIAS FOTOGRÁFICAS DA INSPEÇÃO", M, y2, 10, C.primary, helveticaBold);
    y2 -= 20;

    const photoSize = 180;
    const photoMargin = 20;
    const photosPerRow = 2;
    const rowHeight = photoSize + 40; // foto + legenda + margin

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const photos: string[] = (record.photos || [])
        .map((p: any) => (typeof p === "string" ? p : p?.objectKey))
        .filter((p: any) => typeof p === "string" && p.startsWith("data:image/"));
      const caption = record.customPart || record.part || `Registro ${i + 1}`;

      if (photos.length === 0) {
        // Placeholder quando não há fotos
        page.drawRectangle({
          x: M,
          y: y2 - photoSize,
          width: photoSize,
          height: photoSize,
          borderColor: C.border,
          borderWidth: 1,
          color: C.lightBg,
        });
        drawText(page, "Nenhuma foto disponível", M + 5, y2 - photoSize / 2, 8, C.medText, helvetica);
        drawText(page, caption, M, y2 + 8, 8, C.darkText, helvetica, "left", photoSize);
        y2 -= rowHeight;
        continue;
      }

      for (let row = 0; row < Math.ceil(photos.length / photosPerRow); row++) {
        const x1 = M;
        const x2 = M + photoSize + photoMargin;

        // Foto 1
        const photo1Index = row * photosPerRow;
        if (photo1Index < photos.length) {
          const img1 = await base64ToPdfImage(pdfDoc, photos[photo1Index]);
          page.drawImage(img1, {
            x: x1,
            y: y2 - photoSize,
            width: photoSize,
            height: photoSize,
          });
          drawText(page, `Foto ${photo1Index + 1}`, x1, y2 - photoSize - 12, 7, C.medText, helvetica);
        } else {
          // Placeholder vazio
          page.drawRectangle({
            x: x1,
            y: y2 - photoSize,
            width: photoSize,
            height: photoSize,
            borderColor: C.border,
            borderWidth: 1,
            color: C.lightBg,
          });
        }

        // Foto 2
        const photo2Index = row * photosPerRow + 1;
        if (photo2Index < photos.length) {
          const img2 = await base64ToPdfImage(pdfDoc, photos[photo2Index]);
          page.drawImage(img2, {
            x: x2,
            y: y2 - photoSize,
            width: photoSize,
            height: photoSize,
          });
          drawText(page, `Foto ${photo2Index + 1}`, x2, y2 - photoSize - 12, 7, C.medText, helvetica);
        } else {
          // Placeholder vazio
          page.drawRectangle({
            x: x2,
            y: y2 - photoSize,
            width: photoSize,
            height: photoSize,
            borderColor: C.border,
            borderWidth: 1,
            color: C.lightBg,
          });
        }

        // Legenda centralizada
        const captionY = y2 + 8;
        drawText(page, caption, PAGE_W / 2, captionY, 8, C.darkText, helvetica, "center", PAGE_W - 2 * M);

        y2 -= rowHeight;

        // Quebra de página se necessário
        if (y2 < 100 && (i < records.length - 1 || row < Math.ceil(photos.length / photosPerRow) - 1)) {
          page = pdfDoc.addPage([PAGE_W, PAGE_H]);
          // Header repetido
          page.drawRectangle({
            x: 0,
            y: PAGE_H - 100,
            width: PAGE_W,
            height: 100,
            color: C.primary,
          });
          page.drawLine({
            start: { x: M, y: PAGE_H - 100 },
            end: { x: PAGE_W - M, y: PAGE_H - 100 },
            thickness: 1,
            color: C.secondary,
          });
          // Logo na página continuação
          if (intechLogo) {
            const logoWidth = 120;
            const logoHeight = (intechLogo.height / intechLogo.width) * logoWidth;
            page.drawImage(intechLogo, {
              x: M + 20,
              y: PAGE_H - 95,
              width: logoWidth,
              height: logoHeight,
            });
          } else {
            drawText(page, "INTECH", M + 20, PAGE_H - 65, 24, C.white, helveticaBold);
            drawText(page, "ELEVADORES", M + 20, PAGE_H - 40, 12, C.accent, helvetica);
          }
          drawText(
            page,
            "ANEXO FOTOGRÁFICO DE CAMPO (continuação)",
            PAGE_W / 2,
            PAGE_H - 55,
            14,
            C.white,
            helveticaBold,
            "center",
          );
          y2 = PAGE_H - 130;
          drawText(page, "EVIDÊNCIAS FOTOGRÁFICAS DA INSPEÇÃO", M, y2, 10, C.primary, helveticaBold);
          y2 -= 20;
        }
      }
    }

    // Observações gerais
    if (generalNotes && generalNotes.trim()) {
      y2 = Math.max(y2 - 30, 120);
      drawText(page, "OBSERVAÇÕES GERAIS E PARECER TÉCNICO", M, y2, 10, C.primary, helveticaBold);
      y2 -= 18;
      page.drawLine({
        start: { x: M, y: y2 },
        end: { x: PAGE_W - M, y: y2 },
        thickness: 0.5,
        color: C.secondary,
      });
      y2 -= 12;
      drawWrapped(page, generalNotes, M, y2, 9, C.darkText, helvetica, PAGE_W - 2 * M, 14);
    }

    // Rodapé da página 2
    page.drawLine({
      start: { x: M, y: footerY },
      end: { x: PAGE_W - M, y: footerY },
      thickness: 0.3,
      color: C.border,
    });
    drawText(
      page,
      joinParts([company.legalName, company.phone, company.email]),
      M,
      footerY - 10,
      7,
      C.lightText,
      helvetica,
    );
    const totalPages = hasPhotos ? 2 : 1;
    drawText(page, `Página 2 de ${totalPages}`, PAGE_W - M, footerY - 10, 8, C.secondary, helvetica, "right");
    drawText(page, "INTECH ELEVADORES", PAGE_W / 2, footerY - 18, 6, C.secondary, helveticaBold, "center");
  }

  const pdfBytes = await pdfDoc.save();

  // Auto-download no navegador
  if (typeof window !== "undefined") {
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const customerName = customer?.name || "ordem-de-servico";
    const safeName = customerName.slice(0, 30).replace(/[^\w]+/g, "-").toLowerCase();
    const fileName = number > 0
      ? `os-${String(number).padStart(6, "0")}-${safeName}.pdf`
      : `os-rascunho-${safeName}.pdf`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return pdfBytes;
}