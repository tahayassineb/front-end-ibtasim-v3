import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
};

// ============================================
// CONTACT PAGE - Two Column Layout with Form
// ============================================

const Contact = () => {
  const { t, language } = useApp();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitContact = useMutation(api.contact.submitContactMessage);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) return;
    setIsSubmitting(true);
    try {
      await submitContact({
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setIsSubmitted(true);
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Contact form failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    height: 52,
    padding: '0 16px',
    border: '1.5px solid #E5E9EB',
    borderRadius: 12,
    fontFamily: 'Tajawal, sans-serif',
    fontSize: 14,
    color: '#0e1a1b',
    background: 'white',
    outline: 'none',
  };

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0e1a1b', marginBottom: 7 };

  const infoItems = [
    { icon: '📞', label: 'الهاتف', value: '+212 5 37 XX XX XX', sub: 'متاح من 9ص إلى 5م' },
    { icon: '💬', label: 'واتساب', value: '+212 6 XX XX XX XX', sub: 'رد سريع — متاح 24/7', highlight: true },
    { icon: '✉️', label: 'البريد الإلكتروني', value: 'contact@ibtasim.ma', sub: 'رد خلال 24 ساعة' },
    { icon: '📍', label: 'العنوان', value: 'حي الرياض، الرباط', sub: 'المملكة المغربية 10000' },
  ];

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#052E2F,#0A5F62)', padding: isMobile ? '40px 20px' : '60px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '0' : '0 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#33C0C0', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>CONTACT US</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: 'white', marginBottom: 12 }}>تواصل معنا</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>نحن هنا للإجابة على جميع استفساراتك — فريقنا يرد في غضون 24 ساعة</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: isMobile ? '28px auto' : '60px auto', padding: isMobile ? '0 16px' : '0 28px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? 20 : 48, alignItems: 'start' }}>

        {/* Form Card */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', padding: 36 }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>تم إرسال رسالتك بنجاح!</div>
              <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>شكراً على تواصلك معنا — سيقوم فريقنا بالرد عليك في غضون 24 ساعة على أبعد تقدير</div>
              <button
                onClick={() => setIsSubmitted(false)}
                style={{ height: 44, padding: '0 22px', borderRadius: 100, fontSize: 14, fontWeight: 600, background: '#E6F4F4', color: '#0A5F62', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>SEND MESSAGE</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>أرسل لنا رسالة</h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>سواء كان لديك سؤال حول التبرع، أو مشروع، أو الكفالة — نحن نسمعك</p>

              {/* Name + Phone grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>الاسم الكامل *</label>
                  <input
                    style={inputStyle}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="محمد العلوي"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>رقم الهاتف *</label>
                  <input
                    style={inputStyle}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+212 6 XX XX XX XX"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>البريد الإلكتروني</label>
                <input
                  style={inputStyle}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>موضوع الرسالة *</label>
                <input
                  style={inputStyle}
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="استفسار حول التبرع"
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>رسالتك *</label>
                <textarea
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E5E9EB', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, color: '#0e1a1b', background: 'white', outline: 'none', resize: 'vertical', minHeight: 140, lineHeight: 1.7 }}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="اكتب رسالتك هنا..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ width: '100%', height: 54, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'Tajawal, sans-serif', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة 📨'}
              </button>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>🔒 بياناتك محمية ولن تُشارك مع أي طرف ثالث</div>
            </form>
          )}
        </div>

        {/* Right side */}
        <div>
          {/* Contact Info Card */}
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', padding: 28, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>CONTACT INFO</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>معلومات التواصل</div>
            {infoItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: i < infoItems.length - 1 ? 18 : 0, paddingBottom: i < infoItems.length - 1 ? 18 : 0, borderBottom: i < infoItems.length - 1 ? '1px solid #E5E9EB' : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: item.highlight ? '#0d7477' : '#0e1a1b' }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Working Hours */}
          <div style={{ background: '#F0F7F7', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⏰ أوقات العمل</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 6 }}>
              <span>الاثنين — الجمعة</span><span style={{ color: '#0A5F62', fontWeight: 600 }}>9:00 — 17:00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 6 }}>
              <span>السبت</span><span>9:00 — 13:00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
              <span>الأحد</span><span style={{ color: '#94a3b8' }}>مغلق</span>
            </div>
          </div>

          {/* Map Placeholder */}
          <div
            onClick={() => window.open('https://maps.google.com/?q=الرباط،المغرب', '_blank')}
            style={{ background: 'linear-gradient(135deg,#E6F4F4,#F0F7F7)', borderRadius: 16, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #E5E9EB', cursor: 'pointer' }}>
            <div style={{ fontSize: 36 }}>📍</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>حي الرياض، الرباط، المغرب</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>انقر لعرض الخريطة</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
