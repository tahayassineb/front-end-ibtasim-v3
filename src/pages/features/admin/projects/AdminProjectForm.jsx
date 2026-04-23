import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';
import { formatBytes, optimizeImageFile } from '../../../../lib/imageOptimization';

// ─── Convex storage helpers ───────────────────────────────────────────────────
const uploadFileToConvex = async (file, getUploadUrlMutation) => {
  const optimized = await optimizeImageFile(file, { maxWidth: 1800, maxHeight: 1800, quality: 0.82 });
  const uploadFile = optimized.file;
  const uploadUrl = await getUploadUrlMutation();
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': uploadFile.type },
    body: uploadFile,
  });
  if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
  const result = await response.json();
  return { storageId: result.storageId, optimization: optimized };
};

// ─── Reusable field components ────────────────────────────────────────────────
const BORDER = '#E5E9EB';
const PRIMARY = '#0d7477';
const TEXT2 = '#64748b';
const TEXTM = '#94a3b8';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_PRIMARY = '0 4px 14px rgba(13,116,119,.25)';

const fieldInput = {
  width: '100%', height: 48, border: `1.5px solid ${BORDER}`, borderRadius: 12,
  padding: '0 14px', fontSize: 14, fontFamily: 'var(--font-arabic)',
  color: '#0e1a1b', outline: 'none', background: 'white', boxSizing: 'border-box',
};
const fieldTextarea = {
  width: '100%', minHeight: 100, border: `1.5px solid ${BORDER}`, borderRadius: 12,
  padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-arabic)',
  color: '#0e1a1b', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
};
const fieldLabel = { fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 };
const fieldHint = { fontSize: 11, color: TEXTM, marginTop: 5 };

