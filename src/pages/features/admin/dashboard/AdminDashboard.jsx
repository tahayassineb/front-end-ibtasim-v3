import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';
import { formatMAD } from '../../../../lib/money';

const BORDER = '#E5E9EB';
const PRIMARY = '#0d7477';
const TEXT = '#0e1a1b';
const MUTED = '#64748b';
const SHADOW = '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)';

const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const endOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();

const presets = [
  { id: 'today', label: 'اليوم' },
  { id: 'yesterday', label: 'أمس' },
  { id: '7', label: 'آخر 7 أيام' },
  { id: '30', label: 'آخر 30 يوم' },
  { id: 'lifetime', label: 'مدى الحياة' },
  { id: 'custom', label: 'فترة مخصصة' },
];

const getPresetRange = (preset, customStart, customEnd) => {
  const now = new Date();
  if (preset === 'lifetime') return {};
  if (preset === 'today') return { startDate: startOfLocalDay(now), endDate: endOfLocalDay(now) };
  if (preset === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { startDate: startOfLocalDay(yesterday), endDate: endOfLocalDay(yesterday) };
  }
  if (preset === '7' || preset === '30') {
    const start = new Date(now);
    start.setDate(now.getDate() - Number(preset) + 1);
    return { startDate: startOfLocalDay(start), endDate: endOfLocalDay(now) };
  }
  if (preset === 'custom') {
    const range = {};
    if (customStart) range.startDate = startOfLocalDay(new Date(customStart));
    if (customEnd) range.endDate = endOfLocalDay(new Date(customEnd));
    return range;
  }
  return {};
};

