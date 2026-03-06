import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ============================================
// Donate Success Page
// Shown when FRONTEND_URL is set and Whop redirects here after payment.
// URL params: paid=true, donationId=xxx, amount=xxx
// ============================================

export default function DonateSuccess() {
  const [searchParams] = useSearchParams();
  const { currentLanguage } = useApp();

  const paid = searchParams.get('paid') === 'true';
  const donationId = searchParams.get('donationId');
  const amount = searchParams.get('amount');

  const isRtl = currentLanguage?.dir === 'rtl';

  if (!paid) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">فشل الدفع</h1>
          <p className="text-gray-500 mb-8">لم يتم معالجة دفعتك. يمكنك المحاولة مرة أخرى.</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            العودة إلى الموقع
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-7 shadow-lg shadow-green-200">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">تم الدفع بنجاح!</h1>
        <p className="text-gray-500 text-lg mb-7">شكراً لك على تبرعك الكريم</p>

        {amount && Number(amount) > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
            <div className="text-green-700 text-xs font-bold uppercase tracking-widest mb-1">المبلغ المدفوع</div>
            <div className="text-gray-900 text-4xl font-extrabold" dir="ltr">{amount} MAD</div>
          </div>
        )}

        {donationId && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">رقم التبرع</div>
            <div className="text-gray-600 text-sm font-semibold break-all" dir="ltr">{donationId}</div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-7 text-sm text-gray-600 leading-relaxed">
          📱 ستتلقى رسالة واتساب للتأكيد قريباً. تبرعك سيُغيّر حياة أسرة محتاجة.
        </div>

        <Link
          to="/"
          className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-2xl font-bold text-base shadow-md shadow-green-200 hover:opacity-90 transition-opacity"
        >
          العودة إلى الموقع
        </Link>
      </div>
    </div>
  );
}
