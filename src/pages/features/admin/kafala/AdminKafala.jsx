import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';
import { formatMAD } from '../../../../lib/money';
import KafalaAvatar from '../../../../components/kafala/KafalaAvatar';

const BORDER = '#E5E9EB';
const K = '#8B6914';
const TEXT = '#0e1a1b';
const MUTED = '#64748b';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';

const statusMeta = {
  draft: { label: 'مسودة', color: MUTED, bg: '#F0F7F7' },
  active: { label: 'متاح', color: K, bg: '#F5EBD9' },
  sponsored: { label: 'مكفول', color: '#16a34a', bg: '#D1FAE5' },
  inactive: { label: 'غير نشط', color: '#dc2626', bg: '#FEE2E2' },
};

export default function AdminKafala() {
  const navigate = useNavigate();
  const { showToast, currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(null);

  const kafalaList = useQuery(api.kafala.getKafalaList, { limit: 200 });
  const stats = useQuery(api.admin.getDashboardStats, {});
  const deleteKafala = useMutation(api.kafala.deleteKafala);
  const publishKafala = useMutation(api.kafala.publishKafala);
  const resetKafala = useMutation(api.kafala.resetKafala);
  const updateKafala = useMutation(api.kafala.updateKafala);

  const list = useMemo(() => kafalaList || [], [kafalaList]);
  const filtered = useMemo(() => list.filter((item) => {
    if (status !== 'all' && item.status !== status) return false;
    if (search && !item.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [list, search, status]);

  const sponsored = list.filter((item) => item.status === 'sponsored');
  const available = list.filter((item) => item.status === 'active');

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    try {
      await deleteKafala({ kafalaId: id });
      setDeleteConfirm(null);
      showToast?.('تم حذف الكفالة', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل الحذف', 'error');
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishKafala({ kafalaId: id });
      showToast?.('تم نشر الكفالة', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل النشر', 'error');
    }
  };

  const handleReset = async (id) => {
    try {
      await resetKafala({ kafalaId: id });
      setResetConfirm(null);
      showToast?.('تمت إعادة فتح الكفالة', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل إعادة الفتح', 'error');
    }
  };

  const toggleFeatured = async (item) => {
    try {
      await updateKafala({ kafalaId: item._id, isFeatured: !item.isFeatured });
      showToast?.(!item.isFeatured ? 'تم إظهار الكفالة في الرئيسية' : 'تم إخفاء الكفالة من الرئيسية', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل التحديث', 'error');
    }
  };

  if (kafalaList === undefined || stats === undefined) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontFamily: 'var(--font-arabic)' }}>جاري تحميل الكفالات...</div>;
  }

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: TEXT, padding: 24 }} dir="rtl">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { value: list.length, label: 'إجمالي الكفالات', color: K },
          { value: sponsored.length, label: 'كفالات نشطة', color: '#16a34a' },
          { value: available.length, label: 'بدون كافل', color: K },
          { value: formatMAD(stats.kafalaStats?.collected || 0, lang), label: 'محصل من الكفالة', color: K },
          { value: stats.kafalaStats?.pendingVerifications || 0, label: 'تحتاج التحقق', color: '#f59e0b' },
        ].map((card) => (
          <div key={card.label} style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 18 }}>
            <div style={{ fontSize: 25, fontWeight: 900, fontFamily: 'Inter, sans-serif', color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن يتيم..." style={{ flex: 1, minWidth: 220, height: 38, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '0 14px', fontFamily: 'var(--font-arabic)' }} />
        {['all', 'active', 'sponsored', 'draft'].map((key) => (
          <button key={key} type="button" onClick={() => setStatus(key)} style={{ height: 34, padding: '0 14px', borderRadius: 99, border: `1.5px solid ${status === key ? K : BORDER}`, background: status === key ? K : 'white', color: status === key ? 'white' : MUTED, cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontWeight: 800 }}>
            {key === 'all' ? 'الكل' : statusMeta[key]?.label}
          </button>
        ))}
        <Link to="/admin/kafala/new" style={{ height: 38, padding: '0 18px', borderRadius: 10, background: K, color: 'white', display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 800 }}>+ إضافة يتيم</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
        {filtered.map((item) => {
          const photoUrl = item.photo ? (convexFileUrl(item.photo) || item.photo) : null;
          const st = statusMeta[item.status] || statusMeta.active;
          return (
            <div key={item._id} style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
              <div style={{ height: 150, position: 'relative', background: 'linear-gradient(135deg,#3D2506,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photoUrl ? <img src={photoUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <KafalaAvatar gender={item.gender} size={70} />}
                <span style={{ position: 'absolute', top: 10, right: 10, borderRadius: 99, padding: '4px 10px', background: st.bg, color: st.color, fontSize: 11, fontWeight: 900 }}>{st.label}</span>
                <button type="button" onClick={() => toggleFeatured(item)} style={{ position: 'absolute', top: 10, left: 10, height: 30, borderRadius: 99, border: 'none', padding: '0 10px', background: item.isFeatured ? '#FEF3C7' : 'rgba(255,255,255,.92)', color: item.isFeatured ? '#92400e' : MUTED, cursor: 'pointer', fontWeight: 900 }}>
                  {item.isFeatured ? '★ الرئيسية' : '☆ الرئيسية'}
                </button>
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: K }}>{item.name}</h3>
                <div style={{ color: MUTED, fontSize: 12, marginBottom: 8 }}>{item.age} سنة · {item.location}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: K, marginBottom: 14 }}>{formatMAD(item.monthlyPrice || 0, lang)} / شهر</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="button" onClick={() => navigate(`/admin/kafala/${item._id}/edit`)} style={{ height: 34, border: 'none', borderRadius: 9, background: '#F5EBD9', color: K, fontWeight: 800, cursor: 'pointer' }}>تعديل</button>
                  {item.status === 'draft' ? (
                    <button type="button" onClick={() => handlePublish(item._id)} style={{ height: 34, border: 'none', borderRadius: 9, background: '#D1FAE5', color: '#16a34a', fontWeight: 800, cursor: 'pointer' }}>نشر</button>
                  ) : item.status === 'sponsored' ? (
                    <button type="button" onClick={() => setResetConfirm(item._id)} style={{ height: 34, border: 'none', borderRadius: 9, background: '#FEF3C7', color: '#92400e', fontWeight: 800, cursor: 'pointer' }}>إعادة فتح</button>
                  ) : (
                    <button type="button" onClick={() => handleDelete(item._id)} style={{ height: 34, border: 'none', borderRadius: 9, background: deleteConfirm === item._id ? '#dc2626' : '#FEE2E2', color: deleteConfirm === item._id ? 'white' : '#dc2626', fontWeight: 800, cursor: 'pointer' }}>{deleteConfirm === item._id ? 'تأكيد' : 'حذف'}</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {resetConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 18, padding: 24, width: '100%', maxWidth: 380 }}>
            <h3 style={{ marginTop: 0 }}>إعادة فتح الكفالة؟</h3>
            <p style={{ color: MUTED, lineHeight: 1.7 }}>سيتم إنهاء الاشتراك الحالي وإعادة فتح الكفالة لكافل جديد.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setResetConfirm(null)} style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${BORDER}`, background: 'white', cursor: 'pointer' }}>إلغاء</button>
              <button type="button" onClick={() => handleReset(resetConfirm)} style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: 800 }}>تأكيد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
