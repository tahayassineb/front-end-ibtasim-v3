import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BORDER = '#E5E9EB';
const TEXT2  = '#64748b';
const TEXTM  = '#94a3b8';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';

const LEVEL_CFG = {
  error:   { label: 'ERROR', badge_bg: '#FEE2E2', badge_c: '#ef4444', row_bg: '#FEF2F2', border: '#ef4444', pill_bg: '#FEF2F2', pill_border: '#FEE2E2', pill_c: '#ef4444' },
  warning: { label: 'WARN',  badge_bg: '#FEF3C7', badge_c: '#92400e', row_bg: '#FFFBEB', border: '#f59e0b', pill_bg: '#FFFBEB', pill_border: '#FEF3C7', pill_c: '#92400e' },
  info:    { label: 'INFO',  badge_bg: '#E6F4F4', badge_c: '#0A5F62', row_bg: 'white',   border: '#33C0C0', pill_bg: '#E6F4F4', pill_border: '#CCF0F0', pill_c: '#0A5F62' },
};

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return { date: d.toLocaleDateString('fr-MA'), time: d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
};

export default function AdminErrorLogs() {
  const { showToast } = useApp();

  const [levelFilter, setLevelFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // ── Convex ────────────────────────────────────────────────────────────────
  const logs = useQuery(api.errorLogs.getErrorLogs, {
    limit: 200,
    source: sourceFilter || undefined,
    level: levelFilter || undefined,
  });
  const deleteLog = useMutation(api.errorLogs.deleteErrorLog);
  const clearAll  = useMutation(api.errorLogs.clearAllErrorLogs);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = async (logId) => {
    try {
      await deleteLog({ logId });
      if (expandedId === logId) setExpandedId(null);
    } catch { showToast('فشل حذف السجل', 'error'); }
  };

  const handleClearAll = async () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 5000);
      return;
    }
    try {
      const count = await clearAll({});
      showToast(`تم مسح ${count} سجل`, 'success');
      setClearConfirm(false);
    } catch { showToast('فشل مسح السجلات', 'error'); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const allLogs = logs || [];

  const filtered = allLogs.filter(l => {
    if (search && !l.message?.toLowerCase().includes(search.toLowerCase()) &&
        !l.source?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const errorCount   = allLogs.filter(l => l.level === 'error').length;
  const warnCount    = allLogs.filter(l => l.level === 'warning' || l.level === 'warn').length;
  const infoCount    = allLogs.filter(l => l.level === 'info').length;

  // Unique sources for filter
  const sources = [...new Set(allLogs.map(l => l.source).filter(Boolean))];

  if (logs === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔴</div>
          <p style={{ color: TEXTM }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* ── Summary pills ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { num: errorCount, label: 'أخطاء حرجة', ...LEVEL_CFG.error },
          { num: warnCount, label: 'تحذيرات',    ...LEVEL_CFG.warning },
          { num: infoCount, label: 'معلومات',    ...LEVEL_CFG.info },
        ].map(({ num, label, pill_bg, pill_border, pill_c }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: pill_bg, border: `1px solid ${pill_border}`, color: pill_c }}>
            <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Inter, sans-serif' }}>{num}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث في السجل..."
          style={{ flex: 1, minWidth: 200, height: 36, padding: '0 14px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'Tajawal, sans-serif', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#0d7477'}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
        {[
          { val: '', label: `الكل (${allLogs.length})`, activeBg: '#0d7477', activeC: 'white' },
          { val: 'error',   label: `🔴 أخطاء (${errorCount})`, activeBg: '#FEE2E2', activeC: '#ef4444' },
          { val: 'warning', label: `🟡 تحذيرات (${warnCount})`, activeBg: '#FEF3C7', activeC: '#92400e' },
          { val: 'info',    label: '🔵 معلومات',               activeBg: '#E6F4F4', activeC: '#0A5F62' },
        ].map(({ val, label, activeBg, activeC }) => {
          const active = levelFilter === val;
          return (
            <button key={val} onClick={() => setLevelFilter(val)}
              style={{ height: 32, padding: '0 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${active ? activeC : BORDER}`, background: active ? activeBg : 'white', color: active ? activeC : TEXT2, fontFamily: 'Tajawal, sans-serif' }}>
              {label}
            </button>
          );
        })}
        {sources.length > 0 && (
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
            style={{ height: 32, border: `1.5px solid ${BORDER}`, borderRadius: 100, padding: '0 12px', fontSize: 12, fontFamily: 'Tajawal, sans-serif', outline: 'none', cursor: 'pointer' }}>
            <option value="">جميع المصادر</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button onClick={handleClearAll}
          style={{ height: 32, padding: '0 14px', border: `1.5px solid ${clearConfirm ? '#ef4444' : BORDER}`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: clearConfirm ? '#ef4444' : 'white', color: clearConfirm ? 'white' : TEXT2, marginRight: 'auto', transition: 'all .2s' }}>
          {clearConfirm ? '⚠ تأكيد المسح' : '🗑 مسح السجل'}
        </button>
      </div>

      {/* ── Log entries card ── */}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: TEXTM }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p>لا توجد أخطاء مسجلة</p>
          </div>
        ) : (
          filtered.map((log, i) => {
            const level = log.level?.toLowerCase() === 'warn' ? 'warning' : (log.level?.toLowerCase() || 'info');
            const cfg = LEVEL_CFG[level] || LEVEL_CFG.info;
            const isExpanded = expandedId === log._id;
            const dt = formatDate(log.createdAt || log._creationTime);

            return (
              <div key={log._id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                {/* Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log._id)}
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, background: cfg.row_bg, borderRight: `4px solid ${cfg.border}`, cursor: 'pointer', transition: 'filter .1s' }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.97)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  {/* Level badge */}
                  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', background: cfg.badge_bg, color: cfg.badge_c }}>
                    {cfg.label}
                  </span>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXTM, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>
                      {log.source || '—'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{log.message}</div>
                    {log.apiUrl && (
                      <div style={{ fontSize: 12, color: TEXT2, fontFamily: 'Inter, sans-serif', background: '#f6f8f8', padding: '6px 10px', borderRadius: 8, marginTop: 6, wordBreak: 'break-all' }}>
                        {log.apiUrl}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: TEXTM, fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
                      {log.apiStatus && <span>📌 HTTP {log.apiStatus}</span>}
                      {log.source    && <span>⚡ {log.source}</span>}
                    </div>
                  </div>

                  {/* Time + delete */}
                  <div style={{ flexShrink: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: 11, color: TEXTM, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                      {dt.time && <div>{dt.time}</div>}
                      {dt.date && <div>{dt.date}</div>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(log._id); }}
                      style={{ height: 24, padding: '0 8px', border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'white', color: TEXT2 }}>
                      حذف
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (log.apiResponse || log.details || log.stack) && (
                  <div style={{ padding: '14px 20px 14px 54px', background: '#fafbfc', borderTop: `1px solid ${BORDER}` }}>
                    <pre style={{ background: '#0e1a1b', color: '#33C0C0', borderRadius: 10, padding: 14, fontSize: 12, fontFamily: 'Inter, monospace', overflowX: 'auto', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(log.apiResponse || log.details || log.stack, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
