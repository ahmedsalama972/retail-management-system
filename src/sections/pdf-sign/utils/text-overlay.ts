import { DEFAULT_INK_COLOR } from './ink-colors';

export const DEFAULT_TEXT_FONT_SIZE = 16;
export const DEFAULT_TEXT_COLOR = DEFAULT_INK_COLOR;
export const MIN_TEXT_FONT_SIZE = 8;
export const MAX_TEXT_FONT_SIZE = 72;
export const TEXT_LINE_HEIGHT = 1.25;
export const TEXT_BOX_PADDING = 4;
export const TEXT_FONT_FAMILY = '"Cairo", "Segoe UI", Tahoma, Arial, sans-serif';

const ALLOWED_RICH_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'BR',
  'DIV',
  'P',
  'SPAN',
  'UL',
  'OL',
  'LI',
  'FONT',
]);

const ALLOWED_RICH_STYLES = new Set([
  'color',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-decoration-line',
  'text-align',
  'background-color',
  'line-height',
  'direction',
]);

export function clampTextFontSize(size: number) {
  return Math.min(MAX_TEXT_FONT_SIZE, Math.max(MIN_TEXT_FONT_SIZE, Math.round(size || DEFAULT_TEXT_FONT_SIZE)));
}

export function stepTextFontSize(current: number, delta: number) {
  return clampTextFontSize(clampTextFontSize(current) + delta);
}

function selectionHasText() {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().length > 0);
}

/** Apply A+/A− to overlay or editor HTML so inner spans cannot keep a stale size. */
export function applyFontSizeToContent(
  editor: HTMLElement,
  px: number,
  options?: { selectionOnly?: boolean }
) {
  const size = clampTextFontSize(px);
  const css = `${size}px`;
  const selectionOnly = Boolean(options?.selectionOnly && selectionHasText());

  if (selectionOnly) {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontSize', false, '7');
    editor.querySelectorAll('font[size="7"]').forEach((node) => {
      const span = document.createElement('span');
      span.style.fontSize = css;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    editor.querySelectorAll('span').forEach((span) => {
      const current = span.style.fontSize;
      if (current === 'xxx-large' || current === '-webkit-xxx-large') {
        span.style.fontSize = css;
      }
    });
    return size;
  }

  editor.style.fontSize = css;
  editor.querySelectorAll<HTMLElement>('*').forEach((el) => {
    el.style.removeProperty('font-size');
    if (el.tagName === 'FONT') el.removeAttribute('size');
  });
  return size;
}

export function defaultTextBoxSize(fontSize: number, canvasWidth?: number) {
  const size = clampTextFontSize(fontSize);
  const width = Math.round(Math.min(Math.max(120, canvasWidth ? canvasWidth * 0.45 : 240), 420));
  const height = Math.round(size * TEXT_LINE_HEIGHT + TEXT_BOX_PADDING * 2 + 4);
  return { width, height: Math.max(height, 48) };
}

/** Natural text box size from HTML content (not full-page width). */
export function measureTextBoxSize(
  html: string,
  fontSize: number,
  options?: { maxWidth?: number; minWidth?: number }
) {
  const size = clampTextFontSize(fontSize);
  const maxWidth = options?.maxWidth ?? 420;
  const minWidth = options?.minWidth ?? 48;

  if (typeof document === 'undefined') {
    return defaultTextBoxSize(fontSize, maxWidth);
  }

  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    `font-size:${size}px`,
    `font-family:${TEXT_FONT_FAMILY}`,
    `line-height:${TEXT_LINE_HEIGHT}`,
    `padding:${TEXT_BOX_PADDING}px`,
    'box-sizing:border-box',
    'white-space:pre-wrap',
    'overflow-wrap:anywhere',
    'word-break:break-word',
    'display:inline-block',
    `max-width:${maxWidth}px`,
    'width:max-content',
  ].join(';');
  host.innerHTML = sanitizeRichHtml(html || '');
  document.body.appendChild(host);

  const width = Math.ceil(host.scrollWidth);
  const height = Math.ceil(host.scrollHeight);
  host.remove();

  return {
    width: Math.max(minWidth, Math.min(width, maxWidth)),
    height: Math.max(48, height),
  };
}

export function escapeHtml(text: string) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

export function htmlToPlainText(html: string) {
  if (!html) return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.innerText || el.textContent || '').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function isRichTextEmpty(html: string) {
  return htmlToPlainText(html).length === 0;
}

function sanitizeStyleValue(style: string) {
  return style
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const idx = rule.indexOf(':');
      if (idx < 0) return '';
      const prop = rule.slice(0, idx).trim().toLowerCase();
      const val = rule.slice(idx + 1).trim();
      if (!ALLOWED_RICH_STYLES.has(prop)) return '';
      if (/expression|url\s*\(|javascript:/i.test(val)) return '';
      return `${prop}: ${val}`;
    })
    .filter(Boolean)
    .join('; ');
}

