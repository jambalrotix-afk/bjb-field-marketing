import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import InputProspect from './pages/InputProspect';
import Performance from './pages/Performance';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import Login from './pages/Login';
import Pipeline from './pages/Pipeline';
import ClientDirectory from './pages/ClientDirectory';

// Dedicated pipeline routes added
// Router protection helper for authenticated routes
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Header />
      {children}
      <BottomNav />
    </>
  );
};

// Router protection helper to restrict access to Manager or Super Admin role
const ProtectedManagerRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'Manager' && user.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Router protection helper to restrict access to Super Admin role only
const ProtectedAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Router protection helper for public routes (e.g. Login)
const PublicRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pipeline" 
            element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/directory" 
            element={
              <ProtectedRoute>
                <ClientDirectory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/input" 
            element={
              <ProtectedRoute>
                <InputProspect />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/performance" 
            element={
              <ProtectedRoute>
                <ProtectedManagerRoute>
                  <Performance />
                </ProtectedManagerRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <UserManagement />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logs" 
            element={
              <ProtectedRoute>
                <ProtectedManagerRoute>
                  <ActivityLogs />
                </ProtectedManagerRoute>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
