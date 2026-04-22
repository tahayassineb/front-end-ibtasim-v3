import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';

// ============================================
// USER PROFILE PAGE - User info & donation history
// ============================================

const statusLabels = {
  active: { label: 'نشط', color: '#16a34a', bg: '#f0fdf4' },
  pending_payment: { label: 'في انتظار التحقق', color: '#d97706', bg: '#fffbeb' },
  expired: { label: 'منتهي', color: '#64748b', bg: '#f1f5f9' },
  cancelled: { label: 'ملغي', color: '#ef4444', bg: '#fef2f2' },
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentLanguage, user, logout, updateUser, showToast, formatCurrency, formatDate, changeLanguage } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [cancellingId, setCancellingId] = useState(null);

  const updateUserConvex = useMutation(api.users.updateUser);
  const cancelKafala = useAction(api.kafalaPayments.cancelKafalaSubscription);
  const userDonations = useQuery(api.donations.getDonationsByUser, user?._id ? { userId: user._id } : 'skip');
  const kafalaSponsorships = useQuery(api.kafala.getUserKafalaSponsorship, user?._id ? { userId: user._id } : 'skip');

  const lang = currentLanguage.code;
  const translations = {
    ar: { editProfile: 'تعديل الملف', saveChanges: 'حفظ التغييرات', cancel: 'إلغاء', logout: 'تسجيل الخروج', logoutConfirm: 'هل أنت متأكد من تسجيل الخروج؟', nameLabel: 'الاسم', emailLabel: 'البريد الإلكتروني', phoneLabel: 'رقم الهاتف', memberSince: 'عضو منذ', donationHistory: 'سجل التبرعات', noDonations: 'لم تقم بأي تبرعات بعد', startDonating: 'ابدأ بالتبرع الآن', totalDonated: 'إجمالي تبرعاتي', donationsCount: 'مشاريع دعمتها', donationRef: 'رقم المرجع', editSuccess: 'تم تحديث الملف الشخصي بنجاح', editError: 'حدث خطأ أثناء التحديث', languageUpdated: 'تم تحديث اللغة بنجاح' },
    fr: { editProfile: 'Modifier', saveChanges: 'Enregistrer', cancel: 'Annuler', logout: 'Déconnexion', logoutConfirm: 'Êtes-vous sûr?', nameLabel: 'Nom', emailLabel: 'Email', phoneLabel: 'Téléphone', memberSince: 'Membre depuis', donationHistory: 'Historique', noDonations: "Pas encore de dons", startDonating: 'Commencer', totalDonated: 'Total donné', donationsCount: 'Projets', donationRef: 'Référence', editSuccess: 'Profil mis à jour', editError: 'Erreur', languageUpdated: 'Langue mise à jour' },
    en: { editProfile: 'Edit Profile', saveChanges: 'Save', cancel: 'Cancel', logout: 'Logout', logoutConfirm: 'Are you sure?', nameLabel: 'Name', emailLabel: 'Email', phoneLabel: 'Phone', memberSince: 'Member since', donationHistory: 'Donation History', noDonations: 'No donations yet', startDonating: 'Start donating', totalDonated: 'Total donated', donationsCount: 'Projects', donationRef: 'Reference', editSuccess: 'Profile updated', editError: 'Error updating', languageUpdated: 'Language updated' },
  };
  const tx = translations[lang] || translations.ar;

  const donations = userDonations || [];
  const sponsorships = kafalaSponsorships || [];
  const activeSponsorships = sponsorships.filter(s => s.status === 'active');
  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const isDonationsLoading = userDonations === undefined;
  const isKafalaLoading = kafalaSponsorships === undefined;

  const handleEditToggle = () => {
    if (isEditing) setEditData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setIsEditing(!isEditing);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    changeLanguage(newLang);
    localStorage.setItem('user-language-preference', newLang);
    showToast(tx.languageUpdated, 'success');
  };

  const handleSave = async () => {
    if (!user?.id) { showToast(tx.editError, 'error'); return; }
    setIsLoading(true);
    try {
      await updateUserConvex({ userId: user.userId || user.id, updates: { fullName: editData.name, email: editData.email } });
      updateUser({ name: editData.name, email: editData.email, phone: editData.phone });
      showToast(tx.editSuccess, 'success');
      setIsEditing(false);
    } catch (error) {
      showToast(tx.editError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm(tx.logoutConfirm)) {
      logout();
      navigate('/', { replace: true });
      showToast(lang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out', 'info');
    }
  };

  const handleCancelKafala = async (sponsorshipId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء الكفالة؟ سيتوقف الدعم الشهري لهذا اليتيم.')) return;
    setCancellingId(sponsorshipId);
    try {
      const result = await cancelKafala({ sponsorshipId });
      if (result.success) {
        showToast('تم إلغاء الكفالة بنجاح', 'success');
      } else {
        showToast(result.error || 'فشل إلغاء الكفالة', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ أثناء الإلغاء', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = { verified: { bg: '#D1FAE5', color: '#16a34a', label: lang === 'ar' ? '✓ مقبول' : '✓ Verified' }, pending: { bg: '#FEF3C7', color: '#b45309', label: lang === 'ar' ? '⏳ قيد الانتظار' : 'Pending' }, rejected: { bg: '#FEE2E2', color: '#dc2626', label: lang === 'ar' ? '✗ مرفوض' : 'Rejected' } };
    const s = map[status] || map.pending;
    return <span style={{ display: 'inline-flex', alignItems: 'center', background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>{s.label}</span>;
  };

  const getInitials = (name) => { if (!name) return 'U'; return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2); };

  const inputStyle = { width: '100%', height: 48, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, color: '#0e1a1b', outline: 'none', background: '#f6f8f8' };

  const payMethodLabel = { card_whop: 'بطاقة بنكية', bank_transfer: 'تحويل بنكي', cash_agency: 'وكالة نقدية' };

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>

      {/* Profile Hero */}
      <div style={{ background: 'linear-gradient(160deg,#021718,#0A5F62)', padding: '48px 0 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#CCF0F0,#33C0C0)', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0, marginBottom: -32, boxShadow: '0 10px 15px rgba(0,0,0,.10)' }}>
            {user?.avatar ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: '#0A5F62', fontWeight: 900, fontFamily: 'Inter, sans-serif' }}>{getInitials(user?.name)}</span>}
          </div>
          <div style={{ paddingBottom: 36 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 4 }}>{user?.name || 'المستخدم'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
              {user?.phone && <span>📞 {user.phone}</span>}
              {user?.email && <span style={{ marginRight: 12 }}>✉ {user.email}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <span style={{ background: '#FEF3C7', color: '#b45309', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>⭐ متبرع ذهبي</span>
              <span style={{ background: '#D1FAE5', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>✓ موثق</span>
            </div>
          </div>
          <div style={{ marginRight: 'auto', paddingBottom: 36 }}>
            <button onClick={handleEditToggle} style={{ height: 36, padding: '0 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.3)', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
              {isEditing ? tx.cancel : `✏️ ${tx.editProfile}`}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '48px auto', padding: '0 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

        {/* Left column */}
        <div>
          {/* Stats */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>إحصائياتي</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { icon: '💰', label: tx.totalDonated, value: formatCurrency ? formatCurrency(totalDonated / 100) : `${(totalDonated / 100).toFixed(0)}`, sub: 'درهم مغربي' },
              { icon: '📋', label: tx.donationsCount, value: donations.length.toString(), sub: 'مشروع مختلف' },
              { icon: '🤲', label: 'كفالات نشطة', value: activeSponsorships.length.toString(), sub: 'يتيم مكفول' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Kafala sponsorships */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>كفالاتي</div>
          {isKafalaLoading ? (
            <div style={{ background: '#F5EBD9', borderRadius: 16, border: '1.5px solid #E8D4B0', padding: 20, marginBottom: 28, textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div>
          ) : sponsorships.length === 0 ? (
            <div style={{ background: '#F5EBD9', borderRadius: 16, border: '1.5px solid #E8D4B0', padding: 24, marginBottom: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤲</div>
              <div style={{ fontSize: 14, color: '#8B6914', marginBottom: 12 }}>لا توجد كفالات حالياً</div>
              <Link to="/kafala" style={{ display: 'inline-flex', height: 38, padding: '0 18px', background: '#6B4F12', color: 'white', borderRadius: 100, fontSize: 13, fontWeight: 700, textDecoration: 'none', alignItems: 'center' }}>ابدأ كفالة يتيم</Link>
            </div>
          ) : (
            <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sponsorships.map((s) => {
                const kafala = s.kafala;
                const statusInfo = statusLabels[s.status] || statusLabels.expired;
                const photo = kafala?.photo ? convexFileUrl(kafala.photo) : null;
                const isCancelling = cancellingId === s._id;
                return (
                  <div key={s._id} style={{ background: '#F5EBD9', borderRadius: 16, border: '1.5px solid #E8D4B0', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>{statusInfo.label}</span>
                      <span style={{ fontSize: 11, color: '#8B6914' }}>{payMethodLabel[s.paymentMethod] || s.paymentMethod}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#8B6914,#C4A882)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                        {photo ? <img src={photo} alt={kafala?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (kafala?.gender === 'female' ? '👧' : '👦')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#3D2506' }}>{kafala?.name || '—'}{kafala?.age ? ` — ${kafala.age} سنوات` : ''}</div>
                        {kafala?.location && <div style={{ fontSize: 12, color: '#8B6914' }}>من {kafala.location}</div>}
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#6B4F12', marginTop: 4 }}>{kafala?.monthlyPrice ? (kafala.monthlyPrice / 100).toFixed(0) : '—'} د.م / شهر</div>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0 }}>
                        {s.status === 'active' && s.paymentMethod !== 'card_whop' && (
                          <>
                            <div style={{ fontSize: 11, color: '#8B6914' }}>الدفعة القادمة</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#6B4F12' }}>{new Date(s.nextRenewalDate).toLocaleDateString('ar-MA')}</div>
                          </>
                        )}
                        {s.status === 'active' && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <Link to={`/kafala/${s.kafalaId}/renew`} style={{ display: 'inline-flex', height: 30, padding: '0 12px', background: '#6B4F12', color: 'white', borderRadius: 100, fontSize: 11, fontWeight: 700, textDecoration: 'none', alignItems: 'center' }}>تجديد</Link>
                            <button
                              onClick={() => handleCancelKafala(s._id)}
                              disabled={isCancelling}
                              style={{ height: 30, padding: '0 12px', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', opacity: isCancelling ? 0.5 : 1 }}>
                              {isCancelling ? '...' : 'إلغاء'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Donation history */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>سجل التبرعات</div>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>آخر التبرعات</div>
              <span style={{ fontSize: 13, color: '#64748b' }}>({donations.length})</span>
            </div>

            {isDonationsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div>
            ) : donations.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
                <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>{tx.noDonations}</div>
                <Link to="/projects" style={{ display: 'inline-flex', height: 44, padding: '0 22px', background: '#0d7477', color: 'white', borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: 'none', alignItems: 'center', boxShadow: '0 4px 14px rgba(13,116,119,.25)' }}>{tx.startDonating}</Link>
              </div>
            ) : (
              donations.map((donation, index) => (
                <div key={donation._id || index} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: index < donations.length - 1 ? '1px solid #E5E9EB' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E6F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💰</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{donation.projectTitle?.ar || donation.projectTitle?.fr || donation.projectTitle?.en || 'مشروع'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate ? formatDate(donation.createdAt) : new Date(donation.createdAt).toLocaleDateString('ar-MA')}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0A5F62', marginRight: 'auto', whiteSpace: 'nowrap' }}>{((donation.amount || 0) / 100).toFixed(0)} د.م</div>
                  {getStatusBadge(donation.status)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Edit form (when editing) */}
          {isEditing && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03)', padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>✏️ {tx.editProfile}</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{tx.nameLabel}</label>
                <input style={inputStyle} name="name" value={editData.name} onChange={handleChange} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{tx.emailLabel}</label>
                <input style={{ ...inputStyle, direction: 'ltr' }} name="email" type="email" value={editData.email} onChange={handleChange} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{tx.phoneLabel}</label>
                <input style={{ ...inputStyle, direction: 'ltr' }} name="phone" type="tel" value={editData.phone} onChange={handleChange} />
              </div>
              <button onClick={handleSave} disabled={isLoading} style={{ width: '100%', height: 44, background: '#0d7477', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(13,116,119,.25)', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? '...' : tx.saveChanges}
              </button>
            </div>
          )}

          {/* Settings card */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E9EB', fontSize: 14, fontWeight: 700 }}>⚙️ إعدادات الحساب</div>
            {[
              { icon: '✏️', text: 'تعديل المعلومات الشخصية', action: handleEditToggle },
              { icon: '🔒', text: 'تغيير كلمة المرور' },
              { icon: '🔔', text: 'إشعارات واتساب' },
              { icon: '🌍', text: `اللغة — ${lang === 'ar' ? 'العربية' : lang === 'fr' ? 'Français' : 'English'}` },
              { icon: '📜', text: 'تحميل شهادة التبرعات' },
            ].map((item, i) => (
              <div key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < 4 ? '1px solid #E5E9EB' : 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.text}</span>
                <span style={{ color: '#94a3b8', marginRight: 'auto', fontSize: 12 }}>←</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03)', overflow: 'hidden' }}>
            <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', cursor: 'pointer', color: '#dc2626' }}>
              <span style={{ fontSize: 18 }}>🚪</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{tx.logout}</span>
            </div>
          </div>

          {/* Gold tier card */}
          <div style={{ background: '#F0F7F7', borderRadius: 14, padding: 16, border: '1px solid #CCF0F0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0A5F62', marginBottom: 6 }}>🎖 مستوى المتبرع الذهبي</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>تبرعاتك تجاوزت 3,000 درهم — أنت من أوفياء جمعية ابتسام</div>
            <div style={{ marginTop: 10, height: 6, background: '#E5E9EB', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', background: 'linear-gradient(to left,#f59e0b,#d97706)', borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>3,450 / 5,000 درهم للمستوى البلاتيني</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
