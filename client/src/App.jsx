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

import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import ExpensesPage from './pages/ExpensesPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
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
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
