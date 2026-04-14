import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ============================================
// KAFALA RENEW PAGE — Monthly renewal for bank/cash sponsors
// Reached via WhatsApp reminder link: /kafala/:id/renew
// ============================================

export default function KafalaRenew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, showToast, user: appUser } = useApp();
  const lang = currentLanguage?.code || 'ar';

  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [receipt, setReceipt] = useState(null);
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const kafalaData = useQuery(api.kafala.getKafalaById, { kafalaId: id });
  const bankInfoRaw = useQuery(api.config.getConfig, { key: 'bank_info' });
  const userSponsorships = useQuery(
    api.kafala.getUserKafalaSponsorship,
    appUser ? { userId: appUser.userId || appUser.id } : 'skip'
  );

  const renewDonation = useMutation(api.kafala.renewKafalaDonation);
  const uploadKafalaReceipt = useMutation(api.kafala.uploadKafalaReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const createCheckout = useAction(api.kafalaPayments.createKafalaWhopCheckout);

  const bankInfo = React.useMemo(() => {
    if (!bankInfoRaw) return { name: '—', rib: '—', bank: '—' };
    try { return JSON.parse(bankInfoRaw); } catch { return { name: '—', rib: '—', bank: '—' }; }
  }, [bankInfoRaw]);

  const tx = {
    ar: {
      title: 'تجديد الكفالة',
      subtitle: 'جزاك الله خيراً على استمرارك في كفالة هذا اليتيم',
      perMonth: 'درهم / شهر',
      card: 'بطاقة بنكية',
      bank: 'تحويل بنكي',
      cash: 'وكالة نقدية',
      bankDetails: 'بيانات الحساب البنكي',
      bankHolder: 'صاحب الحساب',
      bankRib: 'رقم الحساب (RIB)',
      bankNameLabel: 'البنك',
      uploadReceipt: 'رفع وصل الدفع',
      receiptUploaded: 'تم رفع الوصل',
      selectFile: 'اختر ملف',
      refNum: 'رقم المرجع / الوصل',
      refPlaceholder: 'أدخل رقم الوصل',
      agenciesList: 'Wafacash، Cash Plus',
      submit: 'تأكيد التجديد',
      submitting: 'جاري الإرسال...',
      redirecting: 'جاري التحويل...',
      successTitle: 'تم تأكيد التجديد!',
      successSub: 'شكراً لك على استمرارك. سيتم مراجعة تبرعك وتأكيده خلال 24 ساعة.',
      backHome: 'العودة للرئيسية',
      loading: 'جاري التحميل...',
      noSponsorship: 'لم يتم العثور على اشتراك كفالة نشط لهذا الحساب.',
      notfound: 'الكفالة غير موجودة',
      age: 'سنة',
    },
    fr: {
      title: 'Renouvellement de kafala',
      subtitle: 'Jazak Allah Khayran pour votre fidélité',
      perMonth: 'MAD / mois',
      card: 'Carte bancaire',
      bank: 'Virement bancaire',
      cash: 'Agence en espèces',
      bankDetails: 'Coordonnées bancaires',
      bankHolder: 'Titulaire',
      bankRib: 'RIB',
      bankNameLabel: 'Banque',
      uploadReceipt: 'Télécharger le reçu',
      receiptUploaded: 'Reçu téléchargé',
      selectFile: 'Choisir un fichier',
      refNum: 'Numéro de référence',
      refPlaceholder: 'Entrez votre numéro de reçu',
      agenciesList: 'Wafacash, Cash Plus',
      submit: 'Confirmer le renouvellement',
      submitting: 'Envoi...',
      redirecting: 'Redirection...',
      successTitle: 'Renouvellement confirmé!',
      successSub: 'Merci pour votre fidélité. Votre don sera vérifié dans les 24h.',
      backHome: 'Retour à l\'accueil',
      loading: 'Chargement...',
      noSponsorship: 'Aucun parrainage actif trouvé pour ce compte.',
      notfound: 'Kafala introuvable',
      age: 'ans',
    },
  };
  const tl = tx[lang] || tx.ar;
  const isRTL = lang === 'ar';

  if (kafalaData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!kafalaData) {
    return <div className="min-h-screen flex items-center justify-center text-text-secondary">{tl.notfound}</div>;
  }

  // Find active sponsorship for this kafala + user
  const activeSponsorships = (userSponsorships || []).filter(
    (s) => s.kafalaId === id && (s.status === 'active' || s.status === 'expired')
  );
  const sponsorship = activeSponsorships[0] || null;

  const kafala = kafalaData;
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceMAD = (kafala.monthlyPrice / 100).toLocaleString('fr-MA');

  const handleSubmit = async () => {
    if (submitting || !sponsorship) return;
    setSubmitting(true);

    try {
      const result = await renewDonation({
        sponsorshipId: sponsorship._id,
        paymentMethod,
      });

      if (paymentMethod === 'card_whop') {
        const purchaseUrl = await createCheckout({ kafalaId: id, donationId: result.donationId });
        window.location.href = purchaseUrl;
        return;
      }

      if (paymentMethod === 'bank_transfer' && receipt) {
        const uploadUrl = await generateUploadUrl();
        const uploadRes = await fetch(uploadUrl, { method: 'POST', body: receipt, headers: { 'Content-Type': receipt.type } });
        const { storageId } = await uploadRes.json();
        await uploadKafalaReceipt({ donationId: result.donationId, receiptUrl: storageId, bankName });
      }

      if (paymentMethod === 'cash_agency' && reference) {
        await uploadKafalaReceipt({ donationId: result.donationId, receiptUrl: '', transactionReference: reference, bankName: 'cash_agency' });
      }

      setDone(true);
    } catch (err) {
      showToast?.(err?.message || 'حدث خطأ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="bg-white dark:bg-bg-dark-card rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">{tl.successTitle}</h2>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">{tl.successSub}</p>
          <button onClick={() => navigate('/')} className="w-full bg-primary text-white py-3 rounded-xl font-bold">{tl.backHome}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-emerald-700 text-white py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={72} className="mx-auto mb-3 ring-4 ring-white/30" />
          <h1 className="text-xl font-bold">{tl.title}</h1>
          <p className="text-white/80 text-sm mt-1">{kafala.name} — {kafala.age} {tl.age} — {kafala.location}</p>
          <p className="text-white/70 text-xs mt-2">{tl.subtitle}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Price reminder */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary">{priceMAD}<span className="text-base font-medium text-text-secondary mr-1"> {tl.perMonth}</span></p>
        </div>

        {/* No sponsorship warning */}
        {!sponsorship && userSponsorships !== undefined && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4 text-amber-800 dark:text-amber-200 text-sm">
            {tl.noSponsorship}
          </div>
        )}

        {/* Payment method */}
        <div className="space-y-3">
          {[
            { id: 'bank_transfer', label: tl.bank, icon: 'account_balance' },
            { id: 'cash_agency', label: tl.cash, icon: 'store' },
            { id: 'card_whop', label: tl.card, icon: 'credit_card' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-right ${
                paymentMethod === m.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-bg-dark-card'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === m.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                <span className="material-symbols-outlined text-xl">{m.icon}</span>
              </div>
              <span className={`flex-1 font-semibold text-sm ${paymentMethod === m.id ? 'text-primary' : 'text-text-primary dark:text-white'}`}>{m.label}</span>
              <span className={`material-symbols-outlined text-lg ${paymentMethod === m.id ? 'text-primary' : 'text-gray-300'}`}>
                {paymentMethod === m.id ? 'radio_button_checked' : 'radio_button_unchecked'}
              </span>
            </button>
          ))}
        </div>

        {/* Bank details */}
        {paymentMethod === 'bank_transfer' && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-text-secondary mb-3">{tl.bankDetails}</p>
              {[
                { label: tl.bankHolder, value: bankInfo.name },
                { label: tl.bankRib, value: bankInfo.rib, mono: true },
                { label: tl.bankNameLabel, value: bankInfo.bank },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">{row.label}</span>
                  <span className={`font-semibold text-text-primary dark:text-white ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tl.uploadReceipt}</label>
              <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-primary/30 rounded-xl py-5 text-center hover:bg-primary/5 transition-colors">
                {receipt ? (
                  <span className="text-emerald-600 font-semibold text-sm">{tl.receiptUploaded}: {receipt.name}</span>
                ) : (
                  <span className="text-text-muted text-sm">{tl.selectFile}</span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setReceipt(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tl.bankNameLabel}</label>
              <input type="text" placeholder="Attijariwafa, CIH..." value={bankName} onChange={e => setBankName(e.target.value)}
                className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white focus:outline-none focus:border-primary" />
            </div>
          </div>
        )}

        {/* Cash agency */}
        {paymentMethod === 'cash_agency' && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
              <p className="text-sm text-text-muted mb-1">{lang === 'ar' ? 'الوكالات المتاحة' : 'Agences disponibles'}</p>
              <p className="font-semibold text-text-primary dark:text-white">{tl.agenciesList}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tl.refNum}</label>
              <input type="text" placeholder={tl.refPlaceholder} value={reference} onChange={e => setReference(e.target.value)}
                className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white focus:outline-none focus:border-primary" dir="ltr" />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !sponsorship}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-primary"
        >
          {submitting ? (paymentMethod === 'card_whop' ? tl.redirecting : tl.submitting) : tl.submit}
        </button>
      </div>
    </div>
  );
}
