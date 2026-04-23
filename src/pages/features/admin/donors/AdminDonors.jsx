import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BORDER = '#E5E9EB';
const PRIMARY = '#0d7477';
const P600 = '#0A5F62';
const TEXT2 = '#64748b';
const TEXTM = '#94a3b8';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_P = '0 4px 14px rgba(13,116,119,.25)';

// Tier thresholds (amounts stored as centimes ×100)
const getTier = (totalDonated, donationCount) => {
  if (totalDonated >= 500000) return 'gold';   // ≥ 5000 MAD
  if (totalDonated >= 100000) return 'silver';  // ≥ 1000 MAD
  if (donationCount <= 1 && totalDonated < 50000) return 'new'; // first donation
  return 'bronze';
};

const TIER_CFG = {
  gold:   { label: '🥇 ذهبي',  bg: '#FEF3C7', color: '#92400e' },
  silver: { label: '🥈 فضي',   bg: '#F1F5F9', color: '#475569' },
  bronze: { label: '🥉 برونزي', bg: '#FFF7ED', color: '#9a3412' },
  new:    { label: '✨ جديد',  bg: '#E6F4F4', color: P600 },
};

const PER_PAGE = 10;

const initials = (name) => {
  if (!name) return '؟';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
};

const AVATAR_GRADS = [
  'linear-gradient(135deg,#0A5F62,#33C0C0)',
  'linear-gradient(135deg,#0d7477,#0A5F62)',
  'linear-gradient(135deg,#374151,#6B7280)',
  'linear-gradient(135deg,#8B6914,#C4A882)',
  'linear-gradient(135deg,#1e40af,#3b82f6)',
];

export default function AdminDonors() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Convex ────────────────────────────────────────────────────────────────
  const donorsData = useQuery(api.admin.getDonors, { search: search || undefined, limit: 200 });
  const donors = donorsData?.donors ?? [];

  // ── Derived ───────────────────────────────────────────────────────────────
  const enriched = donors.map((d, i) => ({
    ...d,
    tier: getTier(d.totalDonated, d.donationCount),
    avatarGrad: AVATAR_GRADS[i % AVATAR_GRADS.length],
    totalMAD: (d.totalDonated || 0) / 100,
  }));

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const goldCount   = enriched.filter(d => d.tier === 'gold').length;
  const newCount    = enriched.filter(d => now - (d.lastLoginAt || 0) < thirtyDays).length;

  const filtered = enriched.filter(d => {
    if (tierFilter !== 'all' && d.tier !== tierFilter) return false;
    return true; // search is handled server-side
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { num: enriched.length.toLocaleString('fr-MA'), label: 'إجمالي المتبرعين', color: P600 },
          { num: `🥇 ${goldCount}`, label: 'متبرعون ذهبيون (+5,000 د.م)', color: '#92400e' },
          { num: enriched.filter(d => d.tier === 'silver').length, label: 'متبرعون فضيون', color: '#475569' },
          { num: newCount, label: 'متبرع جديد هذا الشهر', color: P600 },
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
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          style={{ flex: 1, minWidth: 200, height: 38, padding: '0 16px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-arabic)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = PRIMARY}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
        {[
          ['all', 'الكل'],
          ['gold', '🥇 ذهبي'],
          ['silver', '🥈 فضي'],
          ['bronze', '🥉 برونزي'],
          ['new', '✨ جديد'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => { setTierFilter(val); setCurrentPage(1); }}
            style={{ height: 34, padding: '0 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${tierFilter === val ? PRIMARY : BORDER}`, background: tierFilter === val ? PRIMARY : 'white', color: tierFilter === val ? 'white' : TEXT2, fontFamily: 'var(--font-arabic)' }}>
            {label}
          </button>
        ))}
        <button
          onClick={() => showToast('تصدير CSV — قريباً', 'info')}
          style={{ height: 38, padding: '0 16px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-arabic)', background: 'white', color: TEXT2, marginRight: 'auto' }}>
          📋 تصدير CSV
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 80px', background: '#F0F7F7', borderBottom: `1px solid ${BORDER}` }}>
          {['المتبرع', 'إجمالي التبرعات', 'عدد التبرعات', 'آخر نشاط', 'التصنيف', 'ملف'].map(h => (
            <div key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: TEXTM, fontFamily: 'Inter, sans-serif' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {donorsData === undefined ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: TEXTM }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <p>جاري التحميل...</p>
          </div>
        ) : page.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: TEXTM }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p>لا يوجد متبرعون</p>
          </div>
        ) : page.map((d, i) => {
          const tier = TIER_CFG[d.tier] || TIER_CFG.new;
          const lastDate = d.lastLoginAt ? new Date(d.lastLoginAt).toLocaleDateString('fr-MA') : '—';
          return (
            <div key={d._id}
              style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 80px', borderBottom: i < page.length - 1 ? `1px solid ${BORDER}` : 'none', alignItems: 'center', background: i % 2 === 1 ? '#fafbfc' : 'white', transition: 'background .15s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = '#E6F4F4'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? '#fafbfc' : 'white'}
            >
              {/* Donor cell */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: d.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                  {initials(d.fullName)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{d.fullName}</div>
                  <div style={{ fontSize: 11, color: TEXTM, fontFamily: 'Inter, sans-serif' }}>{d.phoneNumber || d.email}</div>
                </div>
              </div>

              {/* Total */}
              <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: P600, fontFamily: 'Inter, sans-serif' }}>
                {d.totalMAD.toLocaleString('fr-MA')} د.م
              </div>

              {/* Count */}
              <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                {d.donationCount}
              </div>

              {/* Last active */}
              <div style={{ padding: '12px 16px', fontSize: 13, color: TEXTM, fontFamily: 'Inter, sans-serif' }}>
                {lastDate}
              </div>

              {/* Tier badge */}
              <div style={{ padding: '12px 16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: tier.bg, color: tier.color }}>
                  {tier.label}
                </span>
              </div>

              {/* View button */}
              <div style={{ padding: '12px 16px' }}>
                <button onClick={() => navigate(`/admin/donors/${d._id}`)}
                  style={{ height: 28, padding: '0 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-arabic)', color: TEXT2 }}>
                  عرض
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: TEXT2 }}>
        <span>عرض {filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} من {filtered.length.toLocaleString('fr-MA')} متبرع</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ height: 32, padding: '0 12px', border: `1px solid ${BORDER}`, borderRadius: 8, background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontSize: 13 }}>
            ‹ السابق
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setCurrentPage(n)}
              style={{ height: 32, width: 32, border: `1px solid ${currentPage === n ? PRIMARY : BORDER}`, borderRadius: 8, background: currentPage === n ? PRIMARY : 'white', color: currentPage === n ? 'white' : 'inherit', cursor: 'pointer', fontWeight: currentPage === n ? 700 : 400, fontSize: 13 }}>
              {n}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            style={{ height: 32, padding: '0 12px', border: `1px solid ${BORDER}`, borderRadius: 8, background: 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1, fontSize: 13 }}>
            التالي ›
          </button>
        </div>
      </div>
    </div>
  );
}