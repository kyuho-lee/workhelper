import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import UserManagement from './components/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import AssetEdit from './components/AssetEdit';
import AssetDetail from './components/AssetDetail';
import AssetBulkUpload from './components/AssetBulkUpload';
import IssueList from './components/IssueList';
import IssueForm from './components/IssueForm';
import IssueEdit from './components/IssueEdit';
import Statistics from './components/Statistics';  
import DashboardSettings from './components/DashboardSettings'; 
import Settings from './components/Settings';
import Notifications from './components/Notifications';  // 추가!
import Reports from './components/Reports';  // 추가!



function AppContent() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  // 로그인한 경우
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <header className="bg-white dark:bg-gray-800 shadow print:hidden">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-3xl font-bold text-gray-900 dark:text-white">
                WorkHelper
              </Link>
              <div className="flex items-center gap-6">
                <nav className="flex gap-6">
                  <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    대시보드
                  </Link>
                  <Link to="/assets" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    자산관리
                  </Link>
                  <Link to="/issues" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    장애처리
                  </Link>
                  <Link to="/statistics" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    통계
                  </Link>
                  {isAdmin && (
                    <Link to="/settings" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                      ⚙️ 설정
                    </Link>
                  )}
                  <Link to="/reports" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    보고서
                  </Link>
                </nav>
                <div className="flex items-center gap-3">
                  {/* 알림 아이콘 - 새로 추가! */}
                  <Notifications />
                  
                  <Link 
                    to="/profile"
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    👤 {user.full_name}
                  </Link>
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title={darkMode ? '라이트 모드' : '다크 모드'}
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<UserManagement />} />
            
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/bulk-upload" element={<AssetBulkUpload />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/assets/edit/:id" element={<AssetEdit />} />
            
            <Route path="/issues" element={<IssueList />} />
            <Route path="/issues/new" element={<IssueForm />} />
            <Route path="/issues/edit/:id" element={<IssueEdit />} />
            
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/dashboard-settings" element={<DashboardSettings />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

        <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400 text-sm">
            © 2026 WorkHelper. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;