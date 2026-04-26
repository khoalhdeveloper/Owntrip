import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import Hotels from './pages/Hotels';
import AvatarShop from './pages/AvatarShop';

// App component
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Các route yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="hotels" element={<Hotels />} />
            <Route path="avatar-shop" element={<AvatarShop />} />
            {/* Thêm các trang quản trị khác ở đây */}
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
