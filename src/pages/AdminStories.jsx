import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BORDER  = '#E5E9EB';
const PRIMARY = '#0d7477';
const P600    = '#0A5F62';
const P50     = '#E6F4F4';
const TEXT2   = '#64748b';
const TEXTM   = '#94a3b8';
const SHADOW  = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_P = '0 4px 14px rgba(13,116,119,.25)';

const GRADIENT_PRESETS = [
  { label: 'تعليم', value: 'linear-gradient(160deg,#063a3b,#0d7477)' },
  { label: 'مياه',  value: 'linear-gradient(160deg,#1a4a6b,#48aadf)' },
  { label: 'صحة',   value: 'linear-gradient(160deg,#7c1e0e,#e74c3c)' },
  { label: 'غذاء',  value: 'linear-gradient(160deg,#1a4520,#27ae60)' },
  { label: 'سكن',   value: 'linear-gradient(160deg,#4a1a6b,#9b59b6)' },
  { label: 'كفالة', value: 'linear-gradient(160deg,#8B6914,#C4A882)' },
];

const EMPTY_FORM = {
  title: '', excerpt: '', category: 'education',
  gradient: GRADIENT_PRESETS[0].value,
  badgeIcon: '🎓', badgeText: 'التعليم',
  catLabel: 'EDUCATION · تعليم', catColor: '#0A5F62',
  isPublished: false, isFeatured: false,
};

const FieldLabel = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 6 }}>{children}</div>
);

const fieldInput = {
  width: '100%', height: 44, border: `1.5px solid ${BORDER}`, borderRadius: 10,
  padding: '0 12px', fontSize: 13, fontFamily: 'Tajawal, sans-serif',
  color: '#0e1a1b', outline: 'none', background: 'white', boxSizing: 'border-box',
};

