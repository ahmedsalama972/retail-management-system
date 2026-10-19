import './DraggableSignature.css';

import React, { useRef, useState, useEffect } from 'react';

// Update position when initialPosition prop changes

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableSignatureProps {
  signatureId: string;
  signatureData: string;
  containerRef: React.RefObject<HTMLDivElement>;
  pageRef: React.RefObject<HTMLDivElement>;
  scale: number;
  onPositionChange: (position: SignaturePosition) => void;
  onRemove: () => void;
  initialPosition?: SignaturePosition;
}

const DraggableSignature: React.FC<DraggableSignatureProps> = ({
  signatureData,
  containerRef,
  pageRef,
  scale,
  onPositionChange,
  onRemove,
  initialPosition,
}) => {
  const [position, setPosition] = useState<SignaturePosition>(
    initialPosition || {
      x: 50,
      y: 50,
      width: 200,
      height: 80,
    }
  );

  // Update position when initialPosition changes (e.g., when placed via click)
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const signatureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!pageRef.current) return;

      if (isDragging) {
        const pageRect = pageRef.current.getBoundingClientRect();
        const relativeX = e.clientX - pageRect.left - dragStart.x;
        const relativeY = e.clientY - pageRect.top - dragStart.y;

        setPosition((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(relativeX, pageRect.width - prev.width)),
          y: Math.max(0, Math.min(relativeY, pageRect.height - prev.height)),
        }));
      } else if (isResizing) {
        const pageRect = pageRef.current.getBoundingClientRect();
        const relativeX = e.clientX - pageRect.left;
        const relativeY = e.clientY - pageRect.top;

        const newWidth = Math.max(100, relativeX - position.x);
        const newHeight = Math.max(40, relativeY - position.y);

        setPosition((prev) => ({
          ...prev,
          width: Math.min(newWidth, pageRect.width - prev.x),
          height: Math.min(newHeight, pageRect.height - prev.y),
        }));
      }
    };

    const handlePointerUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(false);
        setPosition((prev) => {
          onPositionChange(prev);
          return prev;
        });
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, isResizing, dragStart, position, pageRef, onPositionChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle') || target.classList.contains('remove-signature')) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);

    if (signatureRef.current) {
      const signatureRect = signatureRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - signatureRect.left,
        y: e.clientY - signatureRect.top,
      });
      signatureRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    if (signatureRef.current) {
      signatureRef.current.setPointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={signatureRef}
      className="draggable-signature"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
      onPointerDown={handlePointerDown}
    >
      <div className="signature-content">
        <img
          src={signatureData}
          alt="Signature"
          draggable={false}
        />
      </div>
      <button className="remove-signature" onClick={onRemove} title="Remove signature">
        ×
      </button>
      <div
        className="resize-handle"
        onPointerDown={handleResizePointerDown}
        title="Resize signature"
      />
    </div>
  );
};

export default DraggableSignature;
