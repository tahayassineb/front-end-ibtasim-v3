import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { SettingsCard, FieldLabel, fieldInput, PRIMARY, BORDER, TEXTM } from './shared';
import { roleLabels, can } from '../../../../lib/adminPermissions';

const roleOptions = [
  { value: 'manager', label: 'مدير' },
  { value: 'validator', label: 'محقق' },
  { value: 'viewer', label: 'مشاهد' },
];

const badgeStyle = (role) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  background: role === 'owner' ? '#FEF3C7' : role === 'manager' ? '#E6F4F4' : role === 'validator' ? '#DCFCE7' : '#F1F5F9',
  color: role === 'owner' ? '#b45309' : role === 'manager' ? '#0d7477' : role === 'validator' ? '#15803d' : '#475569',
});

const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('');

export default function TeamTab() {
  const { user, showToast } = useApp();
  const team = useQuery(api.admin.listTeamMembers, user?.id ? { adminId: user.id } : 'skip');
  const createAdminInvitation = useMutation(api.admin.createAdminInvitation);
  const updateAdminRole = useMutation(api.admin.updateAdminRole);
  const setAdminActive = useMutation(api.admin.setAdminActive);
  const cancelInvitation = useMutation(api.admin.cancelInvitation);
  const migrateExistingAdminsToOwner = useMutation(api.admin.migrateExistingAdminsToOwner);

  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('validator');
  const [busy, setBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const canManageTeam = can(user?.role, 'admin:manage_team');
  const canInvite = can(user?.role, 'admin:invite');

  const handleInvite = async () => {
    if (!inviteEmail || !invitePhone) {
      showToast('يرجى إدخال البريد الإلكتروني ورقم الواتساب', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await createAdminInvitation({
        email: inviteEmail.trim(),
        phone: invitePhone.trim(),
        role: inviteRole,
        invitedBy: user.id,
        siteUrl: window.location.origin,
      });
      setInviteLink(`${window.location.origin}/admin/register/${result.token}`);
      setInviteEmail('');
      setInvitePhone('');
      showToast('تم إرسال الدعوة بنجاح', 'success');
    } catch (err) {
      showToast(err.message || 'فشل إرسال الدعوة', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (team === undefined) {
    return <div style={{ textAlign: 'center', padding: 40, color: TEXTM }}>جاري تحميل الفريق...</div>;
  }

  return (
    <>
      {canInvite && (
        <SettingsCard icon="✉️" title="إرسال دعوة تسجيل">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 12 }}>
            <div>
              <FieldLabel>البريد الإلكتروني</FieldLabel>
              <input style={{ ...fieldInput, direction: 'ltr' }} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <div>
              <FieldLabel>رقم الهاتف (واتساب)</FieldLabel>
              <input style={{ ...fieldInput, direction: 'ltr' }} type="tel" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+212 6XXXXXXXX" />
            </div>
            <div>
              <FieldLabel>الدور</FieldLabel>
              <select style={fieldInput} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {roleOptions.filter((r) => user?.role === 'owner' || r.value !== 'manager').map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <button disabled={busy} onClick={handleInvite} style={{ marginTop: 12, height: 44, background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)', padding: '0 18px', opacity: busy ? 0.7 : 1 }}>
            {busy ? '...' : 'إرسال الدعوة'}
          </button>
          {inviteLink && (
            <div style={{ marginTop: 12, background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', border: '1px solid #bbf7d0', display: 'flex', gap: 8 }}>
              <input readOnly value={inviteLink} style={{ flex: 1, border: 0, background: 'transparent', direction: 'ltr', color: '#16a34a' }} />
              <button onClick={() => navigator.clipboard.writeText(inviteLink)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>نسخ</button>
            </div>
          )}
        </SettingsCard>
      )}

      {canManageTeam && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={async () => {
            const updated = await migrateExistingAdminsToOwner({ adminId: user.id });
            showToast(`تم تحديث ${updated} حسابات قديمة`, 'success');
          }} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'white', cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontWeight: 800 }}>
            ترحيل الحسابات القديمة إلى مالك
          </button>
        </div>
      )}

      <SettingsCard icon="👥" title="أعضاء الفريق">
        {team.members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: TEXTM }}>لا يوجد أعضاء بعد</div>
        ) : (
          team.members.map((member, i) => (
            <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < team.members.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#0d7477,#33C0C0)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{initials(member.fullName)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{member.fullName}</div>
                <div style={{ fontSize: 12, color: TEXTM }}>{member.email} · {member.phoneNumber || 'بدون هاتف'}</div>
              </div>
              <span style={badgeStyle(member.role)}>{roleLabels[member.role]}</span>
              {canManageTeam && member.role !== 'owner' && (
                <select value={member.role} onChange={(e) => updateAdminRole({ actorAdminId: user.id, targetAdminId: member._id, role: e.target.value })} style={{ height: 34, border: `1px solid ${BORDER}`, borderRadius: 8, fontFamily: 'var(--font-arabic)' }}>
                  {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              )}
              {canManageTeam && member._id !== user.id && (
                <button onClick={() => setAdminActive({ actorAdminId: user.id, targetAdminId: member._id, isActive: !member.isActive })} style={{ height: 32, border: `1px solid ${BORDER}`, borderRadius: 8, background: member.isActive ? '#FEE2E2' : '#DCFCE7', color: member.isActive ? '#dc2626' : '#15803d', cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontWeight: 800 }}>
                  {member.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
              )}
            </div>
          ))
        )}
      </SettingsCard>

      <SettingsCard icon="⏳" title="الدعوات المعلقة">
        {team.invitations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: TEXTM }}>لا توجد دعوات معلقة</div>
        ) : team.invitations.map((inv, i) => (
          <div key={inv._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < team.invitations.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{inv.email}</div>
              <div style={{ fontSize: 12, color: TEXTM }}>{inv.phone} · تنتهي {new Date(inv.expiresAt).toLocaleDateString('ar-MA')}</div>
            </div>
            <span style={badgeStyle(inv.role)}>{roleLabels[inv.role]}</span>
            <button onClick={() => {
              const link = `${window.location.origin}/admin/register/${inv.token}`;
              navigator.clipboard.writeText(link);
              showToast('تم نسخ رابط الدعوة', 'success');
            }} style={{ height: 32, border: `1px solid ${BORDER}`, borderRadius: 8, background: 'white', cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>نسخ الرابط</button>
            {canInvite && (
              <button onClick={() => cancelInvitation({ actorAdminId: user.id, invitationId: inv._id })} style={{ height: 32, border: `1px solid ${BORDER}`, borderRadius: 8, background: '#FEE2E2', color: '#dc2626', cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontWeight: 800 }}>إلغاء</button>
            )}
          </div>
        ))}
      </SettingsCard>
    </>
  );
}

