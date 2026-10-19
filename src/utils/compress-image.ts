/** Decode a data: URL without fetch() — CSP connect-src often blocks data: fetches. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?((?:;[^;,]+)*)?(;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const mime = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[3]);
  const data = match[4] || '';
  if (isBase64) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(data)], { type: mime });
}
