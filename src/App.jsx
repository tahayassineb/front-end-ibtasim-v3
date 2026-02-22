// Trigger fresh Vercel deployment - cache bust
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layouts
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Home from './pages/Home';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import ImpactStories from './pages/ImpactStories';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';

// Donation Flow
import DonationFlow from './pages/DonationFlow';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjects from './pages/AdminProjects';
import AdminProjectDetail from './pages/AdminProjectDetail';
import AdminProjectForm from './pages/AdminProjectForm';
import AdminDonations from './pages/AdminDonations';
import AdminVerifications from './pages/AdminVerifications';
import AdminDonors from './pages/AdminDonors';
import AdminDonorDetail from './pages/AdminDonorDetail';
import AdminSettings from './pages/AdminSettings';
import AdminRegister from './pages/AdminRegister';

// ============================================
// GLOBAL TOAST RENDERER
// Reads toast state from AppContext and renders it visually.
// Without this, showToast() sets state but nothing is ever displayed.
// ============================================

function ToastRenderer() {
  const { toast } = useApp();
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
// PROTECTED ROUTE COMPONENTS
// ============================================

// Protected route for authenticated users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Protected route for admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useApp();
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/admin/login" />;
  return children;
};

// ============================================
// APP CONTENT
// ============================================

function AppContent() {
  const { t, currentLanguage } = useApp();

  return (
    <Router>
      <div dir={currentLanguage.dir}>
        <ToastRenderer />
        <Routes>
          {/* ============================================
              PUBLIC ROUTES
              ============================================ */}
          
          {/* Home Page */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          
          {/* Projects */}
          <Route path="/projects" element={<MainLayout><ProjectsList /></MainLayout>} />
          <Route path="/projects/:id" element={<MainLayout><ProjectDetail /></MainLayout>} />
          <Route path="/projects/preview-:id" element={<MainLayout><ProjectDetail preview /></MainLayout>} />
          
          {/* About & Contact */}
          <Route path="/about" element={<MainLayout><About /></MainLayout>} />
          <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
          
          {/* Impact Stories */}
          <Route path="/impact" element={<MainLayout><ImpactStories /></MainLayout>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout><UserProfile /></MainLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Donation Flow */}
          <Route path="/donate/:projectId" element={<DonationFlow />} />
          <Route path="/donate" element={<DonationFlow />} />
          
          {/* ============================================
              ADMIN ROUTES
              ============================================ */}
          
          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Invitation Registration (public) */}
          <Route path="/admin/register/:token" element={<AdminRegister />} />
          
          {/* Protected Admin Routes */}
          <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
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
