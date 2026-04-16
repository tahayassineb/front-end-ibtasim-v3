import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BORDER = '#E5E9EB';
const PRIMARY = '#0d7477';
const P600 = '#0A5F62';
const TEXT2 = '#64748b';
const TEXTM = '#94a3b8';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_P = '0 4px 14px rgba(13,116,119,.25)';

const getTier = (totalDonated, donationCount) => {
  if (totalDonated >= 500000) return 'gold';
  if (totalDonated >= 100000) return 'silver';
  if (donationCount <= 1 && totalDonated < 50000) return 'new';
  return 'bronze';
};

const TIER_CFG = {
  gold:   { label: '🥇 متبرع ذهبي',  bg: '#FEF3C7', color: '#92400e' },
  silver: { label: '🥈 متبرع فضي',   bg: '#F1F5F9', color: '#475569' },
  bronze: { label: '🥉 متبرع برونزي', bg: '#FFF7ED', color: '#9a3412' },
  new:    { label: '✨ متبرع جديد',  bg: '#E6F4F4', color: P600 },
};

const DONATION_STATUS = {
  verified:              { label: '✓ مؤكد',   bg: '#D1FAE5', color: '#16a34a' },
  awaiting_verification: { label: '⏳ انتظار', bg: '#FEF3C7', color: '#b45309' },
  awaiting_receipt:      { label: '⏳ انتظار', bg: '#FEF3C7', color: '#b45309' },
  pending:               { label: '⏳ انتظار', bg: '#FEF3C7', color: '#b45309' },
  rejected:              { label: '✕ مرفوض', bg: '#FEE2E2', color: '#dc2626' },
};

const initials = (name) => {
  if (!name) return '؟';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
};

const Section = ({ children, style }) => (
  <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden', ...style }}>
    {children}
  </div>
);

