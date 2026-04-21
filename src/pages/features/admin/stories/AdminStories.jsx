import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';
import RichTextEditor from '../../../../components/RichTextEditor';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BORDER  = '#E5E9EB';
const PRIMARY = '#0d7477';
const P600    = '#0A5F62';
const P50     = '#E6F4F4';
const TEXT2   = '#64748b';
const TEXTM   = '#94a3b8';
const SHADOW  = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_P = '0 4px 14px rgba(13,116,119,.25)';

const POST_TYPES = [
  { id: 'story',    label: '🌟 قصة نجاح' },
  { id: 'activity', label: '🎉 نشاط وفعالية' },
  { id: 'update',   label: '📢 خبر وتحديث' },
];

const POST_TYPE_DEFAULTS = {
  story:    { gradient: 'linear-gradient(160deg,#063a3b,#0d7477)', badgeIcon: '🌟', badgeText: 'قصة نجاح', catLabel: 'SUCCESS STORY · قصة نجاح', catColor: '#0A5F62', category: 'education' },
  activity: { gradient: 'linear-gradient(160deg,#1a4520,#27ae60)', badgeIcon: '🎉', badgeText: 'نشاط وفعالية', catLabel: 'ACTIVITY · نشاط', catColor: '#16a34a', category: 'education' },
  update:   { gradient: 'linear-gradient(160deg,#1a4a6b,#48aadf)', badgeIcon: '📢', badgeText: 'خبر وتحديث', catLabel: 'NEWS · أخبار', catColor: '#0d7477', category: 'education' },
};

const slugify = (text) => text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '').slice(0, 80);

