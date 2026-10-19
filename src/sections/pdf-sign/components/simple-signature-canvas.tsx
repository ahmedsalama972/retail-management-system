import SignatureCanvas from 'react-signature-canvas';
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface SimpleSignatureCanvasProps {
  onEnd?: () => void;
  penColor?: string;
  canvasProps?: {
    width?: number;
    height?: number;
    className?: string;
    backgroundColor?: string;
  };
  height?: number;
}

export interface SignatureCanvasHandle {
  getTrimmedCanvas: () => HTMLCanvasElement;
  getTransparentDataUrl: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

/** Convert opaque light/gray pad pixels to transparent so the PDF shows ink only. */
export function canvasToTransparentPng(source: HTMLCanvasElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return source.toDataURL('image/png');

  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (a === 0) continue;

    // Near-white / light-gray pad backgrounds become fully transparent.
    const brightness = (r + g + b) / 3;
    if (brightness > 230) {
      pixels[i + 3] = 0;
      continue;
    }

    // Soften remaining light pixels into partial transparency for cleaner edges.
    if (brightness > 180) {
      pixels[i + 3] = Math.round(a * ((255 - brightness) / 75));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export const SimpleSignatureCanvas = forwardRef<SignatureCanvasHandle, SimpleSignatureCanvasProps>(
  ({ onEnd, penColor = '#000', canvasProps = {}, height = 220 }, ref) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const sigPadRef = useRef<SignatureCanvas>(null);
    const strokesRef = useRef<string | null>(null);
    const [width, setWidth] = useState(() => canvasProps.width || 0);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return undefined;
      const apply = () => {
        const next = Math.max(280, Math.floor(el.clientWidth));
        setWidth((prev) => (Math.abs(prev - next) < 2 ? prev : next));
      };
      apply();
      const ro = new ResizeObserver(apply);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      if (!width || !sigPadRef.current || !strokesRef.current) return;
      try {
        sigPadRef.current.fromDataURL(strokesRef.current);
      } catch {
        // ignore restore failures after a size change
      }
    }, [width]);

    useImperativeHandle(
      ref,
      () => ({
        getTrimmedCanvas: () => {
          if (!sigPadRef.current) {
            throw new Error('Canvas not found');
          }
          try {
            if (typeof sigPadRef.current.getTrimmedCanvas === 'function') {
              return sigPadRef.current.getTrimmedCanvas();
            }
          } catch {
            // empty or unsupported trim — fall through
          }
          return sigPadRef.current.getCanvas();
        },
        getTransparentDataUrl: () => {
          if (!sigPadRef.current) {
            throw new Error('Canvas not found');
          }
          let canvas: HTMLCanvasElement;
          try {
            canvas =
              typeof sigPadRef.current.getTrimmedCanvas === 'function'
                ? sigPadRef.current.getTrimmedCanvas()
                : sigPadRef.current.getCanvas();
          } catch {
            canvas = sigPadRef.current.getCanvas();
          }
          return canvasToTransparentPng(canvas);
        },
        clear: () => {
          strokesRef.current = null;
          sigPadRef.current?.clear();
        },
        isEmpty: () => Boolean(sigPadRef.current?.isEmpty?.() ?? true),
      }),
      []
    );

    const canvasHeight = canvasProps.height || height;

    return (
      <div
        ref={wrapRef}
        className="signature-canvas-wrap"
        style={{
          width: '100%',
          borderRadius: 8,
          border: '1px dashed #cbd5e1',
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
        }}
      >
        {width > 0 ? (
          <SignatureCanvas
            ref={sigPadRef}
            canvasProps={{
              className: canvasProps.className || 'signature-canvas',
              width,
              height: canvasHeight,
              style: { width, height: canvasHeight, display: 'block', background: 'transparent' },
            }}
            backgroundColor="rgba(0,0,0,0)"
            penColor={penColor}
            onEnd={() => {
              try {
                strokesRef.current = sigPadRef.current?.toDataURL('image/png') || null;
              } catch {
                strokesRef.current = null;
              }
              onEnd?.();
            }}
          />
        ) : (
          <div style={{ height: canvasHeight }} />
        )}
      </div>
    );
  }
);

SimpleSignatureCanvas.displayName = 'SimpleSignatureCanvas';
