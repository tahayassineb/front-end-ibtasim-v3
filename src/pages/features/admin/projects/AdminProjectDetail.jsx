import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BORDER = '#E5E9EB';
const PRIMARY = '#0d7477';
const P600 = '#0A5F62';
const TEXT2 = '#64748b';
const TEXTM = '#94a3b8';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_P = '0 4px 14px rgba(13,116,119,.25)';

const getStr = (val, lang = 'ar') => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] || val.ar || val.en || val.fr || '';
};

const STATUS_CFG = {
  active:    { label: '● نشط',   bg: '#D1FAE5', color: '#16a34a' },
  draft:     { label: '○ مسودة',  bg: '#F0F7F7', color: TEXTM },
  completed: { label: '✓ منتهي', bg: '#FEE2E2', color: '#dc2626' },
  paused:    { label: '⏸ موقوف', bg: '#FFFBEB', color: '#92400e' },
};

const DONATION_STATUS = {
  verified:               { label: '✓ مؤكد',  bg: '#D1FAE5', color: '#16a34a' },
  awaiting_verification:  { label: '⏳ انتظار', bg: '#FEF3C7', color: '#b45309' },
  awaiting_receipt:       { label: '⏳ انتظار', bg: '#FEF3C7', color: '#b45309' },
  pending:                { label: '⏳ انتظار', bg: '#FEF3C7', color: '#b45309' },
  rejected:               { label: '✕ مرفوض', bg: '#FEE2E2', color: '#dc2626' },
};

