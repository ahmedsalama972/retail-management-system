import './PDFUpload.css';

import React, { useEffect, useRef, useState } from 'react';

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  selectedFileName?: string | null;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  onFileSelect,
  accept = 'application/pdf,image/*',
  selectedFileName = null,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(selectedFileName);

  useEffect(() => {
    setFileName(selectedFileName);
  }, [selectedFileName]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const validateAndSelectFile = (file: File) => {
    const allowed = accept.split(',').map((item) => item.trim());
    const isAllowed = allowed.some((item) => {
      if (item.endsWith('/*')) return file.type.startsWith(item.replace('/*', '/'));
      return file.type === item;
    });
    if (!isAllowed) {
      alert('يرجى اختيار ملف PDF أو صورة صالح');
      return;
    }

    const maxSize = 1073741824;
    if (file.size > maxSize) {
      alert('حجم الملف يتجاوز 1 جيجا. يرجى اختيار ملف أصغر.');
      return;
    }

    setFileName(file.name);
    onFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pdf-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div
        className={`pdf-upload-area ${isDragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleBrowseClick();
        }}
      >
        <div className="document-icons">
          <div className="document-icon document-icon-left" />
          <div className="document-icon document-icon-center" />
          <div className="document-icon document-icon-right" />
        </div>

        <div className="upload-text">
          {fileName ? (
            <>
              <span className="upload-instruction">تم اختيار الملف</span>
              <span className="selected-file-name" title={fileName}>
                {fileName}
              </span>
              <button
                type="button"
                className="browse-link"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
              >
                تغيير الملف
              </button>
              <button type="button" className="clear-file-link" onClick={handleClear}>
                إزالة
              </button>
            </>
          ) : (
            <>
              <span className="upload-instruction">
                اسحب الملفات وأفلتها هنا أو{' '}
                <button
                  type="button"
                  className="browse-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowseClick();
                  }}
                >
                  استعراض ملف من الجهاز
                </button>
              </span>
              <span className="file-size-limit">(الحد الأقصى 1 جيجا — صيغ: PDF أو صورة)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
