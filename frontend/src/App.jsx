import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import MedicationsPage from './pages/MedicationsPage';
import POSPage from './pages/POSPage';
import CashierPage from './pages/CashierPage';
import InventoryPage from './pages/InventoryPage';
import DashboardPage from './pages/DashboardPage';
import InsurancePage from './pages/InsurancePage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // Admins are allowed everywhere, otherwise check specific roles
  if (user?.role !== 'ADMIN' && roles && !roles.includes(user?.role)) {
    return <Navigate to="/home" />;
  }
  
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/*" 
            element={
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<ProtectedRoute roles={['ADMIN']}><DashboardPage /></ProtectedRoute>} />
                  <Route path="/medications" element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
                  <Route path="/pos" element={<ProtectedRoute roles={['PHARMACIST', 'CASHIER', 'ADMIN']}><POSPage /></ProtectedRoute>} />
                  <Route path="/cashier" element={<ProtectedRoute roles={['CASHIER', 'ADMIN']}><CashierPage /></ProtectedRoute>} />
                  <Route path="/categories" element={<ProtectedRoute roles={['ADMIN']}><CategoriesPage /></ProtectedRoute>} />
                  <Route path="/insurance" element={<ProtectedRoute roles={['ADMIN']}><InsurancePage /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />
                  
                  <Route path="/home" element={<HomeRedirect />} />
                  <Route path="*" element={<HomeRedirect />} />
                </Routes>
              </DashboardLayout>
            } 
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

const HomeRedirect = () => {
  const { user } = useAuthStore();
  if (user?.role === 'ADMIN') return <Navigate to="/" />;
  if (user?.role === 'PHARMACIST') return <Navigate to="/medications" />;
  if (user?.role === 'CASHIER') return <Navigate to="/pos" />;
  return <Navigate to="/login" />;
};

export default App;
