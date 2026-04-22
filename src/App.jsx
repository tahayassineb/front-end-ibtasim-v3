// Trigger fresh Vercel deployment - cache bust
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { useUI } from './context/UIContext';

// Layouts
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Home from './pages/features/public/Home';
import ProjectsList from './pages/features/projects/ProjectsList';
import ProjectDetail from './pages/features/projects/ProjectDetail';
import ImpactStories from './pages/features/stories/ImpactStories';
import StoryDetail from './pages/features/stories/StoryDetail';
import UserProfile from './pages/features/public/UserProfile';
import Login from './pages/features/auth/Login';
import Register from './pages/features/auth/Register';
import About from './pages/features/public/About';
import Contact from './pages/features/public/Contact';

// Donation Flow
import DonationFlow from './pages/features/donations/DonationFlow';
import DonateSuccess from './pages/features/donations/DonateSuccess';

// Kafala (Orphan Sponsorship)
import KafalaList from './pages/features/kafala/KafalaList';
import KafalaDetail from './pages/features/kafala/KafalaDetail';
import KafalaFlow from './pages/features/kafala/KafalaFlow';
import KafalaRenew from './pages/features/kafala/KafalaRenew';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

// Convex error logging
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

// Admin Kafala Pages
import AdminKafala from './pages/features/admin/kafala/AdminKafala';
import AdminKafalaForm from './pages/features/admin/kafala/AdminKafalaForm';
import AdminKafalaVerifications from './pages/features/admin/kafala/AdminKafalaVerifications';
import AdminStories from './pages/features/admin/stories/AdminStories';

// Admin Pages
import AdminLogin from './pages/features/admin/AdminLogin';
import AdminDashboard from './pages/features/admin/dashboard/AdminDashboard';
import AdminProjects from './pages/features/admin/projects/AdminProjects';
import AdminProjectDetail from './pages/features/admin/projects/AdminProjectDetail';
import AdminProjectForm from './pages/features/admin/projects/AdminProjectForm';
import AdminDonations from './pages/features/admin/donations/AdminDonations';
import AdminVerifications from './pages/features/admin/donations/AdminVerifications';
import AdminDonors from './pages/features/admin/donors/AdminDonors';
import AdminDonorDetail from './pages/features/admin/donors/AdminDonorDetail';
import AdminSettings from './pages/features/admin/settings/AdminSettings';
import AdminRegister from './pages/features/admin/AdminRegister';
import AdminErrorLogs from './pages/features/admin/AdminErrorLogs';

// ============================================
// SCROLL TO TOP ON ROUTE CHANGE
// ============================================

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// ============================================
// GLOBAL TOAST RENDERER
// Reads toast state from AppContext and renders it visually.
// Without this, showToast() sets state but nothing is ever displayed.
// ============================================

