import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type ExportOptions = {
  filename?: string;
  /** Keep in sync with @page margins used for print (mm). */
  marginMm?: number;
  /** CSS width of printable content area (A4 @ 96dpi ≈ 794px). */
  pageWidthPx?: number;
};

type AvoidZone = { top: number; bottom: number };

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function collectAvoidZones(root: HTMLElement): AvoidZone[] {
  const selectors = [
    '.case-report-banner',
    '.case-report-alert',
    '.case-report-section',
    '.case-report-keep',
    '.case-report-footer',
    '.case-report-section .MuiGrid-item',
  ].join(', ');

  const rootRect = root.getBoundingClientRect();
  const zones: AvoidZone[] = [];

  root.querySelectorAll(selectors).forEach((node) => {
    const el = node as HTMLElement;
    const rect = el.getBoundingClientRect();
    const top = rect.top - rootRect.top + root.scrollTop;
    const bottom = top + rect.height;
    if (rect.height > 8) {
      zones.push({ top, bottom });
    }
  });

  return zones.sort((a, b) => a.top - b.top || a.bottom - b.bottom);
}

/**
 * Choose vertical cut points that prefer gaps between print "keep-together"
 * blocks — the same intent as CSS `page-break-inside: avoid`.
 */
function computePageBreaks(
  totalHeightPx: number,
  pageHeightPx: number,
  zones: AvoidZone[],
  scale: number
): number[] {
  const scaledZones = zones.map((zone) => ({
    top: zone.top * scale,
    bottom: zone.bottom * scale,
  }));

  const breaks: number[] = [];
  let pageStart = 0;
  const minUseful = Math.max(48, pageHeightPx * 0.12);

  while (pageStart < totalHeightPx - 1) {
    const idealEnd = Math.min(pageStart + pageHeightPx, totalHeightPx);
    if (idealEnd >= totalHeightPx) {
      breaks.push(totalHeightPx);
      break;
    }

    let breakY = idealEnd;

    const overlapping = scaledZones.filter(
      (zone) => zone.top < idealEnd - 1 && zone.bottom > idealEnd + 1 && zone.top >= pageStart - 1
    );

    if (overlapping.length) {
      // Prefer breaking just before the first block that would be cut.
      const beforeCut = overlapping
        .map((zone) => zone.top)
        .filter((top) => top > pageStart + minUseful)
        .sort((a, b) => b - a);

      if (beforeCut.length) {
        breakY = beforeCut[0];
      } else {
        // Block starts near the top of the page and is taller than one page:
        // try to land on an inner keep-together child's boundary if possible.
        const innerCandidates = scaledZones
          .map((zone) => zone.bottom)
          .filter((y) => y > pageStart + minUseful && y <= idealEnd)
          .sort((a, b) => b - a);
        if (innerCandidates.length) {
          breakY = innerCandidates[0];
        }
      }
    } else {
      // Fill the page, but snap to the latest keep-together end inside the page
      // so the next page starts at a clean block boundary.
      const snapCandidates = scaledZones
        .map((zone) => zone.bottom)
        .filter((y) => y > pageStart + minUseful && y <= idealEnd)
        .sort((a, b) => b - a);
      if (snapCandidates.length && idealEnd - snapCandidates[0] < pageHeightPx * 0.22) {
        breakY = snapCandidates[0];
      }
    }

    if (breakY <= pageStart + 8) {
      breakY = idealEnd;
    }

    breaks.push(breakY);
    pageStart = breakY;
  }

  return breaks;
}

function cropCanvas(source: HTMLCanvasElement, startY: number, endY: number): HTMLCanvasElement {
  const height = Math.max(1, Math.ceil(endY - startY));
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = source.width;
  pageCanvas.height = height;
  const ctx = pageCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('تعذر تجهيز صفحة PDF');
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  ctx.drawImage(source, 0, startY, source.width, height, 0, 0, source.width, height);
  return pageCanvas;
}

/**
 * Clone the report node into an off-screen container that uses the same
 * styles as `@media print`, then rasterize it to a multi-page A4 PDF
 * with break points aligned to print keep-together blocks.
 */
export async function exportPrintLikePdf(source: HTMLElement, options: ExportOptions = {}) {
  const filename = options.filename || 'report.pdf';
  const marginMm = options.marginMm ?? 10;
  const pageWidthPx = options.pageWidthPx ?? 794;

  const host = document.createElement('div');
  host.className = 'case-report-print-mode';
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = [
    'position: fixed',
    'left: -12000px',
    'top: 0',
    `width: ${pageWidthPx}px`,
    'background: #ffffff',
    'z-index: -1',
    'pointer-events: none',
    'overflow: visible',
  ].join(';');

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((node) => node.remove());
  clone
    .querySelectorAll(
      'button, .MuiButton-root, .MuiIconButton-root, .MuiAutocomplete-endAdornment, .MuiInputAdornment-root'
    )
    .forEach((node) => node.remove());

  clone.querySelectorAll('.print-only').forEach((node) => {
    const el = node as HTMLElement;
    const isGrid = el.classList.contains('MuiGrid-container') || el.querySelector(':scope > .MuiGrid-item');
    el.style.setProperty('display', isGrid ? 'flex' : 'block', 'important');
  });

  // Strip form placeholders like "ادخل …" so empty fields show a clean dash
  clone.querySelectorAll('input, textarea').forEach((node) => {
    const input = node as HTMLInputElement | HTMLTextAreaElement;
    const raw = (input.value || '').trim();
    const ph = (input.getAttribute('placeholder') || '').trim();
    if (!raw || /^ادخل/.test(raw) || /^ادخل/.test(ph)) {
      input.value = raw && !/^ادخل/.test(raw) ? raw : '—';
      input.removeAttribute('placeholder');
    }
  });

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await waitForNextPaint();
    await new Promise((resolve) => setTimeout(resolve, 120));

    const avoidZones = collectAvoidZones(host);

    const canvas = await html2canvas(host, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: pageWidthPx,
      windowWidth: pageWidthPx,
      windowHeight: Math.max(host.scrollHeight, host.offsetHeight),
      scrollX: 0,
      scrollY: 0,
      onclone: (_doc, element) => {
        element.querySelectorAll('.print-only').forEach((node) => {
          const el = node as HTMLElement;
          const isGrid =
            el.classList.contains('MuiGrid-container') || !!el.querySelector(':scope > .MuiGrid-item');
          el.style.setProperty('display', isGrid ? 'flex' : 'block', 'important');
        });
      },
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginMm * 2;
    const contentHeight = pageHeight - marginMm * 2;

    const scale = canvas.width / pageWidthPx;
    const pageHeightPx = (contentHeight / contentWidth) * canvas.width;
    const breaks = computePageBreaks(canvas.height, pageHeightPx, avoidZones, scale);

    let startY = 0;
    breaks.forEach((endY, index) => {
      const slice = cropCanvas(canvas, startY, endY);
      const sliceHeightMm = (slice.height * contentWidth) / slice.width;
      if (index > 0) {
        pdf.addPage();
      }
      pdf.addImage(slice.toDataURL('image/png', 1.0), 'PNG', marginMm, marginMm, contentWidth, sliceHeightMm);
      startY = endY;
    });

    pdf.save(filename);
  } finally {
    host.remove();
  }
}
