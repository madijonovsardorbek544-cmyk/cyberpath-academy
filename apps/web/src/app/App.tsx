import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Loader } from '../components/ui';

const LandingPage = lazy(() => import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const ResetPage = lazy(() => import('../pages/ResetPage').then((module) => ({ default: module.ResetPage })));
const OnboardingPage = lazy(() => import('../pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })));
const StudentDashboardPage = lazy(() => import('../pages/StudentDashboardPage').then((module) => ({ default: module.StudentDashboardPage })));
const LearningPathsPage = lazy(() => import('../pages/LearningPathsPage').then((module) => ({ default: module.LearningPathsPage })));
const PracticeHubPage = lazy(() => import('../pages/PracticeHubPage').then((module) => ({ default: module.PracticeHubPage })));
const LessonPage = lazy(() => import('../pages/LessonPage').then((module) => ({ default: module.LessonPage })));
const LabsPage = lazy(() => import('../pages/LabsPage').then((module) => ({ default: module.LabsPage })));
const LabPage = lazy(() => import('../pages/LabPage').then((module) => ({ default: module.LabPage })));
const MistakesPage = lazy(() => import('../pages/MistakesPage').then((module) => ({ default: module.MistakesPage })));
const AITutorPage = lazy(() => import('../pages/AITutorPage').then((module) => ({ default: module.AITutorPage })));
const MentorDashboardPage = lazy(() => import('../pages/MentorDashboardPage').then((module) => ({ default: module.MentorDashboardPage })));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const BillingPage = lazy(() => import('../pages/BillingPage').then((module) => ({ default: module.BillingPage })));
const SupportPage = lazy(() => import('../pages/SupportPage').then((module) => ({ default: module.SupportPage })));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('../pages/TermsPage').then((module) => ({ default: module.TermsPage })));
const SafetyPage = lazy(() => import('../pages/SafetyPage').then((module) => ({ default: module.SafetyPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'mentor') return <Navigate to="/mentor" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'student' && !user.roadmapJson) return <Navigate to="/onboarding" replace />;
  return <StudentDashboardPage />;
}

export function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100"><Loader text="Loading CyberPath Academy..." /></div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPage />} />
          <Route path="/pricing" element={<BillingPage publicView />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/onboarding" element={<ProtectedRoute roles={['student']}><OnboardingPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
          <Route path="/paths" element={<ProtectedRoute><LearningPathsPage /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><PracticeHubPage /></ProtectedRoute>} />
          <Route path="/lessons/:slug" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/labs" element={<ProtectedRoute><LabsPage /></ProtectedRoute>} />
          <Route path="/labs/:slug" element={<ProtectedRoute><LabPage /></ProtectedRoute>} />
          <Route path="/mistakes" element={<ProtectedRoute roles={['student', 'mentor', 'admin']}><MistakesPage /></ProtectedRoute>} />
          <Route path="/tutor" element={<ProtectedRoute><AITutorPage /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
          <Route path="/mentor" element={<ProtectedRoute roles={['mentor', 'admin']}><MentorDashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