function ToastRenderer() {
  const { toast } = useUI();
  if (!toast) return null;

  const styles = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl text-white font-semibold shadow-2xl ${styles[toast.type] || 'bg-gray-800'} min-w-[260px] max-w-[90vw]`}
    >
      <span className="text-base leading-none shrink-0">{icons[toast.type]}</span>
      <span className="text-sm leading-snug">{toast.message}</span>
    </div>
  );
}

// ============================================
// GLOBAL ERROR LOGGER
// Catches all unhandled promise rejections (including Convex validation errors)
// and persists them to the errorLogs table so they appear in the admin panel.
// ============================================

function GlobalErrorLogger() {
  const logClientError = useMutation(api.errorLogs.logClientError);

  React.useEffect(() => {
    const handler = (event) => {
      try {
        const reason = event.reason;
        const message = reason?.message || String(reason) || 'Unknown error';
        const details = reason?.stack ? reason.stack.slice(0, 2000) : undefined;
        logClientError({ message, source: 'client', details }).catch(() => {});
      } catch {
        // Never let the error handler itself crash
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, [logClientError]);

  return null;
}

// ============================================
// PROTECTED ROUTE COMPONENTS
// ============================================

// Protected route for authenticated users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Protected route for admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = useQuery(
    api.admin.verifyAdminSession,
    isAuthenticated && user?.id ? { adminId: user.id } : 'skip'
  );

  if (!isAuthenticated || !user?.id) return <Navigate to="/admin/login" />;
  if (isAdmin === undefined) return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Tajawal, sans-serif',
    }}>
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        جاري التحقق...
      </div>
    </div>
  );
  if (!isAdmin) return <Navigate to="/admin/login" />;
  return children;
};

// ============================================
// APP CONTENT
// ============================================

function AppContent() {
  const { currentLanguage } = useUI();

  return (
    <Router>
      <ScrollToTop />
      <div dir={currentLanguage.dir}>
        <ToastRenderer />
        <GlobalErrorLogger />
        <Routes>
          {/* ============================================
              PUBLIC ROUTES
              ============================================ */}
          
          {/* Home Page */}
          <Route path="/" element={<ErrorBoundary><MainLayout><Home /></MainLayout></ErrorBoundary>} />

          {/* Projects */}
          <Route path="/projects" element={<ErrorBoundary><MainLayout><ProjectsList /></MainLayout></ErrorBoundary>} />
          <Route path="/projects/:id" element={<ErrorBoundary><MainLayout><ProjectDetail /></MainLayout></ErrorBoundary>} />
          <Route path="/projects/preview-:id" element={<ErrorBoundary><MainLayout><ProjectDetail preview /></MainLayout></ErrorBoundary>} />

          {/* About & Contact */}
          <Route path="/about" element={<ErrorBoundary><MainLayout><About /></MainLayout></ErrorBoundary>} />
          <Route path="/contact" element={<ErrorBoundary><MainLayout><Contact /></MainLayout></ErrorBoundary>} />

          {/* Impact Stories */}
          <Route path="/impact" element={<ErrorBoundary><MainLayout><ImpactStories /></MainLayout></ErrorBoundary>} />
          <Route path="/impact/:id" element={<ErrorBoundary><MainLayout><StoryDetail /></MainLayout></ErrorBoundary>} />

          {/* Auth Routes */}
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

          {/* Protected User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ErrorBoundary><MainLayout><UserProfile /></MainLayout></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Donation Flow */}
          <Route path="/donate/:projectId" element={<ErrorBoundary><DonationFlow /></ErrorBoundary>} />
          <Route path="/donate" element={<ErrorBoundary><DonationFlow /></ErrorBoundary>} />
          <Route path="/donate/success" element={<ErrorBoundary><DonateSuccess /></ErrorBoundary>} />

          {/* Kafala (Orphan Sponsorship) */}
          <Route path="/kafala" element={<ErrorBoundary><MainLayout><KafalaList /></MainLayout></ErrorBoundary>} />
          <Route path="/kafala/:id" element={<ErrorBoundary><MainLayout><KafalaDetail /></MainLayout></ErrorBoundary>} />
          <Route path="/kafala/:id/sponsor" element={<ErrorBoundary><KafalaFlow /></ErrorBoundary>} />
          <Route path="/kafala/:id/renew" element={<ErrorBoundary><KafalaRenew /></ErrorBoundary>} />
          
          {/* ============================================
              ADMIN ROUTES
              ============================================ */}
          
          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Invitation Registration (public) */}
          <Route path="/admin/register/:token" element={<AdminRegister />} />
          
          {/* Protected Admin Routes */}
          <Route element={<AdminRoute><ErrorBoundary><AdminLayout /></ErrorBoundary></AdminRoute>}>
            {/* Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" />} />
            
            {/* Projects Management */}
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/projects/new" element={<AdminProjectForm />} />
            <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
            <Route path="/admin/projects/:id/edit" element={<AdminProjectForm />} />
            
            {/* Donations */}
            <Route path="/admin/donations" element={<AdminDonations />} />
            
            {/* Donors / CRM */}
            <Route path="/admin/donors" element={<AdminDonors />} />
            <Route path="/admin/donors/:id" element={<AdminDonorDetail />} />
            
            {/* Verification */}
            <Route path="/admin/verification" element={<AdminVerifications />} />
            
            {/* Settings */}
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/settings/config" element={<AdminSettings />} />

            {/* Stories */}
            <Route path="/admin/stories" element={<AdminStories />} />

            {/* Kafala Management */}
            <Route path="/admin/kafala" element={<AdminKafala />} />
            <Route path="/admin/kafala/new" element={<AdminKafalaForm />} />
            <Route path="/admin/kafala/:id/edit" element={<AdminKafalaForm />} />
            <Route path="/admin/kafala/verifications" element={<AdminKafalaVerifications />} />

            {/* Error Logs */}
            <Route path="/admin/error-logs" element={<AdminErrorLogs />} />
          </Route>

          {/* ============================================
              404 - NOT FOUND
              ============================================ */}
          <Route 
            path="*" 
            element={
              <MainLayout>
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-5xl text-primary">error_outline</span>
                    </div>
                    <h1 className="text-4xl font-bold text-text-primary dark:text-white mb-3">404</h1>
                    <p className="text-text-secondary mb-8">
                      {currentLanguage.code === 'ar' 
                        ? 'الصفحة غير موجودة'
                        : currentLanguage.code === 'fr'
                        ? 'Page non trouvée'
                        : 'Page Not Found'}
                    </p>
                    <a href="/" className="btn-primary inline-flex items-center gap-2">
                      <span className="material-symbols-outlined">arrow_back</span>
                      {currentLanguage.code === 'ar' 
                        ? 'العودة للرئيسية'
                        : currentLanguage.code === 'fr'
                        ? "Retour à l'accueil"
                        : 'Back to Home'}
                    </a>
                  </div>
                </div>
              </MainLayout>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