export function sanitizeRichHtml(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html || '';

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as HTMLElement;
      if (!ALLOWED_RICH_TAGS.has(el.tagName)) {
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
        return;
      }
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name === 'style') {
          const next = sanitizeStyleValue(el.getAttribute('style') || '');
          if (next) el.setAttribute('style', next);
          else el.removeAttribute('style');
          return;
        }
        if (el.tagName === 'FONT' && (name === 'color' || name === 'face' || name === 'size')) {
          return;
        }
        el.removeAttribute(attr.name);
      });
      walk(el);
    });
  };

  walk(root);
  return root.innerHTML;
}

export function textItemHtml(item: { html?: string; text?: string }) {
  if (item.html && item.html.trim()) return sanitizeRichHtml(item.html);
  return escapeHtml(item.text || '');
}

export function wrapCanvasLines(
  measure: (text: string) => number,
  text: string,
  maxWidth: number
): string[] {
  const safeWidth = Math.max(8, maxWidth);
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];

  const pushWrappedToken = (token: string) => {
    let chunk = '';
    for (const char of Array.from(token)) {
      const trial = chunk + char;
      if (chunk && measure(trial) > safeWidth) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk = trial;
      }
    }
    return chunk;
  };

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('');
      continue;
    }

    const tokens = paragraph.split(/(\s+)/);
    let current = '';

    for (const token of tokens) {
      const next = current + token;
      if (measure(next) <= safeWidth) {
        current = next;
        continue;
      }

      if (current.trim()) {
        lines.push(current.replace(/\s+$/u, ''));
        current = '';
      }

      if (!token.trim()) {
        continue;
      }

      if (measure(token) <= safeWidth) {
        current = token.replace(/^\s+/u, '');
        continue;
      }

      current = pushWrappedToken(token);
    }

    if (current) {
      lines.push(current.replace(/\s+$/u, ''));
    }
  }

  return lines.length ? lines : [''];
}

function copyComputedStyles(source: HTMLElement, target: HTMLElement) {
  const srcNodes = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))];
  const dstNodes = [target, ...Array.from(target.querySelectorAll<HTMLElement>('*'))];
  const props = [
    'display',
    'color',
    'background-color',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'letter-spacing',
    'line-height',
    'text-align',
    'text-decoration',
    'text-decoration-line',
    'text-decoration-color',
    'direction',
    'unicode-bidi',
    'white-space',
    'overflow-wrap',
    'word-break',
    'padding',
    'margin',
    'box-sizing',
    'width',
    'height',
    'overflow',
    'list-style-type',
    'padding-inline-start',
  ];
  srcNodes.forEach((src, index) => {
    const dst = dstNodes[index];
    if (!dst) return;
    const computed = getComputedStyle(src);
    props.forEach((prop) => {
      dst.style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
    });
  });
}

export async function rasterizeRichHtml(options: {
  html: string;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  rtl?: boolean;
}): Promise<string> {
  const { html, width, height, fontSize, color, rtl } = options;
  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${Math.max(1, width)}px`,
    `height:${Math.max(1, height)}px`,
    'overflow:hidden',
    `padding:${TEXT_BOX_PADDING}px`,
    'box-sizing:border-box',
    `font-size:${fontSize}px`,
    `color:${color}`,
    `font-family:${TEXT_FONT_FAMILY}`,
    `line-height:${TEXT_LINE_HEIGHT}`,
    'white-space:pre-wrap',
    'overflow-wrap:anywhere',
    'word-break:break-word',
    'background:transparent',
    rtl ? 'direction:rtl' : 'direction:ltr',
    'unicode-bidi:plaintext',
  ].join(';');
  host.innerHTML = sanitizeRichHtml(html);
  document.body.appendChild(host);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))));

    const clone = host.cloneNode(true) as HTMLElement;
    copyComputedStyles(host, clone);
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const xhtml = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${xhtml}</foreignObject></svg>`;
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    const dpr = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas for text overlay');

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => reject(new Error('Could not rasterize rich text'));
      img.src = url;
    });

    return canvas.toDataURL('image/png');
  } finally {
    host.remove();
  }
}
