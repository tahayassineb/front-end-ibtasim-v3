import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ─── Kafala design tokens ─────────────────────────────────────────────────────
const K    = '#C4A882';
const KDARK = '#8B6914';
const KBG   = '#F5EBD9';
const K100  = '#E8D4B0';
const BORDER = '#E5E9EB';
const TEXT2  = '#64748b';
const TEXTM  = '#94a3b8';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';

const STATUS_CFG = {
  draft:     { label: '○ مسودة',  bg: '#F0F7F7',  color: TEXTM },
  active:    { label: '⏳ متاح',  bg: KBG,        color: KDARK },
  sponsored: { label: '✓ مكفول', bg: '#D1FAE5',  color: '#16a34a' },
  inactive:  { label: '✗ غير نشط', bg: '#FEE2E2', color: '#dc2626' },
};

export default function AdminKafala() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(null);

  // ── Convex ────────────────────────────────────────────────────────────────
  const kafalaList    = useQuery(api.kafala.getKafalaList, {});
  const deleteMutation  = useMutation(api.kafala.deleteKafala);
  const publishMutation = useMutation(api.kafala.publishKafala);
  const resetMutation   = useMutation(api.kafala.resetKafala);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = async (kafalaId) => {
    try {
      await deleteMutation({ kafalaId });
      showToast?.('تم حذف الكفالة', 'success');
    } catch (e) { showToast?.(e?.message || 'حدث خطأ', 'error'); }
    setDeleteConfirm(null);
  };

  const handlePublish = async (kafalaId) => {
    try {
      await publishMutation({ kafalaId });
      showToast?.('تم نشر الكفالة', 'success');
    } catch (e) { showToast?.(e?.message || 'حدث خطأ', 'error'); }
  };

  const handleReset = async (kafalaId) => {
    try {
      await resetMutation({ kafalaId });
      showToast?.('تم إعادة فتح كفالة اليتيم', 'success');
    } catch (e) { showToast?.(e?.message || 'حدث خطأ', 'error'); }
    setResetConfirm(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const list = kafalaList || [];
  const sponsored = list.filter(k => k.status === 'sponsored');
  const available  = list.filter(k => k.status === 'active');
  const monthlyRevenue = sponsored.reduce((s, k) => s + (k.monthlyPrice || 0), 0) / 100;

  const filtered = list.filter(k => {
    if (statusFilter !== 'all' && k.status !== statusFilter) return false;
    if (search && !k.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { num: list.length, label: 'إجمالي الأيتام', color: KDARK },
          { num: sponsored.length, label: 'مكفولون حالياً', color: '#16a34a' },
          { num: available.length, label: 'ينتظرون كافلاً', color: KDARK },
          { num: monthlyRevenue.toLocaleString('fr-MA'), label: 'درهم/شهر محصّل', color: KDARK },
        ].map(({ num, label, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Inter, sans-serif', color }}>{num}</div>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${BORDER}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن يتيم..."
          style={{ flex: 1, minWidth: 200, height: 38, padding: '0 16px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = KDARK}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
        {[
          ['all', `الكل (${list.length})`],
          ['sponsored', `✓ مكفول (${sponsored.length})`],
          ['active', `⏳ متاح (${available.length})`],
          ['draft', 'مسودة'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            style={{ height: 34, padding: '0 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${statusFilter === val ? KDARK : BORDER}`, background: statusFilter === val ? KDARK : 'white', color: statusFilter === val ? 'white' : TEXT2, fontFamily: 'Tajawal, sans-serif' }}>
            {label}
          </button>
        ))}
        <Link to="/admin/kafala/new"
          style={{ height: 38, padding: '0 18px', background: KDARK, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
          + إضافة يتيم
        </Link>
      </div>

      {/* ── Loading / Empty ── */}
      {kafalaList === undefined && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: TEXTM }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
          <p>جاري التحميل...</p>
        </div>
      )}

      {kafalaList !== undefined && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: TEXTM }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
          <p>لا توجد كفالات تطابق البحث</p>
        </div>
      )}

      {/* ── Cards grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {filtered.map(kafala => {
          const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
          const isSponsored = kafala.status === 'sponsored';
          const priceMAD = (kafala.monthlyPrice || 0) / 100;
          const st = STATUS_CFG[kafala.status] || STATUS_CFG.active;
          const nextRenewal = kafala.sponsorship?.nextRenewalDate
            ? new Date(kafala.sponsorship.nextRenewalDate).toLocaleDateString('fr-MA')
            : null;

          return (
            <div key={kafala._id}
              style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${isSponsored ? '#BBF7D0' : K100}`, boxShadow: SHADOW, overflow: 'hidden', cursor: 'default', transition: 'box-shadow .15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,168,130,.25)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = SHADOW}
            >
              {/* Avatar header */}
              <div style={{ height: 100, background: isSponsored ? 'linear-gradient(135deg,#166534,#16a34a)' : 'linear-gradient(135deg,#3D2506,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative' }}>
                {photoUrl ? (
                  <img src={photoUrl} alt={kafala.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                ) : (
                  <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={null} size={56} />
                )}
                <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>
                  {st.label.replace(/[○✓⏳✗] /, '')}
                </span>
              </div>

              {/* Card body */}
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: KDARK, marginBottom: 4 }}>{kafala.name}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>
                  {kafala.age && <span>🎂 {kafala.age} سنة</span>}
                  {kafala.age && kafala.location && ' · '}
                  {kafala.location && <span>📍 {kafala.location}</span>}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: KDARK, fontFamily: 'Inter, sans-serif' }}>{priceMAD}</span>
                  <span style={{ fontSize: 11, color: TEXTM }}> درهم/شهر</span>
                </div>

                {/* Sponsor info */}
                {isSponsored && kafala.sponsorship && (
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 6, paddingTop: 8, borderTop: `1px solid ${K100}` }}>
                    🤲 {kafala.sponsorship.sponsorName || 'كافل'} {nextRenewal && `· تجديد ${nextRenewal}`}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => navigate(`/admin/kafala/${kafala._id}/edit`)}
                    style={{ flex: 1, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: KBG, color: KDARK }}>
                    ✏️ تعديل
                  </button>
                  <button onClick={() => navigate(`/admin/kafala/${kafala._id}`)}
                    style={{ flex: 1, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: '#E6F4F4', color: '#0A5F62' }}>
                    👁 عرض
                  </button>
                  {kafala.status === 'draft' && (
                    <button onClick={() => handlePublish(kafala._id)}
                      style={{ flex: 1, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: '#D1FAE5', color: '#16a34a' }}>
                      ▶ نشر
                    </button>
                  )}
                  {kafala.status === 'sponsored' && (
                    <button onClick={() => setResetConfirm(kafala._id)}
                      style={{ height: 32, width: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: '#FFFBEB', color: '#92400e' }}>
                      🔓
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirm(kafala._id)}
                    style={{ height: 32, width: 32, borderRadius: 8, fontSize: 12, cursor: 'pointer', border: 'none', background: '#FEE2E2', color: '#dc2626' }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Delete confirm modal ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>تأكيد الحذف</h3>
            <p style={{ fontSize: 14, color: TEXT2, marginBottom: 20 }}>سيتم حذف الكفالة وجميع بياناتها نهائياً. هل أنت متأكد؟</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${BORDER}`, background: 'white', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', color: TEXT2 }}>
                إلغاء
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, height: 44, borderRadius: 12, background: '#ef4444', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset confirm modal ── */}
      {resetConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔓</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>إعادة فتح الكفالة</h3>
            <p style={{ fontSize: 14, color: TEXT2, marginBottom: 20 }}>سيتم إنهاء الاشتراك الحالي وإعادة فتح الكفالة للتبرع. هل تريد المتابعة؟</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setResetConfirm(null)}
                style={{ flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${BORDER}`, background: 'white', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', color: TEXT2 }}>
                إلغاء
              </button>
              <button onClick={() => handleReset(resetConfirm)}
                style={{ flex: 1, height: 44, borderRadius: 12, background: '#f59e0b', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}