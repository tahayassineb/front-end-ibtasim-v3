import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AppProvider } from "./context/AppContext";
import { useUI } from "./context/UIContext";
import MainLayout from "./components/MainLayout";
import AdminLayout from "./components/AdminLayout";
import HomeShell from "./components/HomeShell";
import ErrorBoundary from "./components/ErrorBoundary";
import { AdminRoute, ProtectedRoute } from "./components/RouteGuards";
import { resolveFontSystem } from "./lib/routeGuardHelpers";

const Home = React.lazy(() => import("./pages/features/public/Home"));
const ProjectsList = React.lazy(() => import("./pages/features/projects/ProjectsList"));
const ProjectDetail = React.lazy(() => import("./pages/features/projects/ProjectDetail"));
const ImpactStories = React.lazy(() => import("./pages/features/stories/ImpactStories"));
const StoryDetail = React.lazy(() => import("./pages/features/stories/StoryDetail"));
const UserProfile = React.lazy(() => import("./pages/features/public/UserProfile"));
const Login = React.lazy(() => import("./pages/features/auth/Login"));
const Register = React.lazy(() => import("./pages/features/auth/Register"));
const About = React.lazy(() => import("./pages/features/public/About"));
const Contact = React.lazy(() => import("./pages/features/public/Contact"));
const DonationFlow = React.lazy(() => import("./pages/features/donations/DonationFlow"));
const DonateSuccess = React.lazy(() => import("./pages/features/donations/DonateSuccess"));
const KafalaList = React.lazy(() => import("./pages/features/kafala/KafalaList"));
const KafalaDetail = React.lazy(() => import("./pages/features/kafala/KafalaDetail"));
const KafalaFlow = React.lazy(() => import("./pages/features/kafala/KafalaFlow"));
const KafalaRenew = React.lazy(() => import("./pages/features/kafala/KafalaRenew"));
const AdminKafala = React.lazy(() => import("./pages/features/admin/kafala/AdminKafala"));
const AdminKafalaForm = React.lazy(() => import("./pages/features/admin/kafala/AdminKafalaForm"));
const AdminKafalaVerifications = React.lazy(() => import("./pages/features/admin/kafala/AdminKafalaVerifications"));
const AdminStories = React.lazy(() => import("./pages/features/admin/stories/AdminStories"));
const AdminLogin = React.lazy(() => import("./pages/features/admin/AdminLogin"));
const AdminDashboard = React.lazy(() => import("./pages/features/admin/dashboard/AdminDashboard"));
const AdminProjects = React.lazy(() => import("./pages/features/admin/projects/AdminProjects"));
const AdminProjectDetail = React.lazy(() => import("./pages/features/admin/projects/AdminProjectDetail"));
const AdminProjectForm = React.lazy(() => import("./pages/features/admin/projects/AdminProjectForm"));
const AdminDonations = React.lazy(() => import("./pages/features/admin/donations/AdminDonations"));
const AdminVerifications = React.lazy(() => import("./pages/features/admin/donations/AdminVerifications"));
const AdminDonors = React.lazy(() => import("./pages/features/admin/donors/AdminDonors"));
const AdminDonorDetail = React.lazy(() => import("./pages/features/admin/donors/AdminDonorDetail"));
const AdminContacts = React.lazy(() => import("./pages/features/admin/contacts/AdminContacts"));
const AdminSettings = React.lazy(() => import("./pages/features/admin/settings/AdminSettings"));
const AdminRegister = React.lazy(() => import("./pages/features/admin/AdminRegister"));
const AdminErrorLogs = React.lazy(() => import("./pages/features/admin/AdminErrorLogs"));
const AdminActivity = React.lazy(() => import("./pages/features/admin/AdminActivity"));
const AdminTeamPerformance = React.lazy(() => import("./pages/features/admin/AdminTeamPerformance"));
const AdminReceipts = React.lazy(() => import("./pages/features/admin/AdminReceipts"));

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function ToastRenderer() {
  const { toast } = useUI();
  if (!toast) return null;

  const styles = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  const icons = {
    success: "\u2713",
    error: "\u2715",
    warning: "\u26A0",
    info: "\u2139",
  };

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl text-white font-semibold shadow-2xl ${styles[toast.type] || "bg-gray-800"} min-w-[260px] max-w-[90vw]`}
    >
      <span className="text-base leading-none shrink-0">{icons[toast.type]}</span>
      <span className="text-sm leading-snug">{toast.message}</span>
    </div>
  );
}

function GlobalErrorLogger() {
  const logClientError = useMutation(api.errorLogs.logClientError);

  React.useEffect(() => {
    const handler = (event) => {
      try {
        const reason = event.reason;
        const message = reason?.message || String(reason) || "Unknown error";
        const details = reason?.stack ? reason.stack.slice(0, 2000) : undefined;
        logClientError({ message, source: "client", details }).catch(() => {});
      } catch {
        // Never let the error handler itself crash.
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, [logClientError]);

  return null;
}

function RouteLoading() {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontFamily: "var(--font-arabic)",
        fontSize: 14,
      }}
    >
      Loading...
    </div>
  );
}

function renderLazy(node) {
  return <Suspense fallback={<RouteLoading />}>{node}</Suspense>;
}

function getNotFoundMessage(languageCode) {
  if (languageCode === "ar") return "\u0627\u0644\u0635\u0641\u062d\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629";
  if (languageCode === "fr") return "Page non trouvee";
  return "Page Not Found";
}

function getBackHomeLabel(languageCode) {
  if (languageCode === "ar") return "\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0631\u0626\u064a\u0633\u064a\u0629";
  if (languageCode === "fr") return "Retour a l'accueil";
  return "Back to Home";
}

function AppContent() {
  const { currentLanguage } = useUI();
  const fontSystemConfig = useQuery(api.config.getConfig, { key: "font_system" });

  React.useEffect(() => {
    document.documentElement.dataset.fontSystem = resolveFontSystem(fontSystemConfig);
  }, [fontSystemConfig]);

  return (
    <Router>
      <ScrollToTop />
      <div dir={currentLanguage.dir}>
        <ToastRenderer />
        <GlobalErrorLogger />
        <Routes>
          <Route path="/" element={<ErrorBoundary>{renderLazy(<HomeShell><Home /></HomeShell>)}</ErrorBoundary>} />

          <Route path="/projects" element={<ErrorBoundary>{renderLazy(<MainLayout><ProjectsList /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/projects/:id" element={<ErrorBoundary>{renderLazy(<MainLayout><ProjectDetail /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/projects/preview-:id" element={<ErrorBoundary>{renderLazy(<MainLayout><ProjectDetail preview /></MainLayout>)}</ErrorBoundary>} />

          <Route path="/about" element={<ErrorBoundary>{renderLazy(<MainLayout><About /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/contact" element={<ErrorBoundary>{renderLazy(<MainLayout><Contact /></MainLayout>)}</ErrorBoundary>} />

          <Route path="/stories" element={<ErrorBoundary>{renderLazy(<MainLayout><ImpactStories /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/stories/:id" element={<ErrorBoundary>{renderLazy(<MainLayout><StoryDetail /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/impact" element={<ErrorBoundary>{renderLazy(<MainLayout><ImpactStories /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/impact/:id" element={<ErrorBoundary>{renderLazy(<MainLayout><StoryDetail /></MainLayout>)}</ErrorBoundary>} />

          <Route path="/login" element={<ErrorBoundary>{renderLazy(<Login />)}</ErrorBoundary>} />
          <Route path="/register" element={<ErrorBoundary>{renderLazy(<Register />)}</ErrorBoundary>} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ErrorBoundary>{renderLazy(<MainLayout><UserProfile /></MainLayout>)}</ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route path="/donate/:projectId" element={<ErrorBoundary>{renderLazy(<DonationFlow />)}</ErrorBoundary>} />
          <Route path="/donate" element={<ErrorBoundary>{renderLazy(<DonationFlow />)}</ErrorBoundary>} />
          <Route path="/donate/success" element={<ErrorBoundary>{renderLazy(<DonateSuccess />)}</ErrorBoundary>} />

          <Route path="/kafala" element={<ErrorBoundary>{renderLazy(<MainLayout><KafalaList /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/kafala/:id" element={<ErrorBoundary>{renderLazy(<MainLayout><KafalaDetail /></MainLayout>)}</ErrorBoundary>} />
          <Route path="/kafala/:id/sponsor" element={<ErrorBoundary>{renderLazy(<KafalaFlow />)}</ErrorBoundary>} />
          <Route path="/kafala/:id/renew" element={<ErrorBoundary>{renderLazy(<KafalaRenew />)}</ErrorBoundary>} />

          <Route path="/admin/login" element={renderLazy(<AdminLogin />)} />
          <Route path="/admin/register/:token" element={renderLazy(<AdminRegister />)} />

          <Route element={<AdminRoute><ErrorBoundary>{renderLazy(<AdminLayout />)}</ErrorBoundary></AdminRoute>}>
            <Route path="/admin" element={renderLazy(<AdminDashboard />)} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" />} />
            <Route path="/admin/projects" element={renderLazy(<AdminProjects />)} />
            <Route path="/admin/projects/new" element={renderLazy(<AdminProjectForm />)} />
            <Route path="/admin/projects/:id" element={renderLazy(<AdminProjectDetail />)} />
            <Route path="/admin/projects/:id/edit" element={renderLazy(<AdminProjectForm />)} />
            <Route path="/admin/donations" element={renderLazy(<AdminDonations />)} />
            <Route path="/admin/receipts" element={renderLazy(<AdminReceipts />)} />
            <Route path="/admin/donors" element={renderLazy(<AdminDonors />)} />
            <Route path="/admin/donors/:id" element={renderLazy(<AdminDonorDetail />)} />
            <Route path="/admin/contacts" element={renderLazy(<AdminContacts />)} />
            <Route path="/admin/verification" element={renderLazy(<AdminVerifications />)} />
            <Route path="/admin/settings" element={renderLazy(<AdminSettings />)} />
            <Route path="/admin/settings/config" element={renderLazy(<AdminSettings />)} />
            <Route path="/admin/activity" element={renderLazy(<AdminActivity />)} />
            <Route path="/admin/team-performance" element={renderLazy(<AdminTeamPerformance />)} />
            <Route path="/admin/stories" element={renderLazy(<AdminStories />)} />
            <Route path="/admin/kafala" element={renderLazy(<AdminKafala />)} />
            <Route path="/admin/kafala/new" element={renderLazy(<AdminKafalaForm />)} />
            <Route path="/admin/kafala/:id/edit" element={renderLazy(<AdminKafalaForm />)} />
            <Route path="/admin/kafala/verifications" element={renderLazy(<AdminKafalaVerifications />)} />
            <Route path="/admin/error-logs" element={renderLazy(<AdminErrorLogs />)} />
          </Route>

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
                    <p className="text-text-secondary mb-8">{getNotFoundMessage(currentLanguage.code)}</p>
                    <a href="/" className="btn-primary inline-flex items-center gap-2">
                      <span className="material-symbols-outlined">arrow_back</span>
                      {getBackHomeLabel(currentLanguage.code)}
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

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