const EMPTY_FORM = {
  title: '', excerpt: '',
  ...POST_TYPE_DEFAULTS.story,
  isPublished: false, isFeatured: false,
  coverImage: '', body: '',
  postType: 'story', slug: '', metaDescription: '',
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
  const stories                  = useQuery(api.stories.getAllStories);
  const createStory              = useMutation(api.stories.createStory);
  const updateStory              = useMutation(api.stories.updateStory);
  const deleteStory              = useMutation(api.stories.deleteStory);
  const publishStory             = useMutation(api.stories.publishStory);
  const unpublishStory           = useMutation(api.stories.unpublishStory);
  const generateUploadUrl        = useMutation(api.stories.generateStoryImageUploadUrl);

  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [seoOpen, setSeoOpen]           = useState(false);
  const coverInputRef = useRef();

  const handleField = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleOpenNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setCoverPreview(null);
    setShowForm(true);
  };

  const handleOpenEdit = (story) => {
    const pt = story.postType || 'story';
    setForm({
      title: story.title, excerpt: story.excerpt,
      ...POST_TYPE_DEFAULTS[pt],
      isPublished: story.isPublished, isFeatured: story.isFeatured ?? false,
      coverImage: story.coverImage || '',
      body: story.body || '',
      postType: pt,
      slug: story.slug || '',
      metaDescription: story.metaDescription || '',
    });
    setCoverPreview(story.coverImage ? convexFileUrl(story.coverImage) : null);
    setEditingId(story._id);
    setShowForm(true);
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const { storageId } = await res.json();
      handleField('coverImage', storageId);
      setCoverPreview(URL.createObjectURL(file));
    } catch (e) {
      showToast?.('فشل رفع الصورة', 'error');
    } finally { setUploadingCover(false); }
  };

  const handleInlineImageUpload = async (file) => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const { storageId } = await res.json();
    return convexFileUrl(storageId);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) {
      showToast?.('العنوان والمختصر مطلوبان', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title, excerpt: form.excerpt, category: form.category,
        gradient: form.gradient, badgeIcon: form.badgeIcon, badgeText: form.badgeText,
        catLabel: form.catLabel, catColor: form.catColor,
        isPublished: form.isPublished, isFeatured: form.isFeatured,
        coverImage: form.coverImage || undefined,
        body: form.body || undefined,
        postType: form.postType || 'story',
        slug: form.slug || undefined,
        metaDescription: form.metaDescription || undefined,
      };
      if (editingId) {
        await updateStory({ id: editingId, ...payload });
        showToast?.('تم تحديث المنشور', 'success');
      } else {
        await createStory({ ...payload, adminId: adminUser?.id || 'admin' });
        showToast?.('تم إنشاء المنشور', 'success');
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
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📖 المدونة</h1>
          <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>{stories?.length ?? 0} منشور في قاعدة البيانات</div>
        </div>
        <button onClick={handleOpenNew}
          style={{ height: 40, padding: '0 18px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_P }}>
          ➕ منشور جديد
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{editingId ? 'تعديل المنشور' : 'منشور جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: TEXT2 }}>×</button>
            </div>

            {/* Cover image upload */}
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>صورة الغلاف</FieldLabel>
              <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleCoverUpload(e.target.files?.[0])} />
              {coverPreview ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 140 }}>
                  <img src={coverPreview} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => { handleField('coverImage', ''); setCoverPreview(null); }}
                    style={{ position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ) : (
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                  style={{ width: '100%', height: 100, border: `2px dashed ${BORDER}`, borderRadius: 12, background: '#F8FAFC', cursor: 'pointer', fontSize: 13, color: TEXT2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 24 }}>🖼️</span>
                  <span>{uploadingCover ? 'جاري الرفع...' : 'اضغط لرفع صورة الغلاف'}</span>
                </button>
              )}
            </div>

            {/* Post type */}
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>نوع المنشور</FieldLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {POST_TYPES.map(pt => (
                  <button key={pt.id} type="button"
                    onClick={() => setForm(p => ({ ...p, postType: pt.id, ...POST_TYPE_DEFAULTS[pt.id] }))}
                    style={{ flex: 1, height: 38, borderRadius: 10, border: `1.5px solid ${form.postType === pt.id ? PRIMARY : BORDER}`, background: form.postType === pt.id ? P50 : 'white', color: form.postType === pt.id ? P600 : TEXT2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>العنوان *</FieldLabel>
              <input style={fieldInput} value={form.title}
                onChange={e => { handleField('title', e.target.value); if (!form.slug) handleField('slug', slugify(e.target.value)); }}
                placeholder="عنوان المنشور" />
            </div>

            {/* Excerpt */}
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>المختصر * (جملة أو جملتان)</FieldLabel>
              <textarea value={form.excerpt} onChange={e => handleField('excerpt', e.target.value)}
                placeholder="وصف مختصر يظهر في بطاقة المنشور..."
                style={{ ...fieldInput, height: 64, paddingTop: 10, resize: 'vertical' }} />
            </div>

            {/* Body */}
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>المحتوى (يدعم النص المنسق وإدراج الصور)</FieldLabel>
              <RichTextEditor
                value={form.body}
                onChange={val => handleField('body', val)}
                placeholder="اكتب محتوى المنشور هنا..."
                rows={10}
                onInsertImage={handleInlineImageUpload}
              />
            </div>

            {/* Publish options */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <input type="checkbox" checked={form.isPublished} onChange={e => handleField('isPublished', e.target.checked)} style={{ accentColor: PRIMARY }} />
                نشر فوراً
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <input type="checkbox" checked={form.isFeatured} onChange={e => handleField('isFeatured', e.target.checked)} style={{ accentColor: PRIMARY }} />
                منشور مميز
              </label>
            </div>

            {/* SEO collapsible */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <button type="button" onClick={() => setSeoOpen(o => !o)}
                style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: TEXT2, fontFamily: 'Tajawal, sans-serif' }}>
                <span>🔍 إعدادات SEO</span>
                <span>{seoOpen ? '▲' : '▼'}</span>
              </button>
              {seoOpen && (
                <div style={{ padding: '14px' }}>
                  <div style={{ marginBottom: 12 }}>
                    <FieldLabel>الرابط (Slug) — يُملأ تلقائياً</FieldLabel>
                    <input style={{ ...fieldInput, fontFamily: 'Inter, monospace', fontSize: 12 }} value={form.slug}
                      onChange={e => handleField('slug', e.target.value)} placeholder="my-post-slug" dir="ltr" />
                  </div>
                  <div>
                    <FieldLabel>وصف الصفحة (Meta Description) — حتى 160 حرفاً</FieldLabel>
                    <textarea value={form.metaDescription} onChange={e => handleField('metaDescription', e.target.value.slice(0, 160))}
                      placeholder="وصف مختصر يظهر في نتائج محركات البحث..."
                      style={{ ...fieldInput, height: 56, paddingTop: 10, resize: 'none' }} />
                    <div style={{ fontSize: 11, color: TEXTM, textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>{(form.metaDescription || '').length} / 160</div>
                  </div>
                </div>
              )}
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
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>لا توجد منشورات بعد</div>
          <div style={{ fontSize: 13, color: TEXT2 }}>أضف أول منشور في المدونة</div>
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
                  {story.postType && story.postType !== 'story' && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#F1F5F9', color: TEXT2 }}>{POST_TYPES.find(p => p.id === story.postType)?.label}</span>}
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