const Section = ({ icon, title, children }) => (
  <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, marginBottom: 20, overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const ToggleRow = ({ title, desc, checked, onChange, last }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${BORDER}` }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{desc}</div>
    </div>
    <div
      onClick={onChange}
      style={{ width: 44, height: 24, background: checked ? PRIMARY : BORDER, borderRadius: 100, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}
    >
      <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: checked ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
    </div>
  </div>
);


// ─── Main component ────────────────────────────────────────────────────────────
export default function AdminProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, user } = useApp();
  const isEditMode = Boolean(id);

  const [activeTab, setActiveTab] = useState('ar');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // ── Convex ────────────────────────────────────────────────────────────────
  const existingProject = useQuery(api.projects.getProjectById, isEditMode ? { projectId: id } : 'skip');
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const getUploadUrlMutation = useMutation(api.storage.generateProjectImageUploadUrl);
  const deleteImageMutation = useMutation(api.storage.deleteProjectImage);

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: { ar: '', fr: '', en: '' },
    shortDescription: { ar: '', fr: '', en: '' },
    description: { ar: '', fr: '', en: '' },
    impact: { ar: '', fr: '', en: '' },
    goal: '',
    category: 'education',
    location: '',
    beneficiaries: '',
    currency: 'MAD',
    status: 'draft',
    featured: false,
    showDonors: true,
    allowAnonymous: true,
    mainImage: '',
    mainImageStorageId: null,
    gallery: [],
    galleryStorageIds: [],
    impactMetrics: [],
    updates: [],
    transformationStage: '',
    benefitCards: [],
    slug: '',
    metaTitle: '',
    metaDescription: '',
    imageAlt: '',
  });

  // Load existing project in edit mode
  useEffect(() => {
    if (isEditMode && existingProject) {
      setFormData(prev => ({
        ...prev,
        title: existingProject.title || prev.title,
        description: existingProject.description || prev.description,
        shortDescription: existingProject.shortDescription || prev.shortDescription,
        category: existingProject.category || prev.category,
        goal: existingProject.goalAmount ? Math.round(existingProject.goalAmount / 100) : prev.goal,
        featured: existingProject.isFeatured ?? prev.featured,
        mainImage: existingProject.mainImage || prev.mainImage,
        mainImageStorageId: existingProject.mainImage || null,
        location: existingProject.location || '',
        beneficiaries: existingProject.beneficiaries?.toString() || '',
        status: existingProject.status || 'draft',
        transformationStage: existingProject.transformationStage || '',
        benefitCards: existingProject.benefitCards || [],
        slug: existingProject.slug || '',
        metaTitle: existingProject.metaTitle || '',
        metaDescription: existingProject.metaDescription || '',
        imageAlt: existingProject.imageAlt || '',
      }));
    }
  }, [isEditMode, existingProject]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const set = (field, value, lang = null) => {
    if (lang) {
      setFormData(prev => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, mainImage: previewUrl }));
      const { storageId, optimization } = await uploadFileToConvex(file, getUploadUrlMutation);
      setFormData(prev => ({ ...prev, mainImage: previewUrl, mainImageStorageId: storageId }));
      showToast(optimization.optimized ? `Image optimized ${formatBytes(optimization.originalSize)} -> ${formatBytes(optimization.finalSize)}` : 'Image uploaded', 'success');
    } catch {
      showToast('خطأ في رفع الصورة', 'error');
      setFormData(prev => ({ ...prev, mainImage: '', mainImageStorageId: null }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    if (formData.gallery.length + files.length > 10) { showToast('الحد الأقصى 10 صور', 'error'); return; }
    setIsUploading(true);
    try {
      const previews = files.map(f => URL.createObjectURL(f));
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...previews], galleryStorageIds: [...prev.galleryStorageIds, ...Array(files.length).fill(null)] }));
      const results = await Promise.all(files.map(async (file, i) => {
        try {
          const uploaded = await uploadFileToConvex(file, getUploadUrlMutation);
          return { i, id: uploaded.storageId };
        }
        catch { return { i, id: null }; }
      }));
      setFormData(prev => {
        const ids = [...prev.galleryStorageIds];
        results.forEach(({ i, id }) => { ids[prev.gallery.length - files.length + i] = id; });
        return { ...prev, galleryStorageIds: ids };
      });
    } catch { showToast('خطأ في الرفع', 'error'); } finally { setIsUploading(false); }
  };

  const removeGalleryImage = async (index) => {
    const storageId = formData.galleryStorageIds?.[index];
    if (storageId) { try { await deleteImageMutation({ storageId }); } catch { /* ignore missing/deleted storage */ } }
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
      galleryStorageIds: prev.galleryStorageIds.filter((_, i) => i !== index),
    }));
  };

  const handleDragStart = (i) => setDraggedItem(i);
  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === i) return;
    setFormData(prev => {
      const g = [...prev.gallery]; const ids = [...prev.galleryStorageIds];
      const [gi, si] = [g.splice(draggedItem, 1)[0], ids.splice(draggedItem, 1)[0]];
      g.splice(i, 0, gi); ids.splice(i, 0, si);
      return { ...prev, gallery: g, galleryStorageIds: ids };
    });
    setDraggedItem(i);
  };
  const handleDragEnd = () => setDraggedItem(null);

  const handleSubmit = async (statusOverride) => {
    setIsLoading(true);
    try {
      if (!formData.title?.ar && !formData.title?.fr && !formData.title?.en) {
        showToast('يرجى إدخال عنوان المشروع', 'error'); setIsLoading(false); return;
      }
      if (!formData.mainImageStorageId) {
        showToast('يرجى رفع الصورة الرئيسية', 'error'); setIsLoading(false); return;
      }
      const status = statusOverride || formData.status || 'draft';
      const validGalleryIds = (formData.galleryStorageIds || []).filter(Boolean);
      if (isEditMode) {
        await updateProjectMutation({
          projectId: id,
          updates: {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            goalAmount: Math.round((parseFloat(formData.goal) || 0) * 100),
            mainImageStorageId: formData.mainImageStorageId,
            galleryStorageIds: validGalleryIds,
            status,
            isFeatured: formData.featured,
            location: formData.location,
            beneficiaries: parseInt(formData.beneficiaries) || 0,
            ...(formData.transformationStage ? { transformationStage: formData.transformationStage } : {}),
            ...(formData.benefitCards?.length ? { benefitCards: formData.benefitCards } : { benefitCards: [] }),
            slug: formData.slug || undefined,
            metaTitle: formData.metaTitle || undefined,
            metaDescription: formData.metaDescription || undefined,
            imageAlt: formData.imageAlt || undefined,
          },
          adminId: user?.id,
        });
      } else {
        const adminId = user?.id;
        if (!adminId) { showToast('انتهت الجلسة، يرجى تسجيل الدخول', 'error'); setIsLoading(false); return; }
        await createProjectMutation({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          goalAmount: Math.round((parseFloat(formData.goal) || 0) * 100),
          mainImageStorageId: formData.mainImageStorageId,
          galleryStorageIds: validGalleryIds,
          status,
          location: formData.location,
          beneficiaries: parseInt(formData.beneficiaries) || 0,
          isFeatured: formData.featured,
          createdBy: adminId,
          slug: formData.slug || undefined,
          metaTitle: formData.metaTitle || undefined,
          metaDescription: formData.metaDescription || undefined,
          imageAlt: formData.imageAlt || undefined,
          ...(formData.transformationStage ? { transformationStage: formData.transformationStage } : {}),
          ...(formData.benefitCards?.length ? { benefitCards: formData.benefitCards } : {}),
        });
      }
      showToast(status === 'active' ? 'تم نشر المشروع' : 'تم حفظ المسودة', 'success');
      navigate('/admin/projects');
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditMode && existingProject === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'var(--font-arabic)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
          <p style={{ color: TEXTM }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ── Language tab ─────────────────────────────────────────────────────────
  const LangTabs = () => (
    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
      {['ar', 'fr', 'en'].map(l => (
        <button key={l} type="button" onClick={() => setActiveTab(l)}
          style={{ height: 28, padding: '0 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', border: `1.5px solid ${activeTab === l ? PRIMARY : BORDER}`, background: activeTab === l ? PRIMARY : 'white', color: activeTab === l ? 'white' : TEXT2 }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: '#0e1a1b', padding: 24, paddingBottom: 100 }} dir="rtl">

      {/* ── Section 1: Basic Info ── */}
      <Section icon="📝" title="المعلومات الأساسية">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Title – full width */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={fieldLabel}>اسم المشروع <span style={{ color: '#ef4444' }}>*</span></div>
            <LangTabs />
            <input
              style={fieldInput}
              type="text"
              value={formData.title[activeTab]}
              onChange={e => set('title', e.target.value, activeTab)}
              placeholder="أدخل اسم المشروع..."
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Category */}
          <div>
            <div style={fieldLabel}>الفئة <span style={{ color: '#ef4444' }}>*</span></div>
            <select
              value={formData.category}
              onChange={e => set('category', e.target.value)}
              style={{ ...fieldInput, cursor: 'pointer' }}
            >
              <option value="education">🎓 التعليم</option>
              <option value="water">💧 الماء</option>
              <option value="health">🏥 الصحة</option>
              <option value="food">🍞 الغذاء</option>
              <option value="housing">🏠 السكن</option>
              <option value="orphan_care">🕌 الكفالة</option>
              <option value="emergency">⚡ الطوارئ</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <div style={fieldLabel}>الموقع الجغرافي</div>
            <input
              style={fieldInput}
              type="text"
              value={formData.location}
              onChange={e => set('location', e.target.value)}
              placeholder="مثال: درعة تافيلالت، المغرب"
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Transformation stage – orphan_care only */}
          {formData.category === 'orphan_care' && (
            <div style={{ gridColumn: '1/-1' }}>
              <div style={fieldLabel}>مرحلة التحول</div>
              <select value={formData.transformationStage} onChange={e => set('transformationStage', e.target.value)} style={{ ...fieldInput, cursor: 'pointer' }}>
                <option value="">— لا ينطبق —</option>
                <option value="early_care">الرعاية المبكرة</option>
                <option value="education">التعليم</option>
                <option value="integration">الاندماج</option>
              </select>
            </div>
          )}

          {/* Short description – full width */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={fieldLabel}>الوصف المختصر <span style={{ color: '#ef4444' }}>*</span></div>
            <textarea
              style={{ ...fieldTextarea, minHeight: 80 }}
              rows={3}
              value={formData.shortDescription[activeTab]}
              onChange={e => set('shortDescription', e.target.value, activeTab)}
              placeholder="وصف مختصر يظهر في قائمة المشاريع..."
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Detailed description – full width */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={fieldLabel}>الوصف التفصيلي</div>
            <textarea
              style={{ ...fieldTextarea, minHeight: 140 }}
              rows={5}
              value={formData.description[activeTab]}
              onChange={e => set('description', e.target.value, activeTab)}
              placeholder="أضف وصفاً مفصلاً للمشروع، أهدافه، والفئة المستفيدة..."
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>
        </div>
      </Section>

      {/* ── Section 2: Financial ── */}
      <Section icon="💰" title="المعلومات المالية">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Goal */}
          <div>
            <div style={fieldLabel}>المبلغ المستهدف (درهم) <span style={{ color: '#ef4444' }}>*</span></div>
            <input
              style={{ ...fieldInput, direction: 'ltr', textAlign: 'right', fontFamily: 'Inter, sans-serif' }}
              type="number"
              value={formData.goal}
              onChange={e => set('goal', e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
              placeholder="0"
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Beneficiaries */}
          <div>
            <div style={fieldLabel}>عدد المستفيدين</div>
            <input
              style={{ ...fieldInput, direction: 'ltr', textAlign: 'right', fontFamily: 'Inter, sans-serif' }}
              type="number"
              value={formData.beneficiaries}
              onChange={e => set('beneficiaries', e.target.value)}
              placeholder="0"
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
            <div style={fieldHint}>عدد الأشخاص المستفيدين من المشروع</div>
          </div>
        </div>
      </Section>

      {/* ── Section 2b: Benefit Cards ── */}
      <Section icon="🎯" title="بطاقات الأثر (اختياري)">
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          أضف بطاقات توضح أثر المشروع — ستظهر في صفحة التفاصيل بدلاً من الأرقام التلقائية.
          <br />مثال: 👨‍👩‍👧‍👦 · 10 · أسرة مستفيدة
        </div>
        {(formData.benefitCards || []).map((card, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={card.icon}
              onChange={e => { const c = [...formData.benefitCards]; c[i] = { ...c[i], icon: e.target.value }; set('benefitCards', c); }}
              placeholder="😊"
              style={{ ...fieldInput, textAlign: 'center', fontSize: 22, padding: '0 4px', fontFamily: 'sans-serif' }}
            />
            <input
              value={card.value} onChange={e => { const c = [...formData.benefitCards]; c[i] = { ...c[i], value: e.target.value }; set('benefitCards', c); }}
              placeholder="10" style={{ ...fieldInput }} dir="ltr"
            />
            <input
              value={card.label} onChange={e => { const c = [...formData.benefitCards]; c[i] = { ...c[i], label: e.target.value }; set('benefitCards', c); }}
              placeholder="أسرة مستفيدة" style={{ ...fieldInput }}
            />
            <button type="button"
              onClick={() => { const c = formData.benefitCards.filter((_, j) => j !== i); set('benefitCards', c); }}
              style={{ width: 36, height: 44, background: '#FEE2E2', border: 'none', borderRadius: 10, color: '#dc2626', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ×
            </button>
          </div>
        ))}
        {(formData.benefitCards || []).length < 6 && (
          <button type="button"
            onClick={() => set('benefitCards', [...(formData.benefitCards || []), { icon: '', value: '', label: '' }])}
            style={{ height: 40, padding: '0 18px', border: `1.5px dashed ${BORDER}`, borderRadius: 10, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: PRIMARY, fontFamily: 'var(--font-arabic)' }}>
            ➕ إضافة بطاقة
          </button>
        )}
      </Section>

      {/* ── Section 3: Media ── */}
      <Section icon="🖼️" title="الصور والوسائط">
        <div style={fieldLabel}>صورة الغلاف الرئيسية <span style={{ color: '#ef4444' }}>*</span></div>

        {formData.mainImage ? (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <img
              src={convexFileUrl(formData.mainImageStorageId) || formData.mainImage}
              alt="main"
              style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
            />
            {isUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>جاري الرفع...</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 12, left: 12, height: 34, padding: '0 14px', background: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>
              تغيير الصورة
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed #E5E9EB', borderRadius: 14, padding: 32, textAlign: 'center', cursor: 'pointer', background: '#f6f8f8', marginBottom: 16, transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#33C0C0'; e.currentTarget.style.background = '#E6F4F4'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E9EB'; e.currentTarget.style.background = '#f6f8f8'; }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>اسحب وأفلت أو انقر للاختيار</div>
            <div style={{ fontSize: 12, color: TEXTM }}>PNG أو JPG · 1200×600px مُفضَّل · حتى 5 ميغابايت</div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} style={{ display: 'none' }} />

        {/* Gallery */}
        {formData.gallery.length > 0 && (
          <>
            <div style={{ ...fieldLabel, marginTop: 12 }}>معرض الصور ({formData.gallery.length}/10)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {formData.gallery.map((img, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', opacity: draggedItem === i ? 0.5 : 1, cursor: 'move' }}
                >
                  <img src={convexFileUrl(formData.galleryStorageIds?.[i]) || img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeGalleryImage(i)}
                    style={{ position: 'absolute', top: 4, left: 4, width: 20, height: 20, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    ×
                  </button>
                </div>
              ))}
              {formData.gallery.length < 10 && (
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  style={{ width: 80, height: 80, borderRadius: 10, border: '2px dashed #E5E9EB', background: '#f6f8f8', cursor: 'pointer', fontSize: 22, color: TEXTM }}>
                  +
                </button>
              )}
            </div>
          </>
        )}
        {formData.gallery.length === 0 && (
          <button type="button" onClick={() => galleryInputRef.current?.click()}
            style={{ height: 38, padding: '0 16px', border: `1.5px solid ${BORDER}`, borderRadius: 10, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-arabic)', color: TEXT2, marginTop: 4 }}>
            + إضافة صور للمعرض
          </button>
        )}
        <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: 'none' }} />
      </Section>

      {/* ── Section 4: Settings ── */}
      <Section icon="⚙️" title="إعدادات المشروع">
        <ToggleRow
          title="عرض قائمة المتبرعين"
          desc="إظهار أسماء المتبرعين في صفحة المشروع"
          checked={formData.showDonors}
          onChange={() => set('showDonors', !formData.showDonors)}
        />
        <ToggleRow
          title="السماح بالتبرع المجهول"
          desc="يمكن للمتبرعين اختيار إخفاء هويتهم"
          checked={formData.allowAnonymous}
          onChange={() => set('allowAnonymous', !formData.allowAnonymous)}
        />
        <ToggleRow
          title="مشروع مميز"
          desc="يظهر في أعلى قائمة المشاريع والرئيسية"
          checked={formData.featured}
          onChange={() => set('featured', !formData.featured)}
          last
        />
      </Section>

      {/* ── Sticky action bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50, fontFamily: 'var(--font-arabic)' }}>
        <button type="button" onClick={() => navigate('/admin/projects')}
          style={{ height: 44, padding: '0 20px', border: `1.5px solid ${BORDER}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-arabic)', background: 'white', color: '#64748b' }}>
          ← إلغاء
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => handleSubmit('draft')} disabled={isLoading}
            style={{ height: 44, padding: '0 28px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: SHADOW_PRIMARY, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading ? '...' : '💾 حفظ كمسودة'}
          </button>
          <button type="button" onClick={() => handleSubmit('active')} disabled={isLoading}
            style={{ height: 44, padding: '0 28px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)', opacity: isLoading ? 0.6 : 1 }}>
            {isLoading ? '...' : '✅ نشر المشروع'}
          </button>
        </div>
      </div>
    </div>
  );
}
