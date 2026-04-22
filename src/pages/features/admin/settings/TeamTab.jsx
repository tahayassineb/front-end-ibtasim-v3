import React from 'react';
import {
  SettingsCard, FieldLabel, fieldInput,
  PRIMARY, BORDER, P600, P400, P100, TEXT2, TEXTM, SHADOW_P, TEAL_WASH,
} from './shared';
import { useApp } from '../../../../context/AppContext';

const ROLE_CFG = {
  superAdmin: { label: '🔑 مدير عام', bg: '#FEF3C7', color: '#b45309' },
  admin:      { label: '👤 مشرف',    bg: '#E6F4F4', color: P600 },
  manager:    { label: 'مدير',        bg: '#E6F4F4', color: P600 },
  viewer:     { label: 'مراجع',       bg: '#F1F5F9', color: '#475569' },
};

const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
};

const TeamTab = ({
  teamMembers,
  isSavingTeam,
  handleDeleteMember,
  inviteEmail,
  setInviteEmail,
  invitePhone,
  setInvitePhone,
  isSendingInvite,
  setIsSendingInvite,
  inviteLink,
  setInviteLink,
  createAdminInvitation,
}) => {
  const { user, showToast } = useApp();

  return (
    <>
      {/* Invitation card */}
      <SettingsCard icon="✉️" title="إرسال دعوة تسجيل">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <FieldLabel>البريد الإلكتروني</FieldLabel>
            <input style={{ ...fieldInput, direction: 'ltr', fontFamily: 'Inter, sans-serif' }} type="email"
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="name@example.com"
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>
          <div>
            <FieldLabel>رقم الهاتف (واتساب)</FieldLabel>
            <input style={{ ...fieldInput, direction: 'ltr', fontFamily: 'Inter, sans-serif' }} type="tel"
              value={invitePhone} onChange={e => setInvitePhone(e.target.value)}
              placeholder="+212 6XXXXXXXX"
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>
          <button disabled={isSendingInvite}
            onClick={async () => {
              if (!inviteEmail || !invitePhone) { showToast('يرجى إدخال البريد الإلكتروني ورقم الواتساب', 'error'); return; }
              if (!user?.id) { showToast('يرجى تسجيل الدخول أولاً', 'error'); return; }
              setIsSendingInvite(true);
              try {
                const result = await createAdminInvitation({ email: inviteEmail.trim(), phone: invitePhone.trim(), invitedBy: user.id, siteUrl: window.location.origin });
                setInviteLink(`${window.location.origin}/admin/register/${result.token}`);
                setInviteEmail(''); setInvitePhone('');
                showToast('تم إرسال الدعوة بنجاح عبر الواتساب', 'success');
              } catch (err) { showToast(err.message || 'فشل إرسال الدعوة', 'error'); }
              finally { setIsSendingInvite(false); }
            }}
            style={{ height: 44, background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isSendingInvite ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_P, opacity: isSendingInvite ? 0.7 : 1 }}>
            {isSendingInvite ? '...' : '📤 إرسال الدعوة عبر الواتساب'}
          </button>
          {inviteLink && (
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input readOnly value={inviteLink}
                style={{ flex: 1, fontSize: 12, border: 'none', outline: 'none', background: 'transparent', color: '#16a34a', fontFamily: 'Inter, sans-serif', direction: 'ltr' }} />
              <button onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('تم النسخ', 'success'); }}
                style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>📋</button>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Team members list */}
      <SettingsCard icon="👥" title="أعضاء الفريق">
        {teamMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: TEXTM, fontSize: 14 }}>لا يوجد أعضاء بعد</div>
        ) : (
          teamMembers.map((member, i) => {
            const rc = ROLE_CFG[member.role] || ROLE_CFG.viewer;
            return (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < teamMembers.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${P600},${P400})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                  {initials(member.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{member.name}</div>
                  <div style={{ fontSize: 12, color: TEXTM }}>{member.phone || member.email}</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>{rc.label}</span>
                <button onClick={() => handleDeleteMember(member.id)} disabled={isSavingTeam}
                  style={{ width: 28, height: 28, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, cursor: isSavingTeam ? 'not-allowed' : 'pointer', background: 'white', color: TEXT2 }}>
                  🗑
                </button>
              </div>
            );
          })
        )}
      </SettingsCard>
    </>
  );
};

export default TeamTab;
