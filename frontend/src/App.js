import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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
import Notifications from './components/Notifications';
import Reports from './components/Reports';
import MobileQRScanner from './components/MobileQRScanner';
import InspectionList from './components/InspectionList';

//import ActivityMonitor from './components/ActivityMonitor';

function AppContent() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
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
              {/* 로고 */}
              <Link to="/" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                WorkHelper
              </Link>

              {/* 데스크톱 네비게이션 (md 이상에서만 표시) */}
              <div className="hidden md:flex items-center gap-6">
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
                  <Link to="/inspections" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    📋 재고실사
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
                  {/* 알림 아이콘 */}
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

                  <button
                    onClick={logout}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    로그아웃
                  </button>
                </div>
              </div>

              {/* 모바일 메뉴 버튼 & 우측 아이콘 (md 미만에서만 표시) */}
              <div className="flex md:hidden items-center gap-3">
                {/* 알림 */}
                <Notifications />
                
                {/* 다크모드 토글 */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title={darkMode ? '라이트 모드' : '다크 모드'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>

                {/* 햄버거 메뉴 버튼 */}
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="메뉴"
                >
                  <svg
                    className="w-6 h-6 text-gray-700 dark:text-gray-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {mobileMenuOpen ? (
                      <path d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* 모바일 드롭다운 메뉴 */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 border-t dark:border-gray-700 pt-4">
                <nav className="flex flex-col gap-3">
                  <Link 
                    to="/" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    🏠 대시보드
                  </Link>
                  <Link 
                    to="/assets" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    💼 자산관리
                  </Link>
                  <Link 
                    to="/issues" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    🚨 장애처리
                  </Link>
                  <Link 
                    to="/statistics" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    📊 통계
                  </Link>
                  <Link 
                    to="/inspections" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    📋 재고실사
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/settings" 
                      onClick={closeMobileMenu}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                    >
                      ⚙️ 설정
                    </Link>
                  )}
                  <Link 
                    to="/reports" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    📄 보고서
                  </Link>
                  
                  <div className="border-t dark:border-gray-700 my-2"></div>
                  
                  <Link 
                    to="/profile" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    👤 {user.full_name}
                  </Link>
                  
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="text-left text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium py-2"
                  >
                    🚪 로그아웃
                  </button>
                </nav>
              </div>
            )}
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
            <Route path="/reports" element={<Reports />} />
            
            {/* 재고 실사 */}
            <Route path="/inspections" element={<InspectionList />} />
            <Route path="/mobile/scan" element={<MobileQRScanner />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
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
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;