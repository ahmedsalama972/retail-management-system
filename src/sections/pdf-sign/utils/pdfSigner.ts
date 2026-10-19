import { PDFDocument } from 'pdf-lib';

import { getAuthToken } from 'src/utils/auth-session';
import { dataUrlToBlob } from 'src/utils/compress-image';

import {
  textItemHtml,
  htmlToPlainText,
  wrapCanvasLines,
  TEXT_BOX_PADDING,
  TEXT_FONT_FAMILY,
  TEXT_LINE_HEIGHT,
  clampTextFontSize,
  rasterizeRichHtml,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_SIZE,
} from './text-overlay';

export interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface SignatureItem {
  id: string;
  signatureData: string;
  kind?: 'signature' | 'seal';
  position: SignaturePosition;
}

export interface TextItem {
  id: string;
  text: string;
  html?: string;
  fontSize?: number;
  color?: string;
  position: SignaturePosition;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function fetchImageBlob(src: string): Promise<Blob> {
  if (src.startsWith('data:')) {
    return dataUrlToBlob(src);
  }

  const token = getAuthToken();
  const res = await fetch(src, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Could not load signature image');
  }
  return res.blob();
}

/** Convert a data URL, remote PNG/JPG/WebP/SVG, or blob URL into PNG bytes for pdf-lib. */
async function imageSourceToPngBytes(src: string): Promise<Uint8Array> {
  if (src.startsWith('data:image/png')) {
    return dataUrlToUint8Array(src);
  }

  const blob = await fetchImageBlob(src);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const pngDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, img.naturalWidth || img.width);
        canvas.height = Math.max(1, img.naturalHeight || img.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not rasterize signature'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Could not decode signature image'));
      img.src = objectUrl;
    });
    return dataUrlToUint8Array(pngDataUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function loadPdfDocument(arrayBuffer: ArrayBuffer) {
  try {
    return await PDFDocument.load(arrayBuffer);
  } catch {
    return PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  }
}

/** Rasterize text so Arabic / Unicode / rich formatting work without embedding fonts. */
export async function textItemToPngDataUrl(item: TextItem): Promise<string> {
  const { width, height } = item.position;
  const fontSize = clampTextFontSize(item.fontSize ?? DEFAULT_TEXT_FONT_SIZE);
  const color = item.color || DEFAULT_TEXT_COLOR;
  const html = textItemHtml(item);
  const plain = htmlToPlainText(html);
  const isRtl = /[\u0600-\u06FF]/.test(plain || item.text || '');

  try {
    return await rasterizeRichHtml({ html, width, height, fontSize, color, rtl: isRtl });
  } catch {
    const dpr = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create canvas for text overlay');
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padding = TEXT_BOX_PADDING;
    const maxWidth = Math.max(8, width - padding * 2);
    const lineHeight = fontSize * TEXT_LINE_HEIGHT;

    ctx.font = `${fontSize}px ${TEXT_FONT_FAMILY}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = isRtl ? 'right' : 'left';

    const lines = wrapCanvasLines((value) => ctx.measureText(value).width, plain || item.text, maxWidth);
    const x = isRtl ? width - padding : padding;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    lines.forEach((line, index) => {
      const y = padding + index * lineHeight;
      if (y >= height) return;
      ctx.fillText(line, x, y);
    });
    ctx.restore();

    return canvas.toDataURL('image/png');
  }
}

function mapScreenToPdf(
  position: SignaturePosition,
  pageWidth: number,
  pageHeight: number,
  scale: number,
  pageDimensions: { width: number; height: number } | null,
  canvasOffset?: { x: number; y: number },
  canvasSize?: { width: number; height: number }
) {
  let pdfX: number;
  let pdfY: number;
  let pdfWidth: number;
  let pdfHeight: number;

  if (pageDimensions && canvasOffset) {
    const canvasRelativeX = Math.max(0, position.x - canvasOffset.x);
    const canvasRelativeY = Math.max(0, position.y - canvasOffset.y);
    const screenWidth = canvasSize?.width || pageDimensions.width * scale;
    const screenHeight = canvasSize?.height || pageDimensions.height * scale;

    pdfX = (canvasRelativeX / screenWidth) * pageWidth;
    const screenYTop = canvasRelativeY;
    const pdfYTop = pageHeight - (screenYTop / screenHeight) * pageHeight;
    pdfHeight = (position.height / screenHeight) * pageHeight;
    pdfY = pdfYTop - pdfHeight;
    pdfWidth = (position.width / screenWidth) * pageWidth;

    pdfX = Math.max(0, Math.min(pdfX, pageWidth - pdfWidth));
    pdfY = Math.max(0, Math.min(pdfY, pageHeight - pdfHeight));
  } else {
    const pdfScale = 72 / (96 * scale);
    const canvasRelativeX = canvasOffset ? position.x - canvasOffset.x : position.x;
    const canvasRelativeY = canvasOffset ? position.y - canvasOffset.y : position.y;
    pdfX = canvasRelativeX * pdfScale;
    pdfWidth = position.width * pdfScale;
    pdfHeight = position.height * pdfScale;
    const screenYTop = canvasRelativeY;
    const pdfYTop = pageHeight - screenYTop * pdfScale;
    pdfY = pdfYTop - pdfHeight;
  }

  return { pdfX, pdfY, pdfWidth, pdfHeight };
}

export const signPDF = async (
  pdfFile: File,
  signatures: SignatureItem[],
  scale: number = 1.2,
  pageDimensions: { width: number; height: number } | null = null,
  canvasOffset?: { x: number; y: number },
  canvasSize?: { width: number; height: number },
  textItems: TextItem[] = []
): Promise<Uint8Array> => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await loadPdfDocument(arrayBuffer);
    const pages = pdfDoc.getPages();

    for (const signatureItem of signatures) {
      const { signatureData, position } = signatureItem;

      if (position.pageNumber < 1 || position.pageNumber > pages.length) {
        console.warn(`Invalid page number ${position.pageNumber} for signature ${signatureItem.id}`);
        continue;
      }

      const pageToSign = pages[position.pageNumber - 1];
      const { width: pageWidth, height: pageHeight } = pageToSign.getSize();
      const pngBytes = await imageSourceToPngBytes(signatureData);
      const signatureImage = await pdfDoc.embedPng(pngBytes);
      const { pdfX, pdfY, pdfWidth, pdfHeight } = mapScreenToPdf(
        position,
        pageWidth,
        pageHeight,
        scale,
        pageDimensions,
        canvasOffset,
        canvasSize
      );

      pageToSign.drawImage(signatureImage, {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
      });
    }

    for (const textItem of textItems) {
      if (!textItem.text.trim()) continue;
      if (textItem.position.pageNumber < 1 || textItem.position.pageNumber > pages.length) {
        console.warn(`Invalid page number ${textItem.position.pageNumber} for text ${textItem.id}`);
        continue;
      }

      const pageToSign = pages[textItem.position.pageNumber - 1];
      const { width: pageWidth, height: pageHeight } = pageToSign.getSize();
      const pngDataUrl = await textItemToPngDataUrl(textItem);
      const textImage = await pdfDoc.embedPng(dataUrlToUint8Array(pngDataUrl));
      const { pdfX, pdfY, pdfWidth, pdfHeight } = mapScreenToPdf(
        textItem.position,
        pageWidth,
        pageHeight,
        scale,
        pageDimensions,
        canvasOffset,
        canvasSize
      );

      pageToSign.drawImage(textImage, {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
      });
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error signing PDF:', error);
    if (error instanceof Error && error.message && error.message !== 'Failed to sign PDF') {
      throw error;
    }
    throw new Error('Failed to sign PDF');
  }
};

export const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