export default function AdminStories() {
  const { showToast, user: adminUser } = useApp();
  const stories      = useQuery(api.stories.getAllStories);
  const createStory  = useMutation(api.stories.createStory);
  const updateStory  = useMutation(api.stories.updateStory);
  const deleteStory  = useMutation(api.stories.deleteStory);
  const publishStory   = useMutation(api.stories.publishStory);
  const unpublishStory = useMutation(api.stories.unpublishStory);

  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const handleField = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleOpenNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (story) => {
    setForm({
      title: story.title, excerpt: story.excerpt, category: story.category,
      gradient: story.gradient, badgeIcon: story.badgeIcon, badgeText: story.badgeText,
      catLabel: story.catLabel, catColor: story.catColor,
      isPublished: story.isPublished, isFeatured: story.isFeatured ?? false,
    });
    setEditingId(story._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) {
      showToast?.('العنوان والمختصر مطلوبان', 'error'); return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateStory({ id: editingId, ...form });
        showToast?.('تم تحديث القصة', 'success');
      } else {
        await createStory({ ...form, adminId: adminUser?.id || 'admin' });
        showToast?.('تم إنشاء القصة', 'success');
      }
      setShowForm(false);
    } catch (e) {
      showToast?.(e?.message || 'حدث خطأ', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذه القصة؟')) return;
    try {
      await deleteStory({ id });
      showToast?.('تم الحذف', 'success');
    } catch { showToast?.('فشل الحذف', 'error'); }
  };

  const handleTogglePublish = async (story) => {
    try {
      if (story.isPublished) {
        await unpublishStory({ id: story._id });
        showToast?.('تم إلغاء النشر', 'info');
      } else {
        await publishStory({ id: story._id });
        showToast?.('تم النشر', 'success');
      }
    } catch { showToast?.('فشل تغيير الحالة', 'error'); }
  };

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📖 القصص</h1>
          <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>{stories?.length ?? 0} قصة في قاعدة البيانات</div>
        </div>
        <button onClick={handleOpenNew}
          style={{ height: 40, padding: '0 18px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_P }}>
          ➕ قصة جديدة
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{editingId ? 'تعديل القصة' : 'قصة جديدة'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: TEXT2 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <FieldLabel>العنوان *</FieldLabel>
                <input style={fieldInput} value={form.title} onChange={e => handleField('title', e.target.value)} placeholder="عنوان القصة" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <FieldLabel>المختصر *</FieldLabel>
                <textarea value={form.excerpt} onChange={e => handleField('excerpt', e.target.value)}
                  placeholder="وصف مختصر للقصة..."
                  style={{ ...fieldInput, height: 80, paddingTop: 10, resize: 'vertical' }} />
              </div>
              <div>
                <FieldLabel>التصنيف</FieldLabel>
                <select value={form.category} onChange={e => handleField('category', e.target.value)} style={{ ...fieldInput, cursor: 'pointer' }}>
                  {['education','water','health','kafala','food','housing'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>تدرج اللون</FieldLabel>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {GRADIENT_PRESETS.map(g => (
                    <button key={g.value} type="button" onClick={() => handleField('gradient', g.value)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: g.value, border: `2px solid ${form.gradient === g.value ? PRIMARY : 'transparent'}`, cursor: 'pointer', title: g.label }} />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>أيقونة الشارة</FieldLabel>
                <input style={fieldInput} value={form.badgeIcon} onChange={e => handleField('badgeIcon', e.target.value)} placeholder="🎓" />
              </div>
              <div>
                <FieldLabel>نص الشارة</FieldLabel>
                <input style={fieldInput} value={form.badgeText} onChange={e => handleField('badgeText', e.target.value)} placeholder="التعليم" />
              </div>
              <div>
                <FieldLabel>تسمية الفئة</FieldLabel>
                <input style={fieldInput} value={form.catLabel} onChange={e => handleField('catLabel', e.target.value)} placeholder="EDUCATION · تعليم" />
              </div>
              <div>
                <FieldLabel>لون الفئة (hex)</FieldLabel>
                <input style={{ ...fieldInput, fontFamily: 'Inter, monospace' }} value={form.catColor} onChange={e => handleField('catColor', e.target.value)} placeholder="#0A5F62" dir="ltr" />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={form.isPublished} onChange={e => handleField('isPublished', e.target.checked)} style={{ accentColor: PRIMARY }} />
                  نشر فوراً
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={e => handleField('isFeatured', e.target.checked)} style={{ accentColor: PRIMARY }} />
                  قصة مميزة
                </label>
              </div>
            </div>

            {/* Preview */}
            <div style={{ height: 60, borderRadius: 10, background: form.gradient, marginBottom: 16, display: 'flex', alignItems: 'center', paddingRight: 14, gap: 10 }}>
              <span style={{ fontSize: 20 }}>{form.badgeIcon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{form.title || 'معاينة العنوان'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontFamily: 'Inter, sans-serif' }}>{form.catLabel}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ height: 40, padding: '0 18px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'white', color: TEXT2 }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                style={{ height: 40, padding: '0 20px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_P, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : editingId ? '💾 حفظ' : '✅ إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stories list */}
      {stories === undefined ? (
        <div style={{ textAlign: 'center', padding: 60, color: TEXTM }}>جاري التحميل...</div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>لا توجد قصص بعد</div>
          <div style={{ fontSize: 13, color: TEXT2 }}>أضف أول قصة نجاح للتحفيز على التبرع</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stories.map(story => (
            <div key={story._id} style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: SHADOW }}>
              {/* Gradient preview */}
              <div style={{ width: 56, height: 40, borderRadius: 8, background: story.gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {story.badgeIcon}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: story.catColor }}>{story.catLabel}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: story.isPublished ? '#D1FAE5' : '#F1F5F9', color: story.isPublished ? '#16a34a' : TEXTM }}>
                    {story.isPublished ? '✓ منشورة' : 'مسودة'}
                  </span>
                  {story.isFeatured && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#FEF3C7', color: '#b45309' }}>⭐ مميزة</span>}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => handleTogglePublish(story)}
                  style={{ height: 34, padding: '0 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: story.isPublished ? '#FEE2E2' : P50, color: story.isPublished ? '#dc2626' : P600 }}>
                  {story.isPublished ? 'إلغاء النشر' : 'نشر'}
                </button>
                <button onClick={() => handleOpenEdit(story)}
                  style={{ height: 34, padding: '0 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: `1px solid ${BORDER}`, background: 'white', color: TEXT2 }}>
                  تعديل
                </button>
                <button onClick={() => handleDelete(story._id)}
                  style={{ height: 34, padding: '0 10px', borderRadius: 10, fontSize: 14, cursor: 'pointer', border: 'none', background: '#FEE2E2', color: '#dc2626' }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
