import React from 'react';
import { BORDER, PRIMARY, TEXT2, SHADOW, SHADOW_P } from './tokens';

export const SettingsCard = ({ icon, title, children }) => (
  <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden', marginBottom: 16 }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span><span>{title}</span>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

export const FieldLabel = ({ children }) => (
  <label style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7, display: 'block' }}>{children}</label>
);

export const SaveBtn = ({ onClick, loading, children, fullWidth }) => (
  <button onClick={onClick} disabled={loading}
    style={{ height: 44, padding: '0 28px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: SHADOW_P, opacity: loading ? 0.7 : 1, width: fullWidth ? '100%' : 'auto' }}>
    {loading ? 'جاري الحفظ...' : children}
  </button>
);

export const ToggleRow = ({ title, desc, value, onChange, isLast }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: isLast ? 'none' : `1px solid ${BORDER}` }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{desc}</div>}
    </div>
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, background: value ? PRIMARY : BORDER, borderRadius: 100, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: value ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
    </div>
  </div>
);
