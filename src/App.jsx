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
import AdminDonors from './pages/AdminDonors';
import AdminDonorDetail from './pages/AdminDonorDetail';
import AdminSettings from './pages/AdminSettings';

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
  // For demo, allow all authenticated users to access admin
  // In production: check user.role === 'admin'
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

// ============================================
// APP CONTENT
// ============================================

function AppContent() {
  const { t, currentLanguage } = useApp();

  return (
    <Router>
      <div dir={currentLanguage.dir}>
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
            <Route path="/admin/verification" element={<AdminDonations />} />
            <Route path="/admin/verify/:id" element={<AdminDonations />} />
            
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
