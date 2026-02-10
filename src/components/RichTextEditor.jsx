import React, { useRef, useState } from 'react';

// ============================================
// RICH TEXT EDITOR - Word-like editing experience
// Simple formatting toolbar for non-technical users
// ============================================

const RichTextEditor = ({ value, onChange, placeholder = '', rows = 5 }) => {
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateActiveFormats();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
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
      onChange(editorRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ command, icon, label, active, value }) => (
    <button
      type="button"
      onClick={() => execCommand(command, value)}
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
          <ToolbarButton 
            command="bold" 
            icon="format_bold" 
            label="Bold"
            active={activeFormats.bold}
          />
          <ToolbarButton 
            command="italic" 
            icon="format_italic" 
            label="Italic"
            active={activeFormats.italic}
          />
          <ToolbarButton 
            command="underline" 
            icon="format_underlined" 
            label="Underline"
            active={activeFormats.underline}
          />
        </div>
        
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton 
            command="justifyLeft" 
            icon="format_align_left" 
            label="Align Left"
          />
          <ToolbarButton 
            command="justifyCenter" 
            icon="format_align_center" 
            label="Align Center"
          />
          <ToolbarButton 
            command="justifyRight" 
            icon="format_align_right" 
            label="Align Right"
          />
        </div>
        
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton 
            command="insertUnorderedList" 
            icon="format_list_bulleted" 
            label="Bullet List"
            active={activeFormats.insertUnorderedList}
          />
          <ToolbarButton 
            command="insertOrderedList" 
            icon="format_list_numbered" 
            label="Numbered List"
            active={activeFormats.insertOrderedList}
          />
        </div>
        
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton 
            command="formatBlock" 
            icon="title" 
            label="Heading"
            value="H2"
          />
          <ToolbarButton 
            command="removeFormat" 
            icon="format_clear" 
            label="Clear Formatting"
          />
        </div>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        className="w-full min-h-[120px] max-h-[300px] overflow-y-auto p-4 text-sm text-text-primary dark:text-white focus:outline-none prose dark:prose-invert max-w-none"
        style={{ minHeight: `${rows * 24}px` }}
        dangerouslySetInnerHTML={{ __html: value || `<p>${placeholder}</p>` }}
        onBlur={() => {
          if (editorRef.current && editorRef.current.innerHTML === '<p><br></p>') {
            onChange('');
          }
        }}
      />
    </div>
  );
};

export default RichTextEditor;
