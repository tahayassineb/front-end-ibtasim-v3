import React, { useMemo, useRef, useState } from 'react';

function htmlToBlocks(html) {
  if (!html) return [{ type: 'text', content: '' }];
  const div = document.createElement('div');
  div.innerHTML = html;
  const blocks = [];

  Array.from(div.childNodes).forEach((node) => {
    if (node.nodeName === 'IMG') {
      blocks.push({
        type: 'image',
        url: node.getAttribute('src') || '',
        storageId: node.getAttribute('data-storage-id') || '',
      });
      return;
    }

    const text = (node.textContent || '').trim();
    if (text) blocks.push({ type: 'text', content: node.textContent || '' });
  });

  return blocks.length > 0 ? blocks : [{ type: 'text', content: div.textContent || '' }];
}

function blocksToHtml(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'image') {
        return `<img src="${block.url || ''}" data-storage-id="${block.storageId || ''}" style="max-width:100%;border-radius:8px;margin:12px 0;display:block;" />`;
      }
      const escaped = (block.content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p style="margin:0 0 12px 0;">${escaped.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

export default function RichTextEditor({ value, onChange, placeholder = 'اكتب هنا...', onInsertImage }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const blocks = useMemo(() => htmlToBlocks(value), [value]);

  const commit = (nextBlocks) => onChange(blocksToHtml(nextBlocks));

  const updateBlock = (index, nextBlock) => {
    commit(blocks.map((block, i) => (i === index ? nextBlock : block)));
  };

  const addTextBlock = () => commit([...blocks, { type: 'text', content: '' }]);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onInsertImage) return;

    setIsUploading(true);
    try {
      const url = await onInsertImage(file);
      if (url) commit([...blocks, { type: 'image', url, storageId: '' }]);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteBlock = (index) => {
    const next = blocks.filter((_, i) => i !== index);
    commit(next.length ? next : [{ type: 'text', content: '' }]);
  };

  const moveBlock = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const styles = {
    container: { border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' },
    toolbar: { display: 'flex', gap: 8, padding: '10px 14px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap' },
    addBtn: { height: 34, padding: '0 14px', borderRadius: 8, border: '1.5px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'inherit', fontWeight: 700 },
    block: { position: 'relative', borderBottom: '1px solid #f3f4f6' },
    controls: { position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, zIndex: 2 },
    controlBtn: { width: 26, height: 26, borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
    textarea: { width: '100%', minHeight: 96, padding: '14px 52px 14px 14px', border: 'none', outline: 'none', resize: 'vertical', fontSize: 14, lineHeight: 1.8, fontFamily: 'inherit', background: 'transparent', direction: 'inherit' },
    imageBlock: { padding: '14px 52px 14px 14px', display: 'flex', alignItems: 'center', gap: 12, background: '#fafafa' },
    image: { width: 112, height: 76, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button type="button" style={styles.addBtn} onClick={addTextBlock}>+ نص</button>
        <button type="button" style={styles.addBtn} onClick={handleImageClick} disabled={isUploading || !onInsertImage}>
          {isUploading ? 'جاري الرفع...' : '+ صورة'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
      </div>

      {blocks.map((block, index) => (
        <div key={`${block.type}-${index}`} style={styles.block}>
          <div style={styles.controls}>
            <button type="button" style={styles.controlBtn} onClick={() => moveBlock(index, -1)} title="لأعلى">↑</button>
            <button type="button" style={styles.controlBtn} onClick={() => moveBlock(index, 1)} title="لأسفل">↓</button>
            <button type="button" style={{ ...styles.controlBtn, color: '#dc2626' }} onClick={() => deleteBlock(index)} title="حذف">×</button>
          </div>

          {block.type === 'image' ? (
            <div style={styles.imageBlock}>
              {block.url && <img src={block.url} style={styles.image} alt="" />}
              <div style={{ fontSize: 13, color: '#64748b' }}>صورة داخل المقال</div>
            </div>
          ) : (
            <textarea
              style={styles.textarea}
              value={block.content}
              placeholder={placeholder}
              onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
            />
          )}
        </div>
      ))}
    </div>
  );
}