export default function AdminProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';

  // ── Convex ────────────────────────────────────────────────────────────────
  const project          = useQuery(api.projects.getProjectById, id ? { projectId: id } : 'skip');
  const projectDonations = useQuery(api.donations.getDonationsByProject, id ? { projectId: id } : 'skip');
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
      await deleteProjectMutation({ projectId: id });
      navigate('/admin/projects');
    }
  };

  // ── Loading / not-found ────────────────────────────────────────────────────
  if (project === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
          <p style={{ color: TEXTM }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
          <p style={{ color: TEXTM, marginBottom: 16 }}>المشروع غير موجود</p>
          <button onClick={() => navigate('/admin/projects')}
            style={{ height: 40, padding: '0 20px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            ← المشاريع
          </button>
        </div>
      </div>
    );
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const title     = getStr(project.title, lang);
  const goalMAD   = (project.goalAmount || 0) / 100;
  const raisedMAD = (project.raisedAmount || 0) / 100;
  const pct       = goalMAD > 0 ? Math.min(Math.round(raisedMAD / goalMAD * 100), 100) : 0;
  const donorCount = projectDonations?.filter(d => ['verified', 'awaiting_verification'].includes(d.status)).length || 0;
  const avgDonation = donorCount > 0 ? Math.round(raisedMAD / donorCount) : 0;
  const daysLeft = project.endDate
    ? Math.max(0, Math.ceil((project.endDate - Date.now()) / (1000 * 60 * 60 * 24)))
    : '—';
  const imageUrl = convexFileUrl(project.mainImage) || project.mainImage;
  const st = STATUS_CFG[project.status] || STATUS_CFG.draft;

  const ICONS = ['🎓', '💧', '🏥', '🌱', '📚', '🤝', '🕌', '⚡'];
  const icon = ICONS[Math.abs([...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0)) % ICONS.length];

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* ── Action row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>📁 {title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/projects')}
            style={{ height: 38, padding: '0 16px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'white', color: TEXT2 }}>
            ← المشاريع
          </button>
          <button onClick={() => navigate(`/admin/projects/${id}/edit`)}
            style={{ height: 38, padding: '0 18px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_P }}>
            ✏️ تعديل
          </button>
          <button onClick={handleDelete}
            style={{ height: 38, padding: '0 16px', background: '#FEE2E2', color: '#dc2626', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            🗑️ حذف
          </button>
        </div>
      </div>

      {/* ── Project hero card ── */}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden', marginBottom: 20 }}>
        {/* Image or gradient */}
        <div style={{ height: 200, position: 'relative', background: imageUrl ? undefined : 'linear-gradient(135deg,#0A5F62,#33C0C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
          {imageUrl ? (
            <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          ) : (
            <span>{icon}</span>
          )}
          <span style={{ position: 'absolute', top: 16, right: 16, padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>
            {st.label}
          </span>
          {project.isFeatured && (
            <span style={{ position: 'absolute', top: 16, left: 16, padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: '#FEF3C7', color: '#92400e' }}>
              ⭐ مميز
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{title}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: TEXT2, marginBottom: 16, flexWrap: 'wrap' }}>
            {project.location && <span>📍 {project.location}</span>}
            {project.category && <span>🎓 {getStr(project.category, lang)}</span>}
            {project.beneficiaries > 0 && <span>👥 {project.beneficiaries.toLocaleString('fr-MA')} مستفيد</span>}
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: P600, fontFamily: 'Inter, sans-serif' }}>
                {raisedMAD.toLocaleString('fr-MA')}
              </div>
              <div style={{ fontSize: 14, color: TEXTM }}>من {goalMAD.toLocaleString('fr-MA')} درهم</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, background: BORDER, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: PRIMARY, borderRadius: 100, width: `${pct}%`, transition: 'width .4s' }} />
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: P600, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
              {pct}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { num: donorCount.toLocaleString('fr-MA'), label: 'عدد المتبرعين' },
          { num: raisedMAD.toLocaleString('fr-MA'), label: 'درهم محصّل' },
          { num: avgDonation.toLocaleString('fr-MA'), label: 'درهم متوسط التبرع' },
          { num: typeof daysLeft === 'number' ? daysLeft : '—', label: 'يوم متبقي' },
        ].map(({ num, label }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Inter, sans-serif', color: P600 }}>{num}</div>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Recent donations table ── */}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>💰 آخر التبرعات</span>
          <button onClick={() => navigate('/admin/donations')}
            style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            عرض الكل ←
          </button>
        </div>

        {/* Table head */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#F0F7F7', borderBottom: `1px solid ${BORDER}` }}>
          {['المتبرع', 'المبلغ', 'التاريخ', 'الحالة'].map(h => (
            <div key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: TEXTM, fontFamily: 'Inter, sans-serif' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {projectDonations === undefined ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: TEXTM }}>جاري التحميل...</div>
        ) : (projectDonations || []).length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
            <p style={{ color: TEXTM }}>لا توجد تبرعات بعد</p>
          </div>
        ) : (
          projectDonations.slice(0, 10).map((d, i) => {
            const ds = DONATION_STATUS[d.status] || DONATION_STATUS.pending;
            const donorName = d.isAnonymous ? 'مجهول الهوية' : (d.donorName || getStr(d.name, lang) || 'متبرع');
            const amtMAD = ((d.amount || 0) / 100).toLocaleString('fr-MA');
            const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-MA') : '—';
            return (
              <div key={d._id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: i < Math.min(projectDonations.length, 10) - 1 ? `1px solid ${BORDER}` : 'none', alignItems: 'center', background: d.status === 'pending' || d.status === 'awaiting_verification' ? '#FFFBEB' : 'white', borderRight: (d.status === 'pending' || d.status === 'awaiting_verification') ? '4px solid #f59e0b' : '4px solid transparent' }}>
                <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{donorName}</div>
                <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: P600, fontFamily: 'Inter, sans-serif' }}>{amtMAD} د.م</div>
                <div style={{ padding: '12px 16px', fontSize: 13, color: TEXTM, fontFamily: 'Inter, sans-serif' }}>{dateStr}</div>
                <div style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: ds.bg, color: ds.color }}>
                    {ds.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Description ── */}
      {project.description && (
        <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>📄 الوصف</span>
          </div>
          <div style={{ padding: 20, fontSize: 14, lineHeight: 1.8, color: '#334155' }}
            dangerouslySetInnerHTML={{ __html: getStr(project.description, lang) || '' }} />
        </div>
      )}
    </div>
  );
}