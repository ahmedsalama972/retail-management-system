import { useState, useEffect } from 'react';

import { getAuthToken } from 'src/utils/auth-session';
import { dataUrlToBlob } from 'src/utils/compress-image';

/** Preset ink colors for signatures and rich text (not a free color picker). */
export const INK_COLORS = ['#000000', '#333333', '#0047AB', '#D22B2B', '#008040'] as const;

export type InkColor = (typeof INK_COLORS)[number];

export const DEFAULT_INK_COLOR: InkColor = '#000000';

export function normalizeInkColor(color?: string | null): InkColor {
  const value = String(color || '').trim().toUpperCase();
  const found = INK_COLORS.find((item) => item.toUpperCase() === value);
  if (found) return found;
  if (value === '#111827' || value === '#1B2A3A' || value === '#000') return DEFAULT_INK_COLOR;
  return DEFAULT_INK_COLOR;
}

async function blobFromSource(src: string): Promise<Blob> {
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

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export async function tintInkImage(src: string, color: string): Promise<string> {
  const hex = normalizeInkColor(color);
  // Keep original artwork when black ink is selected — no need to recolor.
  if (hex === DEFAULT_INK_COLOR) {
    return src;
  }

  const blob = await blobFromSource(src);
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not decode signature image'));
      image.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, img.naturalWidth || img.width);
    canvas.height = Math.max(1, img.naturalHeight || img.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { r: tintR, g: tintG, b: tintB } = hexToRgb(hex);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha === 0) continue;
      const ink = (255 - (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3) / 255;
      // Treat near-white pixels as transparent background; tint the ink strokes.
      const strength = Math.max(ink, alpha / 255);
      pixels[i] = tintR;
      pixels[i + 1] = tintG;
      pixels[i + 2] = tintB;
      pixels[i + 3] = Math.round(alpha * strength);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function useTintedSignature(source: string | null, color: string) {
  const [tinted, setTinted] = useState<string | null>(source);

  useEffect(() => {
    if (!source) {
      setTinted(null);
      return undefined;
    }

    setTinted(source);
    let cancelled = false;
    tintInkImage(source, color)
      .then((url) => {
        if (!cancelled) setTinted(url);
      })
      .catch(() => {
        if (!cancelled) setTinted(source);
      });

    return () => {
      cancelled = true;
    };
  }, [source, color]);

  return tinted;
}
