import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TOURS = [
  { id: 'overview', label: 'Overview', route: '/admin', title: 'Dashboard', body: 'Start here for current donation, project, and sponsorship activity. Review the cards first, then open the action that needs attention.' },
  { id: 'projects', label: 'Projects', route: '/admin/projects', title: 'Projects and categories', body: 'Create drafts, translate each project, add its media, then publish it. Use “Project categories” to control the public filters, names, order, and icons.' },
  { id: 'donations', label: 'Donations', route: '/admin/donations', title: 'Donation operations', body: 'Search and review every donation here. Use the verification queue for transfers that require a receipt check.' },
  { id: 'verification', label: 'Verification', route: '/admin/verification', title: 'Verification queue', body: 'Check the receipt and donor details before approving or rejecting. Your decision updates the donor record and audit trail.' },
  { id: 'donors', label: 'Donors', route: '/admin/donors', title: 'Donor relationships', body: 'Find donor history, contact details, and their contributions. Use this before responding to a donor question.' },
  { id: 'kafala', label: 'Kafala', route: '/admin/kafala', title: 'Kafala sponsorships', body: 'Create and publish sponsorship profiles, then follow pending renewals and payment verification.' },
  { id: 'stories', label: 'Stories', route: '/admin/stories', title: 'Stories and content', body: 'Write, edit, and publish impact stories. Review each language and SEO field before publishing.' },
  { id: 'settings', label: 'Settings', route: '/admin/settings', title: 'System settings', body: 'Manage bank details, team access, notifications, and WhatsApp configuration. Restrict this area to authorised staff.' },
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
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9, border: '1px solid #CCF0F0', background: '#F0F7F7', color: '#0d7477', padding: '0 10px', fontWeight: 800, cursor: 'pointer' }}><span className="material-symbols-outlined no-flip" style={{ fontSize: 18 }}>school</span>Tutorial</button>
      {open && <div style={{ position: 'absolute', top: 42, left: 0, width: 210, background: 'white', border: '1px solid #E5E9EB', borderRadius: 12, padding: 8, boxShadow: '0 10px 25px rgba(0,0,0,.14)', zIndex: 80 }}><button type="button" onClick={() => start('full')} style={{ width: '100%', textAlign: 'left', padding: 9, border: 'none', background: '#F0F7F7', borderRadius: 8, cursor: 'pointer', fontWeight: 800 }}>Start full tour</button>{TOURS.map((item) => <button key={item.id} type="button" onClick={() => start(item.id)} style={{ width: '100%', textAlign: 'left', padding: 9, border: 'none', background: 'white', cursor: 'pointer' }}>{item.label}</button>)}</div>}
    </div>
    {current && <div role="dialog" aria-modal="true" aria-label="Admin tutorial" style={{ position: 'fixed', inset: 0, background: 'rgba(2,23,24,.62)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 24 }} onClick={finish}><div onClick={(event) => event.stopPropagation()} style={{ width: 'min(560px,100%)', background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,.28)' }}><div style={{ color: '#0d7477', fontSize: 12, fontWeight: 900, letterSpacing: '.08em' }}>ADMIN TUTORIAL · {step + 1}/{steps.length}</div><h2 style={{ margin: '8px 0' }}>{current.title}</h2><p style={{ color: '#64748b', lineHeight: 1.7 }}>{current.body}</p><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}><button type="button" onClick={finish} style={{ border: 'none', background: 'white', color: '#64748b', cursor: 'pointer' }}>Skip tutorial</button><button type="button" onClick={() => step === steps.length - 1 ? finish() : setStep((value) => value + 1)} style={{ border: 'none', background: '#0d7477', color: 'white', borderRadius: 10, padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>{step === steps.length - 1 ? 'Finish' : 'Continue'}</button></div></div></div>}
  </>;
}
