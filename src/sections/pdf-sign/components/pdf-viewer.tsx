import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PDFViewer.css';

import { Page, pdfjs, Document } from 'react-pdf';
import React, { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import DraggableText from './draggable-text';
import DraggableSignature from './draggable-signature';
import {
  textItemHtml,
  htmlToPlainText,
  sanitizeRichHtml,
  measureTextBoxSize,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_SIZE,
} from '../utils/text-overlay';

// Set up PDF.js worker
// Use local worker file from public folder for better reliability
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

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

interface PDFViewerProps {
  file: any;
  signatureData: string | null;
  signatures: SignatureItem[];
  onSignaturesChange: (signatures: SignatureItem[]) => void;
  placementMode: boolean;
  onPlacementModeChange: (mode: boolean) => void;
  sealData?: string | null;
  sealPlacementMode?: boolean;
  onSealPlacementModeChange?: (mode: boolean) => void;
  textItems?: TextItem[];
  onTextItemsChange?: (items: TextItem[]) => void;
  lockedTextItems?: TextItem[];
  textPlacementMode?: boolean;
  onTextPlacementModeChange?: (mode: boolean) => void;
  pendingText?: string;
  pendingHtml?: string;
  pendingFontSize?: number;
  pendingColor?: string;
  onScaleChange?: (scale: number) => void;
  onPageDimensionsChange?: (dimensions: { width: number; height: number } | null) => void;
  onCanvasOffsetChange?: (offset: { x: number; y: number } | null) => void;
  onCanvasSizeChange?: (size: { width: number; height: number } | null) => void;
  readOnly?: boolean;
  layout?: 'card' | 'immersive';
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  signatureData,
  signatures,
  onSignaturesChange,
  placementMode,
  onPlacementModeChange,
  sealData = null,
  sealPlacementMode = false,
  onSealPlacementModeChange,
  textItems = [],
  onTextItemsChange,
  lockedTextItems = [],
  textPlacementMode = false,
  onTextPlacementModeChange,
  pendingText = '',
  pendingHtml = '',
  pendingFontSize = DEFAULT_TEXT_FONT_SIZE,
  pendingColor = DEFAULT_TEXT_COLOR,
  onScaleChange,
  onPageDimensionsChange,
  onCanvasOffsetChange,
  onCanvasSizeChange,
  readOnly = false,
  layout = 'card',
}) => {
  const isImmersive = layout === 'immersive';
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(isImmersive ? 1 : 1.2);
  const [fitBaseWidth, setFitBaseWidth] = useState<number | null>(null);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [, setCanvasOffset] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isPlacing = !readOnly && (placementMode || sealPlacementMode || textPlacementMode);

  const pageRenderWidth =
    isImmersive && fitBaseWidth ? Math.round(fitBaseWidth * zoomFactor) : undefined;

  useEffect(() => {
    if (!isImmersive || !containerRef.current) return undefined;

    const el = containerRef.current;
    const update = () => {
      const next = Math.max(280, Math.floor(el.clientWidth));
      setFitBaseWidth(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isImmersive, file]);

  const reportCanvasMetrics = () => {
    if (!pageRef.current) return;
    const canvas = pageRef.current.querySelector('canvas');
    if (!canvas) return;
    canvasRef.current = canvas;
    const pageRect = pageRef.current.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const offset = {
      x: canvasRect.left - pageRect.left,
      y: canvasRect.top - pageRect.top,
    };
    const canvasSize = {
      width: canvasRect.width,
      height: canvasRect.height,
    };
    setCanvasOffset(offset);
    if (onCanvasOffsetChange) {
      onCanvasOffsetChange(offset);
    }
    if (onCanvasSizeChange) {
      onCanvasSizeChange(canvasSize);
    }
    if (onScaleChange && pageRenderWidth && canvasRect.width > 0) {
      const nativeWidth = canvas.width / (canvasRect.width / pageRenderWidth);
      if (nativeWidth > 0) {
        onScaleChange(pageRenderWidth / nativeWidth);
      }
    } else if (onScaleChange && !isImmersive) {
      onScaleChange(scale);
    }
  };

  useEffect(() => {
    if (!file) return undefined;
    const timer = window.setTimeout(reportCanvasMetrics, 150);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageRenderWidth, zoomFactor, scale, file]);

  const onDocumentLoadSuccess = ({ numPages: totalPages }: { numPages: number }) => {
    setNumPages(totalPages);
    setPageNumber(1);
  };

  const onPageLoadSuccess = (page: any) => {
    const { width, height } = page;
    const dimensions = { width, height };
    setPageDimensions(dimensions);
    if (onPageDimensionsChange) {
      onPageDimensionsChange(dimensions);
    }

    if (pageRef.current) {
      requestAnimationFrame(() => reportCanvasMetrics());
    }
  };

  const handleScaleChange = (newScale: number) => {
    if (isImmersive) {
      const clamped = Math.max(0.5, Math.min(2, newScale));
      setZoomFactor(clamped);
      setTimeout(reportCanvasMetrics, 120);
      return;
    }
    setScale(newScale);
    if (onScaleChange) {
      onScaleChange(newScale);
    }
    setTimeout(reportCanvasMetrics, 100);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const getClickPosition = (
    e: React.MouseEvent<HTMLDivElement>,
    defaultWidth: number,
    defaultHeight: number
  ): SignaturePosition | null => {
    if (!pageRef.current) return null;

    const pdfCanvas = canvasRef.current || pageRef.current.querySelector('canvas');
    if (!pdfCanvas) return null;

    const pageRect = pageRef.current.getBoundingClientRect();
    const canvasRect = pdfCanvas.getBoundingClientRect();
    const canvasOffsetX = canvasRect.left - pageRect.left;
    const canvasOffsetY = canvasRect.top - pageRect.top;
    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;
    const x = canvasOffsetX + clickX - defaultWidth / 2;
    const y = canvasOffsetY + clickY - defaultHeight / 2;

    return {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: defaultWidth,
      height: defaultHeight,
      pageNumber,
    };
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !isPlacing || !pageRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest('.draggable-signature') || target.closest('.draggable-text')) {
      return;
    }

    e.stopPropagation();

    if (textPlacementMode && onTextItemsChange && onTextPlacementModeChange) {
      const html = sanitizeRichHtml(pendingHtml || textItemHtml({ text: pendingText }));
      const plain = htmlToPlainText(html);
      if (!plain) return;

      const pdfCanvas = canvasRef.current || pageRef.current.querySelector('canvas');
      const canvasWidth = pdfCanvas?.getBoundingClientRect().width;
      const maxTextWidth = canvasWidth ? Math.round(canvasWidth * 0.85) : 420;
      const box = measureTextBoxSize(html, pendingFontSize, { maxWidth: maxTextWidth });
      const newPosition = getClickPosition(e, box.width, box.height);
      if (!newPosition) return;

      const newText: TextItem = {
        id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        text: plain,
        html,
        fontSize: pendingFontSize,
        color: pendingColor,
        position: newPosition,
      };
      onTextItemsChange([...textItems, newText]);
      onTextPlacementModeChange(false);
      return;
    }

    if (sealPlacementMode && sealData && onSealPlacementModeChange) {
      const newPosition = getClickPosition(e, 140, 140);
      if (!newPosition) return;

      const newSeal: SignatureItem = {
        id: `seal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        signatureData: sealData,
        kind: 'seal',
        position: newPosition,
      };
      onSignaturesChange([...signatures, newSeal]);
      onSealPlacementModeChange(false);
      return;
    }

    if (!placementMode || !signatureData) return;

    const newPosition = getClickPosition(e, 200, 80);
    if (!newPosition) return;

    const newSignature: SignatureItem = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      signatureData,
      kind: 'signature',
      position: newPosition,
    };

    onSignaturesChange([...signatures, newSignature]);
    onPlacementModeChange(false);
  };

  const handlePositionUpdate = (
    signatureId: string,
    position: { x: number; y: number; width: number; height: number }
  ) => {
    const updatedSignatures = signatures.map((sig) => {
      if (sig.id === signatureId) {
        return {
          ...sig,
          position: {
            ...position,
            pageNumber: sig.position.pageNumber,
          },
        };
      }
      return sig;
    });
    onSignaturesChange(updatedSignatures);
  };

  const handleRemoveSignature = (signatureId: string) => {
    onSignaturesChange(signatures.filter((sig) => sig.id !== signatureId));
  };

  const handleTextPositionUpdate = (
    textId: string,
    position: { x: number; y: number; width: number; height: number }
  ) => {
    if (!onTextItemsChange) return;
    onTextItemsChange(
      textItems.map((item) =>
        item.id === textId
          ? {
              ...item,
              position: {
                ...position,
                pageNumber: item.position.pageNumber,
              },
            }
          : item
      )
    );
  };

  const handleTextContentUpdate = (textId: string, next: { text: string; html: string }) => {
    if (!onTextItemsChange) return;
    onTextItemsChange(
      textItems.map((item) =>
        item.id === textId ? { ...item, text: next.text, html: next.html } : item
      )
    );
  };

  const handleTextStyleUpdate = (textId: string, style: { fontSize: number; color: string }) => {
    if (!onTextItemsChange) return;
    onTextItemsChange(
      textItems.map((item) => (item.id === textId ? { ...item, ...style } : item))
    );
  };

  const handleRemoveText = (textId: string) => {
    if (!onTextItemsChange) return;
    onTextItemsChange(textItems.filter((item) => item.id !== textId));
  };

  if (!file) {
    return (
      <div className="pdf-viewer-empty">
        <p>لا يوجد ملف للعرض.</p>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer${isImmersive ? ' pdf-viewer--immersive' : ''}`}>
      {!isImmersive ? (
        <div className="pdf-controls">
          <div className="page-controls">
            <button type="button" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              السابق
            </button>
            <span>
              صفحة {pageNumber} من {numPages}
            </span>
            <button type="button" onClick={goToNextPage} disabled={pageNumber >= numPages}>
              التالي
            </button>
          </div>
          <div className="zoom-controls">
            <button
              type="button"
              onClick={() => handleScaleChange(Math.max(0.5, scale - 0.2))}
            >
              -
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button type="button" onClick={() => handleScaleChange(Math.min(2, scale + 0.2))}>
              +
            </button>
          </div>
        </div>
      ) : null}

      <div className="pdf-container" ref={containerRef}>
        <div
          className={`pdf-stage ${isPlacing ? 'placement-mode' : ''}${readOnly ? ' pdf-readonly' : ''}`}
          onClick={handlePageClick}
          ref={pageRef}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="loading">جاري تحميل الملف...</div>}
            error={<div className="error">تعذر تحميل الملف. جرّب ملفاً آخر.</div>}
          >
            <Page
              pageNumber={pageNumber}
              width={pageRenderWidth}
              scale={pageRenderWidth ? undefined : scale}
              renderTextLayer={!readOnly}
              renderAnnotationLayer={false}
              onLoadSuccess={onPageLoadSuccess}
            />
          </Document>
          {!readOnly &&
            signatures
              .filter((sig) => sig.position.pageNumber === pageNumber)
              .map((sig) => (
                <DraggableSignature
                  key={sig.id}
                  signatureId={sig.id}
                  signatureData={sig.signatureData}
                  containerRef={containerRef as React.RefObject<HTMLDivElement>}
                  pageRef={pageRef as React.RefObject<HTMLDivElement>}
                  scale={scale}
                  onPositionChange={(pos) => handlePositionUpdate(sig.id, pos)}
                  onRemove={() => handleRemoveSignature(sig.id)}
                  initialPosition={sig.position}
                />
              ))}
          {lockedTextItems
            .filter((item) => item.position.pageNumber === pageNumber)
            .map((item) => (
              <DraggableText
                key={`locked-${item.id}`}
                textId={item.id}
                text={item.text}
                html={item.html}
                fontSize={item.fontSize}
                color={item.color}
                pageRef={pageRef as React.RefObject<HTMLDivElement>}
                readOnly
                onPositionChange={() => {}}
                onTextChange={() => {}}
                onStyleChange={() => {}}
                onRemove={() => {}}
                initialPosition={item.position}
              />
            ))}
          {textItems
            .filter((item) => item.position.pageNumber === pageNumber)
            .map((item) => (
              <DraggableText
                key={item.id}
                textId={item.id}
                text={item.text}
                html={item.html}
                fontSize={item.fontSize}
                color={item.color}
                pageRef={pageRef as React.RefObject<HTMLDivElement>}
                readOnly={readOnly}
                onPositionChange={(pos) => handleTextPositionUpdate(item.id, pos)}
                onTextChange={(next) => handleTextContentUpdate(item.id, next)}
                onStyleChange={(style) => handleTextStyleUpdate(item.id, style)}
                onRemove={() => handleRemoveText(item.id)}
                initialPosition={item.position}
              />
            ))}
        </div>
        {placementMode && (
          <div className="placement-hint">انقر على الملف لوضع التوقيع</div>
        )}
        {sealPlacementMode && (
          <div className="placement-hint">انقر على الملف لوضع الختم</div>
        )}
        {textPlacementMode && (
          <div className="placement-hint">انقر على الملف لوضع النص</div>
        )}
      </div>

      {isImmersive ? (
        <Box className="pdf-footer-bar">
          <Box className="pdf-footer-zoom">
            <IconButton
              size="small"
              aria-label="Zoom out"
              onClick={() => handleScaleChange(Math.max(0.5, zoomFactor - 0.15))}
            >
              <Iconify icon="eva:minus-fill" width={18} />
            </IconButton>
            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 44, textAlign: 'center' }}>
              {Math.round(zoomFactor * 100)}%
            </Typography>
            <IconButton
              size="small"
              aria-label="Zoom in"
              onClick={() => handleScaleChange(Math.min(2, zoomFactor + 0.15))}
            >
              <Iconify icon="eva:plus-fill" width={18} />
            </IconButton>
          </Box>

          {numPages > 0 ? (
            <Pagination
              count={numPages}
              page={pageNumber}
              onChange={(_, page) => setPageNumber(page)}
              color="primary"
              size="small"
              siblingCount={isImmersive ? 1 : 0}
              boundaryCount={1}
            />
          ) : null}
        </Box>
      ) : null}
    </div>
  );
};