export default function AdminDonorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('donations');

  // ── Convex ────────────────────────────────────────────────────────────────
  const donorData = useQuery(api.admin.getDonorById, { userId: id });

  if (donorData === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <p style={{ color: TEXTM }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!donorData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
          <p style={{ color: TEXTM, marginBottom: 16 }}>المتبرع غير موجود</p>
          <button onClick={() => navigate('/admin/donors')}
            style={{ height: 40, padding: '0 20px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            ← المتبرعون
          </button>
        </div>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const tier = getTier(donorData.totalDonated, donorData.donationCount);
  const tierCfg = TIER_CFG[tier];
  const totalMAD = (donorData.totalDonated || 0) / 100;
  const memberSince = donorData.createdAt
    ? new Date(donorData.createdAt).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long' })
    : '—';
  const donations = donorData.donations || [];

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* ── Action row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>👥 {donorData.fullName}</div>
        <button onClick={() => navigate('/admin/donors')}
          style={{ height: 38, padding: '0 16px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'white', color: TEXT2 }}>
          ← قائمة المتبرعين
        </button>
      </div>

      {/* ── Profile hero ── */}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 24, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5F62,#33C0C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: 'white', flexShrink: 0 }}>
          {initials(donorData.fullName)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{donorData.fullName}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: tierCfg.bg, color: tierCfg.color }}>
              {tierCfg.label}
            </span>
          </div>
          <div style={{ fontSize: 14, color: TEXT2, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {donorData.phoneNumber && <span>📞 {donorData.phoneNumber}</span>}
            <span>📅 عضو منذ: {memberSince}</span>
            {donorData.isVerified && <span style={{ color: '#16a34a' }}>✓ موثّق</span>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Inter, sans-serif', color: P600 }}>{totalMAD.toLocaleString('fr-MA')}</div>
            <div style={{ fontSize: 12, color: TEXT2 }}>درهم إجمالي</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Inter, sans-serif', color: P600 }}>{donorData.donationCount}</div>
            <div style={{ fontSize: 12, color: TEXT2 }}>تبرع</div>
          </div>
        </div>
      </div>

      {/* ── 2-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

        {/* ── Main: donation history ── */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {[
              { key: 'donations', label: `💰 التبرعات (${donations.length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ height: 36, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: `1px solid ${activeTab === key ? PRIMARY : BORDER}`, background: activeTab === key ? PRIMARY : 'white', color: activeTab === key ? 'white' : TEXT2 }}>
                {label}
              </button>
            ))}
          </div>

          <Section>
            {/* Table head */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: '#F0F7F7', borderBottom: `1px solid ${BORDER}` }}>
              {['المشروع', 'المبلغ', 'التاريخ', 'الحالة'].map(h => (
                <div key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: TEXTM, fontFamily: 'Inter, sans-serif' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {donations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: TEXTM }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
                <p>لا توجد تبرعات بعد</p>
              </div>
            ) : donations.map((d, i) => {
              const ds = DONATION_STATUS[d.status] || DONATION_STATUS.pending;
              const amtMAD = ((d.amount || 0) / 100).toLocaleString('fr-MA');
              const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-MA') : '—';
              const isPend = d.status === 'pending' || d.status === 'awaiting_verification';
              return (
                <div key={d._id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: i < donations.length - 1 ? `1px solid ${BORDER}` : 'none', alignItems: 'center', background: i % 2 === 1 ? '#fafbfc' : 'white', borderRight: isPend ? '4px solid #f59e0b' : '4px solid transparent' }}>
                  <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{d.projectTitle || '—'}</div>
                  <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: P600, fontFamily: 'Inter, sans-serif' }}>{amtMAD} د.م</div>
                  <div style={{ padding: '12px 16px', fontSize: 13, color: TEXTM, fontFamily: 'Inter, sans-serif' }}>{dateStr}</div>
                  <div style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: ds.bg, color: ds.color }}>
                      {ds.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </Section>
        </div>

        {/* ── Sidebar ── */}
        <div>
          {/* Contact info */}
          <Section style={{ marginBottom: 16 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>📞 معلومات التواصل</span>
            </div>
            <div style={{ padding: '4px 20px 8px' }}>
              {[
                { label: 'الهاتف', value: donorData.phoneNumber || '—', inter: true },
                { label: 'البريد الإلكتروني', value: donorData.email || '—', inter: true },
                { label: 'إشعارات واتساب', value: donorData.notificationsEnabled ? '● مفعّل' : '○ معطّل', color: donorData.notificationsEnabled ? '#16a34a' : TEXTM },
                { label: 'اللغة المفضلة', value: donorData.preferredLanguage === 'ar' ? '🇲🇦 عربية' : donorData.preferredLanguage === 'fr' ? '🇫🇷 فرنسية' : '🌐 ' + (donorData.preferredLanguage || '—') },
              ].map(({ label, value, inter, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 12, color: TEXTM }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: inter ? 'Inter, sans-serif' : undefined, color: color || '#0e1a1b' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* WhatsApp button */}
            <div style={{ padding: '0 20px 20px' }}>
              <button
                onClick={() => {
                  const phone = (donorData.phoneNumber || '').replace(/\D/g, '');
                  if (phone) { window.open(`https://wa.me/${phone}`, '_blank'); }
                  else { showToast('لا يوجد رقم هاتف', 'error'); }
                }}
                style={{ width: '100%', height: 40, background: '#25D366', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                💬 إرسال رسالة واتساب
              </button>
            </div>
          </Section>

          {/* Stats summary */}
          <Section>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>📊 ملخص التبرعات</span>
            </div>
            <div style={{ padding: '4px 20px 16px' }}>
              {[
                { label: 'إجمالي التبرعات', value: totalMAD.toLocaleString('fr-MA') + ' د.م', inter: true, bold: true, color: P600 },
                { label: 'عدد التبرعات', value: donorData.donationCount, inter: true },
                { label: 'متوسط التبرع', value: donorData.donationCount > 0 ? Math.round(totalMAD / donorData.donationCount).toLocaleString('fr-MA') + ' د.م' : '—', inter: true },
                { label: 'آخر نشاط', value: donorData.lastLoginAt ? new Date(donorData.lastLoginAt).toLocaleDateString('fr-MA') : '—', inter: true },
              ].map(({ label, value, inter, bold, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 12, color: TEXTM }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, fontFamily: inter ? 'Inter, sans-serif' : undefined, color: color || '#0e1a1b' }}>{value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}