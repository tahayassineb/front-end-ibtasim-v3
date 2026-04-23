// ─── Design tokens ────────────────────────────────────────────────────────────
export const BORDER    = '#E5E9EB';
export const PRIMARY   = '#0d7477';
export const P600      = '#0A5F62';
export const P100      = '#CCF0F0';
export const P400      = '#33C0C0';
export const TEXT2     = '#64748b';
export const TEXTM     = '#94a3b8';
export const SHADOW    = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
export const SHADOW_P  = '0 4px 14px rgba(13,116,119,.25)';
export const TEAL_WASH = '#F0F7F7';

export const fieldInput = {
  width: '100%', height: 48, border: `1.5px solid ${BORDER}`, borderRadius: 12,
  padding: '0 14px', fontSize: 14, fontFamily: 'var(--font-arabic)',
  color: '#0e1a1b', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
};

export const TABS = [
  { id: 'bank',          icon: '🏦', label: 'البنك' },
  { id: 'whatsapp',      icon: '💬', label: 'واتساب' },
  { id: 'team',          icon: '👥', label: 'الفريق' },
  { id: 'profile',       icon: '👤', label: 'حسابي' },
  { id: 'notifications', icon: '🔔', label: 'الإشعارات' },
];
