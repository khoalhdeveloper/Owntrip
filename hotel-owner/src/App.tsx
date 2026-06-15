import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import FAQ from './pages/FAQ';
import Dashboard from './pages/Dashboard';
import MyHotels from './pages/MyHotels';
import Bookings from './pages/Bookings';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Home / Download page */}
          <Route path="/" element={<Home />} />

          {/* Public login page */}
          <Route path="/login" element={<Login />} />

          {/* FAQ page */}
          <Route path="/faq" element={<FAQ />} />

          {/* Protected hotel owner management dashboard routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-hotels" element={<MyHotels />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Default redirect to login or dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
