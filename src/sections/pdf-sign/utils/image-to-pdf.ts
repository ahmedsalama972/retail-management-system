import { PDFDocument } from 'pdf-lib';

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

async function rasterToPngBytes(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('تعذر قراءة الصورة'));
      image.src = objectUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, img.naturalWidth || img.width);
    canvas.height = Math.max(1, img.naturalHeight || img.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر تحويل الصورة');
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function ensurePdfFile(file: File): Promise<File> {
  if (isPdfFile(file)) return file;

  const pdf = await PDFDocument.create();
  const type = file.type.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    if (type.includes('png')) {
      const image = await pdf.embedPng(bytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } else if (type.includes('jpeg') || type.includes('jpg')) {
      const image = await pdf.embedJpg(bytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } else {
      const raster = await rasterToPngBytes(file);
      const image = await pdf.embedPng(raster.bytes);
      const page = pdf.addPage([raster.width, raster.height]);
      page.drawImage(image, { x: 0, y: 0, width: raster.width, height: raster.height });
    }
  } catch {
    const raster = await rasterToPngBytes(file);
    const image = await pdf.embedPng(raster.bytes);
    const page = pdf.addPage([raster.width, raster.height]);
    page.drawImage(image, { x: 0, y: 0, width: raster.width, height: raster.height });
  }

  const pdfBytes = await pdf.save();
  const name = file.name.replace(/\.[^.]+$/, '') || 'document';
  return new File([new Uint8Array(pdfBytes) as BlobPart], `${name}.pdf`, { type: 'application/pdf' });
}
