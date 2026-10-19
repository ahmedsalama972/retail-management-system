import './preset-color-picker.css';

import { INK_COLORS, normalizeInkColor } from '../utils/ink-colors';

type PresetColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  compact?: boolean;
  panel?: boolean;
};

function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5c0-.39-.15-.74-.39-1.01c-.23-.26-.36-.61-.36-.99A1.5 1.5 0 0 1 14.25 16H16a5 5 0 0 0 0-10h-4zm-5.5 7.5a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m3-4a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m3 4a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M9.86 18a1 1 0 0 1-.73-.32l-4.86-5.17a1 1 0 1 1 1.46-1.37l4.12 4.39l8.41-9.2a1 1 0 1 1 1.48 1.34l-9.14 10a1 1 0 0 1-.73.33Z"
      />
    </svg>
  );
}

export function PresetColorPicker({
  value,
  onChange,
  label,
  compact,
  panel,
}: PresetColorPickerProps) {
  const selected = normalizeInkColor(value);
  const className = [
    'preset-color-picker',
    compact ? 'compact' : '',
    panel ? 'panel' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} onMouseDown={(e) => e.stopPropagation()}>
      {label && !compact ? (
        <div className="preset-color-picker-header">
          <PaletteIcon />
          <span>{label}</span>
        </div>
      ) : null}
      <div className="preset-color-picker-row" role="listbox" aria-label={label}>
        {INK_COLORS.map((color) => {
          const isSelected = selected === color;
          return (
            <button
              key={color}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={`preset-color-swatch${isSelected ? ' is-selected' : ''}`}
              style={{ backgroundColor: color }}
              title={color}
              onClick={() => onChange(color)}
            >
              {isSelected ? <CheckIcon /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
