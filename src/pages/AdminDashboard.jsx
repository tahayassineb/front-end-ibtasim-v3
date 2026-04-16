import React, { useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';

// ============================================
// ADMIN DASHBOARD PAGE - Connected to Convex
// ============================================

export default function AdminDashboard() {
  const { currentLanguage, showToast } = useApp();
  const navigate = useNavigate();

  const stats = useQuery(api.admin.getDashboardStats);
  const pendingVerifications = useQuery(api.admin.getVerifications, {
    status: 'awaiting_verification',
    limit: 5,
  });
  const featuredProjectsData = useQuery(api.projects.getFeaturedProjects, { limit: 6 });

  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [chartTab, setChartTab] = useState('30');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  React.useEffect(() => {
    if (featuredProjectsData) setFeaturedProjects(featuredProjectsData);
  }, [featuredProjectsData]);

  const updateFeaturedOrder = useMutation(api.projects.updateFeaturedOrder);

  const handleSaveOrder = useCallback(async () => {
    if (!hasOrderChanged) return;
    setIsSavingOrder(true);
    try {
      const projectsWithOrder = featuredProjects.map((p, i) => ({ projectId: p._id, order: i + 1 }));
      await updateFeaturedOrder({ projects: projectsWithOrder });
      showToast('تم حفظ الترتيب', 'success');
      setHasOrderChanged(false);
    } catch {
      showToast('فشل حفظ الترتيب', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  }, [featuredProjects, hasOrderChanged, updateFeaturedOrder, showToast]);

  if (stats === undefined || pendingVerifications === undefined || featuredProjectsData === undefined) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <p style={{ color: '#94a3b8' }}>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newProjects = [...featuredProjects];
    const dragged = newProjects[draggedIndex];
    newProjects.splice(draggedIndex, 1);
    newProjects.splice(index, 0, dragged);
    setFeaturedProjects(newProjects);
    setDraggedIndex(index);
    setHasOrderChanged(true);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj?.[currentLanguage?.code] || obj?.ar || obj?.en || '';
  };

  const totalCollected = stats?.totalDonations
    ? (stats.totalDonations / 100).toLocaleString('fr-MA')
    : '0';

  const kpiCards = [
    { icon: '💰', bg: '#E6F4F4', num: totalCollected, label: 'درهم محصّل إجمالي', trend: 'إجمالي التبرعات', trendColor: '#0A5F62' },
    { icon: '🎯', bg: '#F0FDF4', num: (stats?.donationCount || 0).toLocaleString(), label: 'عدد التبرعات', trend: 'جميع الوضعيات', trendColor: '#64748b' },
    { icon: '🤲', bg: '#FFFBEB', num: stats?.activeKafala || 0, label: 'كفالة نشطة', trend: 'كفالات مفعّلة', trendColor: '#64748b' },
    { icon: '⏳', bg: '#FEF3C7', num: stats?.pendingVerifications || 0, label: 'تحويلات تنتظر التحقق', trend: (stats?.pendingVerifications || 0) > 0 ? 'تحتاج مراجعة' : 'لا شيء في الانتظار', trendColor: (stats?.pendingVerifications || 0) > 0 ? '#f59e0b' : '#22c55e' },
  ];

  const donationData = stats?.monthlyDonations || [];
  const hasChartData = donationData.length >= 2;

  // Chart geometry — computed once from real data
  const CHART_W = 600, CHART_H = 200, PAD_T = 20, PAD_B = 10;
  const maxAmt = hasChartData ? Math.max(...donationData.map(d => d.amount), 1) : 1;
  const chartCoords = hasChartData
    ? donationData.map((d, i) => ({
        x: (i / (donationData.length - 1)) * CHART_W,
        y: PAD_T + (1 - d.amount / maxAmt) * (CHART_H - PAD_T - PAD_B),
        amount: d.amount,
        label: d.label || d.date || `${i + 1}`,
      }))
    : [];
  const chartPolyline = chartCoords.map(p => `${p.x},${p.y}`).join(' ');
  const chartArea = chartCoords.length
    ? `0,${CHART_H} ${chartPolyline} ${CHART_W},${CHART_H}`
    : '';

  // Y-axis grid lines (3 lines at 25%, 50%, 75% of max)
  const yGridLines = hasChartData
    ? [0.75, 0.5, 0.25].map(pct => ({
        y: PAD_T + (1 - pct) * (CHART_H - PAD_T - PAD_B),
        label: ((maxAmt * pct) / 100).toLocaleString('fr-MA'),
      }))
    : [];

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map((c, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.trendColor, display: 'flex', alignItems: 'center', gap: 2 }}>{c.trend}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Inter, sans-serif' }}>{c.num}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Pending */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 24 }}>
        {/* Area chart */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>📈 التبرعات الشهرية (درهم)</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['7', '7 أيام'], ['30', '30 يوم'], ['90', '3 أشهر']].map(([v, label]) => (
                <button key={v} onClick={() => setChartTab(v)}
                  style={{ height: 28, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: chartTab === v ? '#0d7477' : '#F0F7F7', color: chartTab === v ? 'white' : '#64748b', fontFamily: 'Tajawal, sans-serif' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {hasChartData ? (
            <div style={{ position: 'relative' }}>
              {/* Y-axis labels */}
              <div style={{ position: 'relative', width: '100%', height: 200 }}>
                {/* Y-axis value labels (absolute positioned over chart) */}
                {yGridLines.map((g, i) => (
                  <div key={i} style={{ position: 'absolute', right: 0, top: g.y / 200 * 100 + '%', transform: 'translateY(-50%)', fontSize: 10, color: '#94a3b8', fontFamily: 'Inter, sans-serif', backgroundColor: 'white', paddingRight: 4, lineHeight: 1 }}>
                    {g.label}
                  </div>
                ))}
                <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none"
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  onMouseLeave={() => setHoveredPoint(null)}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d7477" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0d7477" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {yGridLines.map((g, i) => (
                    <line key={i} x1="0" y1={g.y} x2={CHART_W} y2={g.y} stroke="#E5E9EB" strokeWidth="1" />
                  ))}
                  {/* Area fill */}
                  <polygon points={chartArea} fill="url(#chartGrad)" />
                  {/* Line */}
                  <polyline points={chartPolyline} fill="none" stroke="#0d7477" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Hover zones + dots */}
                  {chartCoords.map((p, i) => (
                    <g key={i}>
                      {/* invisible hover zone */}
                      <rect
                        x={p.x - CHART_W / chartCoords.length / 2}
                        y={0} width={CHART_W / chartCoords.length} height={CHART_H}
                        fill="transparent"
                        style={{ cursor: 'crosshair' }}
                        onMouseEnter={() => setHoveredPoint(i)}
                      />
                      {/* dot */}
                      <circle cx={p.x} cy={p.y} r={hoveredPoint === i ? 6 : 3.5}
                        fill={hoveredPoint === i ? 'white' : '#0d7477'}
                        stroke="#0d7477" strokeWidth="2.5"
                        style={{ transition: 'r .1s' }} />
                      {/* vertical line when hovered */}
                      {hoveredPoint === i && (
                        <line x1={p.x} y1={0} x2={p.x} y2={CHART_H} stroke="#0d7477" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                      )}
                    </g>
                  ))}
                </svg>
                {/* Floating tooltip */}
                {hoveredPoint !== null && chartCoords[hoveredPoint] && (
                  <div style={{
                    position: 'absolute',
                    left: `${(chartCoords[hoveredPoint].x / CHART_W) * 100}%`,
                    top: `${(chartCoords[hoveredPoint].y / CHART_H) * 100}%`,
                    transform: 'translate(-50%, -120%)',
                    background: '#0A5F62',
                    color: 'white',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,.2)',
                    zIndex: 10,
                  }}>
                    {(chartCoords[hoveredPoint].amount / 100).toLocaleString('fr-MA')} درهم
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, fontFamily: 'Tajawal, sans-serif', marginTop: 2 }}>
                      {chartCoords[hoveredPoint].label}
                    </div>
                    {/* arrow */}
                    <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #0A5F62' }} />
                  </div>
                )}
              </div>
              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
                {chartCoords.filter((_, i) => i === 0 || i === Math.floor(chartCoords.length / 2) || i === chartCoords.length - 1).map((p, i) => (
                  <span key={i}>{p.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>لا توجد بيانات بعد</div>
              <div style={{ fontSize: 12 }}>ستظهر الإحصائيات عند استلام أول تبرع</div>
            </div>
          )}
        </div>

        {/* Pending queue */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>⏳ تنتظر التحقق</div>
            <div style={{ background: '#FEF3C7', color: '#b45309', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 100 }}>
              {stats?.pendingVerifications || 0} تحويلات
            </div>
          </div>
          {(pendingVerifications || []).slice(0, 3).map((d, i) => (
            <div key={d._id || i} style={{ padding: '12px 20px', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', gap: 12, borderRight: '4px solid #f59e0b', background: '#FFFBEB' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.user?.fullName || d.donorName || 'متبرع'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {getLocalizedText(d.project?.title) || 'مشروع'} · منذ {Math.floor((Date.now() - (d._creationTime || Date.now())) / 3600000)} ساعة
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                {((d.amount || 0) / 100).toLocaleString('fr-MA')}
              </div>
              <Link to={`/admin/verifications`}
                style={{ height: 28, padding: '0 12px', border: '1.5px solid #0d7477', color: '#0d7477', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, fontFamily: 'Tajawal, sans-serif' }}>
                راجع
              </Link>
            </div>
          ))}
          {(!pendingVerifications || pendingVerifications.length === 0) && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              لا توجد تحويلات في الانتظار 🎉
            </div>
          )}
          <div style={{ padding: '12px 20px', textAlign: 'center' }}>
            <Link to="/admin/verifications" style={{ fontSize: 13, color: '#0d7477', fontWeight: 600, textDecoration: 'none' }}>
              عرض كل التحقيقات ({stats?.pendingVerifications || 0}) ←
            </Link>
          </div>
        </div>
      </div>

      {/* Lower row: Projects + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Active projects */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>📁 المشاريع النشطة</div>
            <Link to="/admin/projects" style={{ fontSize: 12, color: '#0d7477', fontWeight: 600, textDecoration: 'none' }}>عرض الكل ←</Link>
          </div>
          {(featuredProjects || []).slice(0, 3).map((p, i) => {
            const pct = p.goalAmount ? Math.round((p.raisedAmount || 0) / p.goalAmount * 100) : 0;
            const icons = ['🎓', '💧', '🏥', '🌱', '📚', '🤝'];
            return (
              <div key={p._id || i} style={{ padding: '12px 20px', borderBottom: i < 2 ? '1px solid #E5E9EB' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0A5F62,#33C0C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {icons[i % icons.length]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{getLocalizedText(p.title)}</div>
                  <div style={{ height: 4, background: '#E5E9EB', borderRadius: 100, marginTop: 6 }}>
                    <div style={{ height: '100%', borderRadius: 100, background: '#0d7477', width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0A5F62', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{pct}%</div>
              </div>
            );
          })}
          {(!featuredProjects || featuredProjects.length === 0) && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>لا توجد مشاريع نشطة</div>
          )}
        </div>

        {/* Recent donations */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>💰 آخر التبرعات</div>
            <Link to="/admin/donations" style={{ fontSize: 12, color: '#0d7477', fontWeight: 600, textDecoration: 'none' }}>عرض الكل ←</Link>
          </div>
          {(pendingVerifications && pendingVerifications.length > 0) ? (
            <div style={{ padding: '0 20px' }}>
              {pendingVerifications.slice(0, 4).map((d, i, arr) => (
                <div key={d._id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #E5E9EB' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⏳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.user?.fullName || d.donorName || 'متبرع'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{getLocalizedText(d.project?.title) || 'مشروع'}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                      {((d.amount || 0) / 100).toLocaleString('fr-MA')} <span style={{ fontSize: 10, fontWeight: 500 }}>د.م</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>في الانتظار</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>لا توجد تبرعات بعد</div>
              <div style={{ fontSize: 12 }}>ستظهر التبرعات الجديدة هنا فور وصولها</div>
            </div>
          )}
        </div>
      </div>

      {/* Featured Projects drag-drop section */}
      {featuredProjects.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>📌 المشاريع المميزة</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>اسحب لإعادة الترتيب</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {hasOrderChanged && (
                <button onClick={handleSaveOrder} disabled={isSavingOrder}
                  style={{ height: 32, padding: '0 14px', background: '#0d7477', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {isSavingOrder ? '...' : 'حفظ الترتيب'}
                </button>
              )}
              <Link to="/admin/projects"
                style={{ height: 32, padding: '0 14px', background: '#E6F4F4', color: '#0d7477', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', textDecoration: 'none', fontFamily: 'Tajawal, sans-serif' }}>
                إدارة المشاريع
              </Link>
            </div>
          </div>
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {featuredProjects.map((p, i) => (
              <div key={p._id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{ borderRadius: 14, overflow: 'hidden', background: '#f6f8f8', aspectRatio: '16/9', position: 'relative', cursor: 'move', opacity: draggedIndex === i ? 0.5 : 1, border: draggedIndex === i ? '2px solid #0d7477' : '2px solid transparent' }}>
                <img src={convexFileUrl(p.mainImage) || p.mainImage || ''} alt={getLocalizedText(p.title)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, background: '#0d7477', color: 'white', display: 'inline-block', padding: '2px 8px', borderRadius: 100, marginBottom: 4 }}>#{i + 1}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{getLocalizedText(p.title)}</div>
                </div>
              </div>
            ))}
            {featuredProjects.length < 6 && (
              <button onClick={() => navigate('/admin/projects')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, border: '2px dashed #E5E9EB', background: 'none', aspectRatio: '16/9', cursor: 'pointer', color: '#94a3b8', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>
                <span style={{ fontSize: 24 }}>+</span>
                إضافة مشروع مميز
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
