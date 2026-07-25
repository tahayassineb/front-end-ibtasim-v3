import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TOURS = [
  { id: 'overview', label: 'نظرة عامة', route: '/admin', title: 'لوحة التحكم', body: 'ابدأ من هنا لمراجعة التبرعات والمشاريع والكفالات الحالية. راجع البطاقات، ثم افتح المهمة التي تحتاج إلى متابعة.' },
  { id: 'projects', label: 'المشاريع', route: '/admin/projects', title: 'المشاريع والفئات', body: 'أنشئ مسودة المشروع، أدخل النصوص باللغات الثلاث، أضف الصور وخيارات مبالغ التبرع والحدود، ثم انشر المشروع. من صفحة الفئات يمكنك التحكم في الأسماء والأيقونات والصور.' },
  { id: 'donations', label: 'التبرعات', route: '/admin/donations', title: 'إدارة التبرعات', body: 'ابحث عن كل تبرع وراجعه من هنا. استخدم صفحة التحقق لمراجعة التحويلات التي تتطلب وصلاً.' },
  { id: 'verification', label: 'التحقق', route: '/admin/verification', title: 'قائمة التحقق', body: 'راجع صورة الوصل وبيانات المتبرع قبل القبول أو الرفض. يتم تسجيل قرارك في سجل النشاط.' },
  { id: 'donors', label: 'المتبرعون', route: '/admin/donors', title: 'علاقات المتبرعين', body: 'اطلع على تاريخ المتبرع وبيانات التواصل ومساهماته قبل الرد على أي استفسار.' },
  { id: 'kafala', label: 'الكفالة', route: '/admin/kafala', title: 'إدارة الكفالات', body: 'أنشئ ملفات الكفالة وأضف الصور والنصوص، ثم تابع التجديدات وعمليات التحقق من الدفع.' },
  { id: 'stories', label: 'القصص', route: '/admin/stories', title: 'القصص والمحتوى', body: 'اكتب قصص الأثر وعدّلها وانشرها. راجع النص والصورة وبيانات الظهور قبل النشر.' },
  { id: 'settings', label: 'الإعدادات', route: '/admin/settings', title: 'إعدادات النظام', body: 'أدر بيانات البنك والفريق والإشعارات وإعدادات واتساب. هذه الصفحة مخصصة للمستخدمين المخولين.' },
];

export default function AdminTutorial() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tour, setTour] = useState(null);
  const [step, setStep] = useState(0);
  const steps = useMemo(() => tour ? (tour === 'full' ? TOURS : TOURS.filter((item) => item.id === tour)) : [], [tour]);
  const current = steps[step];
  const start = (id) => { setOpen(false); setTour(id); setStep(0); };
  const finish = () => { const adminId = JSON.parse(localStorage.getItem('app-user') || 'null')?.id; if (adminId) localStorage.setItem(`admin-tutorial-v1:${adminId}`, 'complete'); setTour(null); };

  useEffect(() => {
    const adminId = JSON.parse(localStorage.getItem('app-user') || 'null')?.id;
    if (adminId && !localStorage.getItem(`admin-tutorial-v1:${adminId}`)) setTimeout(() => start('full'), 500);
  }, []);
  useEffect(() => { if (current && location.pathname !== current.route) navigate(current.route); }, [current, location.pathname, navigate]);

  return <>
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9, border: '1px solid #CCF0F0', background: '#F0F7F7', color: '#0d7477', padding: '0 10px', fontWeight: 800, cursor: 'pointer' }}><span className="material-symbols-outlined no-flip" style={{ fontSize: 18 }}>school</span>دليل الإدارة</button>
      {open && <div dir="rtl" style={{ position: 'absolute', top: 42, left: 0, width: 230, background: 'white', border: '1px solid #E5E9EB', borderRadius: 12, padding: 8, boxShadow: '0 10px 25px rgba(0,0,0,.14)', zIndex: 80 }}><button type="button" onClick={() => start('full')} style={{ width: '100%', textAlign: 'right', padding: 9, border: 'none', background: '#F0F7F7', borderRadius: 8, cursor: 'pointer', fontWeight: 800 }}>بدء الجولة الكاملة</button>{TOURS.map((item) => <button key={item.id} type="button" onClick={() => start(item.id)} style={{ width: '100%', textAlign: 'right', padding: 9, border: 'none', background: 'white', cursor: 'pointer' }}>{item.label}</button>)}</div>}
    </div>
    {current && <div role="dialog" aria-modal="true" aria-label="دليل لوحة الإدارة" dir="rtl" style={{ position: 'fixed', inset: 0, background: 'rgba(2,23,24,.62)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 24 }} onClick={finish}><div onClick={(event) => event.stopPropagation()} style={{ width: 'min(560px,100%)', background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,.28)' }}><div style={{ color: '#0d7477', fontSize: 12, fontWeight: 900 }}>دليل الإدارة · {step + 1}/{steps.length}</div><h2 style={{ margin: '8px 0' }}>{current.title}</h2><p style={{ color: '#64748b', lineHeight: 1.7 }}>{current.body}</p><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}><button type="button" onClick={finish} style={{ border: 'none', background: 'white', color: '#64748b', cursor: 'pointer' }}>تخطي الدليل</button><button type="button" onClick={() => step === steps.length - 1 ? finish() : setStep((value) => value + 1)} style={{ border: 'none', background: '#0d7477', color: 'white', borderRadius: 10, padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>{step === steps.length - 1 ? 'إنهاء' : 'متابعة'}</button></div></div></div>}
  </>;
}
