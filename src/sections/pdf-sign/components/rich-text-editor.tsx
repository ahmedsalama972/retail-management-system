import './rich-text-editor.css';

import { useRef, useState, useEffect } from 'react';

import { useLanguage } from 'src/contexts/language-context';

import { PresetColorPicker } from './preset-color-picker';
import {
  escapeHtml,
  htmlToPlainText,
  sanitizeRichHtml,
  stepTextFontSize,
  clampTextFontSize,
  applyFontSizeToContent,
} from '../utils/text-overlay';

type RichTextToolbarProps = {
  fontSize: number;
  color: string;
  compact?: boolean;
  onCommand: (command: string, value?: string) => void;
};

type RichTextEditorProps = {
  label?: string;
  value: string;
  fontSize: number;
  color: string;
  placeholder?: string;
  onChange: (html: string) => void;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
};

function selectionHasText() {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().length > 0);
}

export function RichTextToolbar({
  fontSize,
  color,
  compact,
  onCommand,
}: RichTextToolbarProps) {
  const { t } = useLanguage();
  const size = clampTextFontSize(fontSize);

  return (
    <div
      className={`rich-text-toolbar${compact ? ' compact' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" className="rich-text-btn" title={t('signContract.bold', 'Bold')} onClick={() => onCommand('bold')}>
        B
      </button>
      <button
        type="button"
        className="rich-text-btn"
        title={t('signContract.italic', 'Italic')}
        style={{ fontStyle: 'italic' }}
        onClick={() => onCommand('italic')}
      >
        I
      </button>
      <button
        type="button"
        className="rich-text-btn"
        title={t('signContract.underline', 'Underline')}
        style={{ textDecoration: 'underline' }}
        onClick={() => onCommand('underline')}
      >
        U
      </button>
      <button type="button" className="rich-text-btn" title={t('signContract.alignLeft', 'Align left')} onClick={() => onCommand('justifyLeft')}>
        ⇤
      </button>
      <button type="button" className="rich-text-btn" title={t('signContract.alignCenter', 'Align center')} onClick={() => onCommand('justifyCenter')}>
        ≡
      </button>
      <button type="button" className="rich-text-btn" title={t('signContract.alignRight', 'Align right')} onClick={() => onCommand('justifyRight')}>
        ⇥
      </button>
      <button
        type="button"
        className="rich-text-btn"
        title={t('signContract.decreaseFont', 'Smaller text')}
        onClick={() => onCommand('fontSizeDelta', '-1')}
      >
        A−
      </button>
      <span className="rich-text-size">{size}</span>
      <button
        type="button"
        className="rich-text-btn"
        title={t('signContract.increaseFont', 'Larger text')}
        onClick={() => onCommand('fontSizeDelta', '1')}
      >
        A+
      </button>
      <PresetColorPicker
        compact
        value={color}
        onChange={(next) => onCommand('foreColor', next)}
        label={t('signContract.textColor', 'Text color')}
      />
    </div>
  );
}

export function RichTextEditor({
  label,
  value,
  fontSize,
  color,
  placeholder,
  onChange,
  onFontSizeChange,
  onColorChange,
}: RichTextEditorProps) {
  const { t } = useLanguage();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(value);
  const [localSize, setLocalSize] = useState(() => clampTextFontSize(fontSize));
  const [localColor, setLocalColor] = useState(color);
  const sizeRef = useRef(localSize);
  sizeRef.current = localSize;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value !== lastHtml.current && value !== editor.innerHTML) {
      editor.innerHTML = value || '';
      lastHtml.current = value;
    }
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeRichHtml(editor.innerHTML);
    lastHtml.current = html;
    onChange(html);
  };

  const runCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    editor?.focus();
    if (command === 'fontSizeDelta') {
      const next = stepTextFontSize(sizeRef.current, Number(commandValue) || 0);
      sizeRef.current = next;
      setLocalSize(next);
      onFontSizeChange(next);
      if (editor) applyFontSizeToContent(editor, next, { selectionOnly: selectionHasText() });
      emitChange();
      return;
    }
    if (command === 'foreColor' && commandValue) {
      setLocalColor(commandValue);
      onColorChange(commandValue);
      if (selectionHasText()) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, commandValue);
      }
      emitChange();
      return;
    }
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  return (
    <div className="rich-text-editor">
      {label ? <span className="rich-text-label">{label}</span> : null}
      <div className="rich-text-shell">
        <RichTextToolbar
          fontSize={localSize}
          color={localColor}
          onCommand={runCommand}
        />
        <div
          ref={editorRef}
          className="rich-text-surface"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder || t('signContract.richTextPlaceholder', 'Type or paste formatted text')}
          style={{ fontSize: `${clampTextFontSize(localSize)}px`, color: localColor }}
          dir="auto"
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={(e) => {
            e.preventDefault();
            const html = e.clipboardData.getData('text/html');
            const text = e.clipboardData.getData('text/plain');
            document.execCommand(
              'insertHTML',
              false,
              sanitizeRichHtml(html || escapeHtml(text))
            );
            emitChange();
          }}
        />
      </div>
    </div>
  );
}

export function richTextPlain(html: string) {
  return htmlToPlainText(html);
}
