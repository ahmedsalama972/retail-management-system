import './DraggableSignature.css';
import './DraggableText.css';

import React, { useRef, useState, useEffect } from 'react';

import { RichTextToolbar } from './rich-text-editor';
import {
  escapeHtml,
  textItemHtml,
  htmlToPlainText,
  TEXT_BOX_PADDING,
  TEXT_FONT_FAMILY,
  TEXT_LINE_HEIGHT,
  sanitizeRichHtml,
  stepTextFontSize,
  clampTextFontSize,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_SIZE,
  applyFontSizeToContent,
} from '../utils/text-overlay';

interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableTextProps {
  textId: string;
  text: string;
  html?: string;
  fontSize?: number;
  color?: string;
  pageRef: React.RefObject<HTMLDivElement>;
  onPositionChange: (position: TextPosition) => void;
  onTextChange: (next: { text: string; html: string }) => void;
  onStyleChange: (style: { fontSize: number; color: string }) => void;
  onRemove: () => void;
  initialPosition?: TextPosition;
  readOnly?: boolean;
}

function selectionHasText() {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().length > 0);
}

const DraggableText: React.FC<DraggableTextProps> = ({
  text,
  html,
  fontSize = DEFAULT_TEXT_FONT_SIZE,
  color = DEFAULT_TEXT_COLOR,
  pageRef,
  onPositionChange,
  onTextChange,
  onStyleChange,
  onRemove,
  initialPosition,
  readOnly = false,
}) => {
  const [localSize, setLocalSize] = useState(() => clampTextFontSize(fontSize));
  const [localColor, setLocalColor] = useState(() => color || DEFAULT_TEXT_COLOR);
  const sizeRef = useRef(localSize);
  const colorRef = useRef(localColor);
  sizeRef.current = localSize;
  colorRef.current = localColor;
  const displayHtml = textItemHtml({ html, text });
  const [position, setPosition] = useState<TextPosition>(
    initialPosition || {
      x: 50,
      y: 50,
      width: 160,
      height: 48,
    }
  );

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingCommand = useRef<{ command: string; value?: string } | null>(null);
  const isRtl = /[\u0600-\u06FF]/.test(text || htmlToPlainText(displayHtml));

  const emitEditorChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const nextHtml = sanitizeRichHtml(editor.innerHTML);
    onTextChange({ text: htmlToPlainText(nextHtml), html: nextHtml });
  };

  const applyCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    if (command !== 'fontSizeDelta') editor?.focus();
    if (command === 'fontSizeDelta') {
      const next = stepTextFontSize(sizeRef.current, Number(commandValue) || 0);
      const selectionOnly = selectionHasText();
      if (selectionOnly) editor?.focus();
      sizeRef.current = next;
      setLocalSize(next);
      onStyleChange({ fontSize: next, color: colorRef.current });
      if (editor) applyFontSizeToContent(editor, next, { selectionOnly });
      emitEditorChange();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => fitOverlayBox());
      });
      return;
    }
    if (command === 'foreColor' && commandValue) {
      colorRef.current = commandValue;
      setLocalColor(commandValue);
      onStyleChange({ fontSize: sizeRef.current, color: commandValue });
      if (editor && selectionHasText()) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, commandValue);
      } else if (editor) {
        editor.style.color = commandValue;
      }
      emitEditorChange();
      return;
    }
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, commandValue);
    emitEditorChange();
  };

  const fitOverlayBox = () => {
    const editor = editorRef.current;
    const page = pageRef.current;
    if (!editor || !page) return;
    const pageRect = page.getBoundingClientRect();
    const minHeight = Math.max(
      48,
      Math.round(sizeRef.current * TEXT_LINE_HEIGHT + TEXT_BOX_PADDING * 2)
    );
    const contentWidth = Math.ceil(editor.scrollWidth + TEXT_BOX_PADDING * 2);
    const neededHeight = Math.max(minHeight, editor.scrollHeight + 4);
    setPosition((prev) => {
      const neededWidth = Math.max(48, Math.min(contentWidth, pageRect.width - prev.x));
      const width = Math.min(neededWidth, Math.max(48, pageRect.width - prev.x));
      const height = Math.min(
        Math.max(prev.height, neededHeight),
        Math.max(32, pageRect.height - prev.y)
      );
      if (width === prev.width && height === prev.height) return prev;
      const next = { ...prev, width, height };
      onPositionChange(next);
      return next;
    });
  };

  useEffect(() => {
    if (isEditing) return;
    if (editorRef.current) editorRef.current.innerHTML = displayHtml;
  }, [displayHtml, isEditing]);

  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    editorRef.current.focus();
    if (pendingCommand.current) {
      const next = pendingCommand.current;
      pendingCommand.current = null;
      applyCommand(next.command, next.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    if (readOnly) {
      return () => {};
    }
    const handlePointerDown = (e: MouseEvent) => {
      if (textRef.current && !textRef.current.contains(e.target as Node)) {
        setIsActive(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [readOnly]);

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
        const minHeight = Math.max(32, sizeRef.current * TEXT_LINE_HEIGHT + TEXT_BOX_PADDING * 2);

        setPosition((prev) => {
          const newWidth = Math.max(80, relativeX - prev.x);
          const newHeight = Math.max(minHeight, relativeY - prev.y);
          return {
            ...prev,
            width: Math.min(newWidth, pageRect.width - prev.x),
            height: Math.min(newHeight, pageRect.height - prev.y),
          };
        });
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
  }, [isDragging, isResizing, dragStart, pageRef, onPositionChange]);

  const runCommand = (command: string, commandValue?: string) => {
    setIsActive(true);
    if (command === 'fontSizeDelta' || command === 'foreColor') {
      applyCommand(command, commandValue);
      return;
    }
    if (!isEditing) {
      pendingCommand.current = { command, value: commandValue };
      setIsEditing(true);
      return;
    }
    applyCommand(command, commandValue);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly || isEditing) return;
    const target = e.target as HTMLElement;
    if (
      target.classList.contains('resize-handle') ||
      target.classList.contains('remove-signature') ||
      target.closest('.draggable-text-toolbar') ||
      target.closest('.draggable-text-input')
    ) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    setIsActive(true);
    setIsDragging(true);

    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      textRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsActive(true);
    setIsResizing(true);
    if (textRef.current) {
      textRef.current.setPointerCapture(e.pointerId);
    }
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${localSize}px`,
    color: localColor,
    fontFamily: TEXT_FONT_FAMILY,
    pointerEvents: isEditing ? 'auto' : 'none',
    userSelect: isEditing ? 'text' : 'none',
  };

  return (
    <div
      ref={textRef}
      className={`draggable-signature draggable-text${isActive || isEditing ? ' is-active' : ''}${readOnly ? ' is-readonly' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={(e) => {
        if (readOnly) return;
        e.stopPropagation();
        setIsActive(true);
        setIsEditing(true);
      }}
    >
      {!readOnly && (
        <div className={`draggable-text-toolbar${position.y < 48 ? ' is-below' : ''}`}>
          <RichTextToolbar
            compact
            fontSize={localSize}
            color={localColor}
            onCommand={runCommand}
          />
        </div>
      )}
      <div className="signature-content text-content">
        <div
          ref={editorRef}
          className={`draggable-text-html ${isEditing ? 'draggable-text-input' : 'draggable-text-label'}`}
          contentEditable={isEditing}
          suppressContentEditableWarning
          dir={isRtl ? 'rtl' : 'ltr'}
          style={textStyle}
          onMouseDown={(e) => {
            if (isEditing) e.stopPropagation();
          }}
          onInput={emitEditorChange}
          onPaste={(e) => {
            e.preventDefault();
            const pastedHtml = e.clipboardData.getData('text/html');
            const pastedText = e.clipboardData.getData('text/plain');
            document.execCommand(
              'insertHTML',
              false,
              sanitizeRichHtml(pastedHtml || escapeHtml(pastedText))
            );
            emitEditorChange();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
        />
      </div>
      {!readOnly && (
        <>
          <button type="button" className="remove-signature" onClick={onRemove} title="Remove text">
            ×
          </button>
          <div className="resize-handle" onPointerDown={handleResizePointerDown} title="Resize text box" />
        </>
      )}
    </div>
  );
};

export default DraggableText;
