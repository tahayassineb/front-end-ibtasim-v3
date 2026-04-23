import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';
import { optimizeImageFile } from '../../../../lib/imageOptimization';
import KafalaAvatar from '../../../../components/kafala/KafalaAvatar';

// ─── Kafala design tokens ─────────────────────────────────────────────────────
const KDARK  = '#8B6914';
const KBG    = '#F5EBD9';
const K100   = '#E8D4B0';
const BORDER = '#E5E9EB';
const TEXT2  = '#64748b';
const TEXTM  = '#94a3b8';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_K = '0 4px 14px rgba(196,168,130,.35)';

const fieldInput = {
  width: '100%', height: 48, border: `1.5px solid ${BORDER}`, borderRadius: 12,
  padding: '0 14px', fontSize: 14, fontFamily: 'Tajawal, sans-serif',
  color: '#0e1a1b', outline: 'none', background: 'white', boxSizing: 'border-box',
};
const fieldLabel = { fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 };

const Section = ({ icon, title, children }) => (
  <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${K100}`, boxShadow: SHADOW, marginBottom: 20, overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${K100}`, display: 'flex', alignItems: 'center', gap: 10, background: KBG }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: KDARK }}>{title}</span>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

export default function AdminKafalaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, user: adminUser } = useApp();
  const isEdit = !!id;

  // ── Convex ────────────────────────────────────────────────────────────────
  const existingKafala  = useQuery(api.kafala.getKafalaById, isEdit ? { kafalaId: id } : 'skip');
  const createKafala    = useMutation(api.kafala.createKafala);
  const updateKafala    = useMutation(api.kafala.updateKafala);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName]           = useState('');
  const [gender, setGender]       = useState('male');
  const [age, setAge]             = useState('');
  const [location, setLocation]   = useState('');
  const [bio, setBio]             = useState({ ar: '', fr: '', en: '' });
  const [bioTab, setBioTab]       = useState('ar');
  const [needs, setNeeds] = useState([
    { id: 1, icon: '📚', label: 'التعليم', price: '120' },
    { id: 2, icon: '🍞', label: 'الغذاء',  price: '100' },
    { id: 3, icon: '🏥', label: 'الصحة',   price: '80'  },
  ]);
  const [photo, setPhoto]         = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef();

  const totalMAD = needs.reduce((s, n) => s + (parseInt(n.price) || 0), 0);
  const addNeed = () => setNeeds(p => [...p, { id: Date.now(), icon: '✏️', label: '', price: '0' }]);
  const removeNeed = (id) => setNeeds(p => p.filter(n => n.id !== id));
  const updateNeed = (id, field, val) => setNeeds(p => p.map(n => n.id === id ? { ...n, [field]: val } : n));

  // Pre-fill when editing
  useEffect(() => {
    if (existingKafala && isEdit) {
      setName(existingKafala.name || '');
      setGender(existingKafala.gender || 'male');
      setAge(String(existingKafala.age || ''));
      setLocation(existingKafala.location || '');
      setBio(existingKafala.bio || { ar: '', fr: '', en: '' });
      const totalMadFromDB = Math.round(existingKafala.monthlyPrice / 100);
      setNeeds([
        { id: 1, icon: '📚', label: 'التعليم', price: String(Math.round(totalMadFromDB * 0.4)) },
        { id: 2, icon: '🍞', label: 'الغذاء',  price: String(Math.round(totalMadFromDB * 0.33)) },
        { id: 3, icon: '🏥', label: 'الصحة',   price: String(totalMadFromDB - Math.round(totalMadFromDB * 0.4) - Math.round(totalMadFromDB * 0.33)) },
      ]);
      setExistingPhoto(existingKafala.photo || null);
    }
  }, [existingKafala, isEdit]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async () => {
    if (!photo) return existingPhoto;
    const optimized = await optimizeImageFile(photo, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 });
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, { method: 'POST', body: optimized.file, headers: { 'Content-Type': optimized.file.type } });
    const { storageId } = await res.json();
    return storageId;
  };

  const validate = () => {
    if (!name.trim())     { showToast?.('الاسم مطلوب', 'error'); return false; }
    if (!age || isNaN(Number(age)) || Number(age) < 1) { showToast?.('العمر يجب أن يكون رقماً صحيحاً', 'error'); return false; }
    if (!location.trim()) { showToast?.('المدينة مطلوبة', 'error'); return false; }
    if (!bio.ar.trim())   { showToast?.('القصة بالعربية مطلوبة', 'error'); return false; }
    if (needs.length === 0)  { showToast?.('أضف احتياجاً واحداً على الأقل', 'error'); return false; }
    if (totalMAD < 1)        { showToast?.('السعر الشهري مطلوب', 'error'); return false; }
    return true;
  };

  const handleSave = async (publish = false) => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      const photoStorageId = await uploadPhoto();
      const priceInCents   = totalMAD * 100;

      if (isEdit) {
        await updateKafala({
          adminId: adminUser?.id,
          kafalaId: id, name, gender, age: Number(age),
          location, bio, photo: photoStorageId || undefined,
          monthlyPrice: priceInCents,
          ...(publish ? { status: 'active' } : {}),
        });
        showToast?.(publish ? 'تم نشر الكفالة' : 'تم حفظ التغييرات', 'success');
      } else {
        const adminId = adminUser?.id;
        if (!adminId) throw new Error('لم يتم التعرف على الأدمن');
        await createKafala({ adminId, name, gender, age: Number(age), location, bio, photo: photoStorageId || undefined, monthlyPrice: priceInCents });
        showToast?.(publish ? 'تم إنشاء الكفالة. انشرها من قائمة الكفالات' : 'تم حفظ الكفالة كمسودة', 'success');
      }
      navigate('/admin/kafala');
    } catch (e) {
      showToast?.(e?.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentPhotoUrl = photoPreview || (existingPhoto ? convexFileUrl(existingPhoto) : null);

  if (isEdit && existingKafala === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤲</div>
          <p style={{ color: TEXTM }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24, paddingBottom: 100, maxWidth: 800 }} dir="rtl">

      {/* ── Section 1: Personal Info ── */}
      <Section icon="👦" title="المعلومات الشخصية">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Name */}
          <div>
            <div style={fieldLabel}>الاسم الأول <span style={{ color: '#ef4444' }}>*</span></div>
            <input style={fieldInput} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسم اليتيم"
              onFocus={e => e.target.style.borderColor = KDARK} onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Gender */}
          <div>
            <div style={fieldLabel}>الجنس <span style={{ color: '#ef4444' }}>*</span></div>
            <select value={gender} onChange={e => setGender(e.target.value)} style={{ ...fieldInput, cursor: 'pointer' }}>
              <option value="male">👦 ذكر</option>
              <option value="female">👧 أنثى</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <div style={fieldLabel}>العمر (سنوات) <span style={{ color: '#ef4444' }}>*</span></div>
            <input style={{ ...fieldInput, direction: 'ltr', fontFamily: 'Inter, sans-serif' }} type="number" min="1" max="18" value={age} onChange={e => setAge(e.target.value)} placeholder="مثال: 9"
              onFocus={e => e.target.style.borderColor = KDARK} onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Location */}
          <div>
            <div style={fieldLabel}>المنطقة / المدينة <span style={{ color: '#ef4444' }}>*</span></div>
            <input style={fieldInput} type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="مثال: درعة تافيلالت"
              onFocus={e => e.target.style.borderColor = KDARK} onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Bio – full width with tabs */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={fieldLabel}>القصة <span style={{ color: '#ef4444' }}>*</span></div>
            {/* Language tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {['ar', 'fr', 'en'].map(l => (
                <button key={l} type="button" onClick={() => setBioTab(l)}
                  style={{ height: 28, padding: '0 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', border: `1.5px solid ${bioTab === l ? KDARK : BORDER}`, background: bioTab === l ? KDARK : 'white', color: bioTab === l ? 'white' : TEXT2 }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <textarea
              value={bio[bioTab]}
              onChange={e => setBio(prev => ({ ...prev, [bioTab]: e.target.value }))}
              rows={4}
              placeholder="قصة اليتيم وظروفه..."
              style={{ width: '100%', minHeight: 100, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = KDARK}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>
        </div>
      </Section>

      {/* ── Section 2: Photo ── */}
      <Section icon="📸" title="صورة اليتيم">
        {currentPhotoUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={currentPhotoUrl} alt="photo" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${K100}` }} />
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ height: 38, padding: '0 16px', background: KBG, color: KDARK, border: `1px solid ${K100}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                تغيير الصورة
              </button>
              <div style={{ fontSize: 11, color: TEXTM, marginTop: 6 }}>JPG أو PNG — إذا لم ترفع صورة سيظهر رمز الجنس</div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${K100}`, borderRadius: 14, padding: 28, textAlign: 'center', cursor: 'pointer', background: KBG, transition: 'border-color .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = KDARK}
            onMouseLeave={e => e.currentTarget.style.borderColor = K100}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: KDARK, marginBottom: 4 }}>أضف صورة اليتيم</div>
            <div style={{ fontSize: 12, color: TEXTM }}>الصورة لا تُنشر عامةً — تُستخدم للكافلين فقط</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
      </Section>

      {/* ── Section 3: Needs breakdown — dynamic ── */}
      <Section icon="💰" title="احتياجات الكفالة الشهرية">
        {/* Dynamic needs list */}
        {needs.map((need) => (
          <div key={need.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {/* Icon input */}
            <input
              type="text" value={need.icon}
              onChange={e => updateNeed(need.id, 'icon', e.target.value)}
              style={{ ...fieldInput, width: 48, height: 44, textAlign: 'center', fontSize: 18, padding: '0 4px', flexShrink: 0 }}
              maxLength={2}
            />
            {/* Label input */}
            <input
              type="text" value={need.label}
              onChange={e => updateNeed(need.id, 'label', e.target.value)}
              placeholder="اسم الاحتياج"
              style={{ ...fieldInput, flex: 1, height: 44 }}
            />
            {/* Price input */}
            <input
              type="number" min="0" value={need.price}
              onChange={e => updateNeed(need.id, 'price', e.target.value)}
              style={{ ...fieldInput, width: 90, height: 44, direction: 'ltr', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: TEXTM, whiteSpace: 'nowrap', flexShrink: 0 }}>د.م</span>
            {/* Delete button */}
            <button type="button" onClick={() => removeNeed(need.id)}
              style={{ width: 36, height: 36, background: '#FEE2E2', color: '#dc2626', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ×
            </button>
          </div>
        ))}

        {/* Add need button */}
        <button type="button" onClick={addNeed}
          style={{ width: '100%', height: 44, border: `2px dashed ${K100}`, borderRadius: 12, background: KBG, color: KDARK, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', marginTop: 4 }}>
          + إضافة احتياج
        </button>

        {/* Total */}
        <div style={{ background: KBG, borderRadius: 12, padding: 14, marginTop: 14, border: `1px solid ${K100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KDARK }}>إجمالي الكفالة الشهرية:</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: KDARK, fontFamily: 'Inter, sans-serif' }}>{totalMAD} درهم/شهر</div>
        </div>
      </Section>

      {/* ── Sticky action bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50, fontFamily: 'Tajawal, sans-serif' }}>
        <button type="button" onClick={() => navigate('/admin/kafala')}
          style={{ height: 44, padding: '0 20px', border: `1.5px solid ${BORDER}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'white', color: TEXT2 }}>
          ← إلغاء
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => handleSave(false)} disabled={saving}
            style={{ height: 44, padding: '0 20px', border: `1.5px solid ${BORDER}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'white', color: TEXT2, opacity: saving ? 0.6 : 1 }}>
            {saving ? '...' : '💾 حفظ كمسودة'}
          </button>
          <button type="button" onClick={() => handleSave(true)} disabled={saving}
            style={{ height: 44, padding: '0 24px', background: KDARK, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_K, opacity: saving ? 0.6 : 1 }}>
            {saving ? '...' : '🤲 نشر للكفالة'}
          </button>
        </div>
      </div>
    </div>
  );
}