const StatCard = ({ icon, label, value, hint, tone = PRIMARY }) => (
  <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${tone}18`, color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      {hint && <div style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>{hint}</div>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Inter, sans-serif', color: TEXT }}>{value}</div>
    <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{label}</div>
  </div>
);

const ChartPanel = ({ title, data, color, type = 'area' }) => {
  const chartData = (data || []).map((row) => ({
    ...row,
    amountMAD: Math.round(row.amount || 0),
  }));

  return (
    <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 20, minHeight: 320 }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 18 }}>{title}</div>
      {chartData.length === 0 ? (
        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          لا توجد بيانات في هذه الفترة
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          {type === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value.toLocaleString('fr-MA')} درهم`, 'المبلغ']} />
              <Bar dataKey="amountMAD" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value.toLocaleString('fr-MA')} درهم`, 'المبلغ']} />
              <Area type="monotone" dataKey="amountMAD" stroke={color} fill={color} fillOpacity={0.18} strokeWidth={2.5} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const { currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const [preset, setPreset] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range = useMemo(() => getPresetRange(preset, customStart, customEnd), [preset, customStart, customEnd]);
  const stats = useQuery(api.admin.getDashboardStats, range);
  const pendingVerifications = useQuery(api.admin.getVerifications, { status: 'awaiting_verification', limit: 5 });
  const featuredProjectsData = useQuery(api.projects.getFeaturedProjects, { limit: 4 });

  if (stats === undefined || pendingVerifications === undefined || featuredProjectsData === undefined) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-arabic)', color: '#94a3b8' }}>
        جاري تحميل البيانات...
      </div>
    );
  }

  const projectStats = stats.projectStats || {};
  const kafalaStats = stats.kafalaStats || {};
  const contactStats = stats.contactStats || {};
  const pendingTotal = (projectStats.pendingVerifications || 0) + (kafalaStats.pendingVerifications || 0);

  const getText = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.ar || value.fr || value.en || '';
  };

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: TEXT, padding: 24 }} dir="rtl">
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginLeft: 6 }}>الفترة:</div>
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            style={{ height: 34, padding: '0 14px', borderRadius: 100, border: `1.5px solid ${preset === item.id ? PRIMARY : BORDER}`, background: preset === item.id ? PRIMARY : 'white', color: preset === item.id ? 'white' : MUTED, cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontWeight: 700 }}
          >
            {item.label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} style={{ height: 36, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '0 10px' }} />
            <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} style={{ height: 36, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '0 10px' }} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="د.م" label="محصل من المشاريع" value={formatMAD(projectStats.collected || 0, lang)} hint="مؤكد" />
        <StatCard icon="#" label="تبرعات المشاريع" value={(projectStats.donationCount || 0).toLocaleString('fr-MA')} hint="داخل الفترة" />
        <StatCard icon="🤲" label="كفالات نشطة" value={(kafalaStats.activeSponsorships || 0).toLocaleString('fr-MA')} tone="#8B6914" />
        <StatCard icon="!" label="تحتاج مراجعة" value={pendingTotal.toLocaleString('fr-MA')} hint="حالي" tone="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="💰" label="محصل من الكفالة" value={formatMAD(kafalaStats.collected || 0, lang)} tone="#8B6914" />
        <StatCard icon="👤" label="بدون كافل" value={(kafalaStats.availableKafala || 0).toLocaleString('fr-MA')} tone="#8B6914" />
        <StatCard icon="⏳" label="ينتظرون الكفالة" value={(kafalaStats.waitingPublished || 0).toLocaleString('fr-MA')} tone="#8B6914" />
        <StatCard icon="✉" label="رسائل جديدة" value={(contactStats.newCount || 0).toLocaleString('fr-MA')} hint="تواصل" tone="#2563eb" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginBottom: 20 }}>
        <ChartPanel title="إحصائيات تبرعات المشاريع" data={stats.series?.donations || []} color={PRIMARY} />
        <ChartPanel title="إحصائيات تحصيل الكفالة" data={stats.series?.kafala || []} color="#8B6914" type="bar" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
          <div style={{ padding: 18, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>المشاريع المميزة في الرئيسية</div>
            <Link to="/admin/projects" style={{ color: PRIMARY, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>إدارة المشاريع</Link>
          </div>
          {featuredProjectsData.length === 0 ? (
            <div style={{ padding: 24, color: '#94a3b8', textAlign: 'center' }}>لا توجد مشاريع مميزة</div>
          ) : featuredProjectsData.map((project) => {
            const pct = project.goalAmount ? Math.min(Math.round((project.raisedAmount || 0) / project.goalAmount * 100), 100) : 0;
            const imageUrl = convexFileUrl(project.mainImage) || project.mainImage;
            return (
              <div key={project._id} style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: '#E6F4F4', overflow: 'hidden', flexShrink: 0 }}>
                  {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getText(project.title)}</div>
                  <div style={{ height: 6, background: '#E5E9EB', borderRadius: 99, marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: PRIMARY, borderRadius: 99 }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, color: PRIMARY }}>{pct}%</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>تنتظر التحقق</div>
              <Link to="/admin/verification" style={{ color: PRIMARY, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>عرض الكل</Link>
            </div>
            {(pendingVerifications || []).slice(0, 3).map((donation) => (
              <Link key={donation._id} to="/admin/verification" style={{ padding: 14, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', gap: 12, textDecoration: 'none', color: TEXT }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{donation.user?.fullName || donation.donorName || 'متبرع'}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{getText(donation.project?.title) || 'مشروع'}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: PRIMARY }}>{formatMAD(donation.amount || 0, lang)}</div>
              </Link>
            ))}
            {(!pendingVerifications || pendingVerifications.length === 0) && <div style={{ padding: 22, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>لا توجد تحويلات في الانتظار</div>}
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>رسائل جديدة</div>
              <Link to="/admin/contacts" style={{ color: PRIMARY, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>فتح الرسائل</Link>
            </div>
            {(contactStats.recentNew || []).map((message) => (
              <Link key={message._id} to="/admin/contacts" style={{ padding: 14, borderBottom: `1px solid ${BORDER}`, display: 'block', textDecoration: 'none', color: TEXT }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{message.name}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{message.subject || message.phone || message.email || 'رسالة تواصل'}</div>
              </Link>
            ))}
            {(!contactStats.recentNew || contactStats.recentNew.length === 0) && <div style={{ padding: 22, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>لا توجد رسائل جديدة</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
