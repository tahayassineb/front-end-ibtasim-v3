import React, { useRef, useState, useEffect } from 'react';

// ============================================
// RICH TEXT EDITOR
// ============================================

const RichTextEditor = ({ value, onChange, placeholder = '', rows = 5, onInsertImage }) => {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});
  const [showPlaceholder, setShowPlaceholder] = useState(!value || value === '<p><br></p>' || value === '');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const isEmpty = !value || value === '<p><br></p>' || value === '';
    setShowPlaceholder(isEmpty);
  }, [value]);

  const execCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    updateActiveFormats();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      setShowPlaceholder(content === '<p><br></p>' || content === '');
    }
  };

  const handleInsertImageClick = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onInsertImage) return;
    setUploadingImage(true);
    try {
      const url = await onInsertImage(file);
      if (!url) return;
      editorRef.current?.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
      document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%;margin:8px 0;border-radius:8px;" />`);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    } catch { /* silent */ }
    finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const ToolbarButton = ({ command, icon, label, active, value: val }) => (
    <button
      type="button"
      onClick={() => execCommand(command, val)}
      className={`p-2 rounded-lg transition-all ${
        active
          ? 'bg-primary text-white'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
      title={label}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-1">
          <ToolbarButton command="bold" icon="format_bold" label="Bold" active={activeFormats.bold} />
          <ToolbarButton command="italic" icon="format_italic" label="Italic" active={activeFormats.italic} />
          <ToolbarButton command="underline" icon="format_underlined" label="Underline" active={activeFormats.underline} />
        </div>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        <div className="flex items-center gap-1">
          <ToolbarButton command="justifyLeft" icon="format_align_left" label="Align Left" />
          <ToolbarButton command="justifyCenter" icon="format_align_center" label="Align Center" />
          <ToolbarButton command="justifyRight" icon="format_align_right" label="Align Right" />
        </div>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        <div className="flex items-center gap-1">
          <ToolbarButton command="insertUnorderedList" icon="format_list_bulleted" label="Bullet List" active={activeFormats.insertUnorderedList} />
          <ToolbarButton command="insertOrderedList" icon="format_list_numbered" label="Numbered List" active={activeFormats.insertOrderedList} />
        </div>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        <div className="flex items-center gap-1">
          <ToolbarButton command="formatBlock" icon="title" label="Heading" value="H2" />
          <ToolbarButton command="removeFormat" icon="format_clear" label="Clear Formatting" />
        </div>

        {onInsertImage && (
          <>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
            <button
              type="button"
              onClick={handleInsertImageClick}
              disabled={uploadingImage}
              className="p-2 rounded-lg transition-all text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              title="إدراج صورة"
            >
              <span className="material-symbols-outlined text-lg">image</span>
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />
          </>
        )}
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          className="w-full min-h-[120px] max-h-[300px] overflow-y-auto p-4 text-sm text-text-primary dark:text-white focus:outline-none prose dark:prose-invert max-w-none"
          style={{ minHeight: `${rows * 24}px` }}
          dangerouslySetInnerHTML={{ __html: value || '' }}
          onFocus={() => setShowPlaceholder(false)}
          onBlur={() => {
            if (editorRef.current) {
              const content = editorRef.current.innerHTML;
              if (content === '<p><br></p>' || content === '') {
                onChange('');
                setShowPlaceholder(true);
              }
            }
          }}
        />
        {showPlaceholder && (
          <div className="absolute top-0 left-0 p-4 text-sm text-slate-400 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
