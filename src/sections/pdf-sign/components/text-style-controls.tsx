import './text-style-controls.css';

import { useLanguage } from 'src/contexts/language-context';

import { clampTextFontSize } from '../utils/text-overlay';
import { PresetColorPicker } from './preset-color-picker';

export {
  TEXT_FONT_FAMILY,
  clampTextFontSize,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_SIZE,
} from '../utils/text-overlay';

type TextStyleControlsProps = {
  fontSize: number;
  color: string;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
};

export function TextStyleControls({
  fontSize,
  color,
  onFontSizeChange,
  onColorChange,
}: TextStyleControlsProps) {
  const { t } = useLanguage();
  const size = clampTextFontSize(fontSize);

  return (
    <div className="text-style-controls" onMouseDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="text-style-btn"
        onClick={() => onFontSizeChange(clampTextFontSize(size - 1))}
        title={t('signContract.decreaseFont', 'Smaller text')}
        aria-label={t('signContract.decreaseFont', 'Smaller text')}
      >
        A−
      </button>
      <span className="text-style-size" title={t('signContract.textFontSize', 'Font size')}>
        {size}
      </span>
      <button
        type="button"
        className="text-style-btn"
        onClick={() => onFontSizeChange(clampTextFontSize(size + 1))}
        title={t('signContract.increaseFont', 'Larger text')}
        aria-label={t('signContract.increaseFont', 'Larger text')}
      >
        A+
      </button>
      <PresetColorPicker
        compact
        value={color}
        onChange={onColorChange}
        label={t('signContract.textColor', 'Text color')}
      />
    </div>
  );
}
