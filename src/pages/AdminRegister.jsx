import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Button from '../components/Button';

// ============================================
// ADMIN REGISTER PAGE - Invitation-based
// ============================================

const AdminRegister = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const validation = useQuery(api.admin.validateInvitationToken, { token: token || '' });
  const acceptInvitation = useMutation(api.admin.acceptAdminInvitation);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('الاسم مطلوب');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتان');
      return;
    }

    setIsLoading(true);
    try {
      const result = await acceptInvitation({ token: token || '', fullName: fullName.trim(), password });
      if (result.success) {
        navigate('/admin/login', { state: { message: 'تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول.' } });
      } else {
        setError(result.message || 'فشل إنشاء الحساب');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ. يرجى المحاولة مجدداً.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (validation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Invalid invitation
  if (!validation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-6">
        <div className="w-full max-w-[400px] rounded-xl p-8 shadow-2xl flex flex-col items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary dark:text-white mb-3">رابط غير صالح</h1>
          <p className="text-slate-500 text-sm mb-6">{validation.reason}</p>
          <Link to="/admin/login" className="text-primary font-semibold hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 pb-2 justify-between">
        <Link
          to="/admin/login"
          className="text-primary flex size-12 shrink-0 items-center cursor-pointer hover:bg-primary/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-text-primary dark:text-white text-lg font-bold leading-tight flex-1 text-center pr-12">
          تسجيل مشرف جديد
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-[400px] rounded-xl p-8 shadow-2xl flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl">admin_panel_settings</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-text-primary dark:text-white text-2xl font-bold leading-tight mb-2">
              إنشاء حساب مشرف
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              البريد الإلكتروني: <span className="font-semibold text-primary" dir="ltr">{validation.email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label className="text-text-primary dark:text-white text-sm font-semibold px-1">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
                placeholder="محمد الأمين"
                className="flex w-full rounded-lg text-text-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 h-14 placeholder:text-slate-400 p-4 text-base"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-text-primary dark:text-white text-sm font-semibold px-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="8 أحرف على الأقل"
                  className="flex w-full rounded-lg text-text-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 h-14 placeholder:text-slate-400 p-4 pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="text-text-primary dark:text-white text-sm font-semibold px-1">
                تأكيد كلمة المرور
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="flex w-full rounded-lg text-text-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 h-14 placeholder:text-slate-400 p-4 text-base"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                icon="check_circle"
                className="shadow-lg shadow-primary/30"
              >
                إنشاء الحساب
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
