import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import HomePage from './pages/HomePage';
import { AuthProvider } from './firebase/authContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';

import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import ExpensesPage from './pages/ExpensesPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import GroupDetailsPage from './pages/GroupDetailsPage';
import TripPlannerPage from './pages/TripPlannerPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Admin imports
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import GroupManagement from './pages/admin/GroupManagement';
import ExpenseManagement from './pages/admin/ExpenseManagement';
import Analytics from './pages/admin/Analytics';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import NotFoundPage from './pages/NotFoundPage';


function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="verify-email" element={<VerifyEmailPage />} />
                  <Route path="home" element={<HomePage />} />
                </Route>

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="groups/:groupId" element={<GroupDetailsPage />} />
                  <Route path="trip-planner" element={<TripPlannerPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                <Route path="/admin/groups" element={<AdminRoute><GroupManagement /></AdminRoute>} />
                <Route path="/admin/expenses" element={<AdminRoute><ExpenseManagement /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                <Route path="/admin/support" element={<AdminRoute><AdminSupportPage /></AdminRoute>} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ToastProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

