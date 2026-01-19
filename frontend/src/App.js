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
import QRPrintPage from './components/QRPrintPage';

// 🔥 새로 추가된 모바일 컴포넌트들
import QRActionSelector from './components/QRActionSelector';
import MobileAssetView from './components/MobileAssetView';
import MobileInspection from './components/MobileInspection';

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
                  {/* 🔥 관리자만: 대시보드 */}
                  {isAdmin && (
                    <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                      대시보드
                    </Link>
                  )}
                  
                  {/* 모든 사용자: 자산관리 */}
                  <Link to="/assets" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    자산관리
                  </Link>
                  
                  {/* 모든 사용자: 장애처리 */}
                  <Link to="/issues" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    장애처리
                  </Link>
                  
                  {/* 🔥 관리자만: 통계 */}
                  {isAdmin && (
                    <Link to="/statistics" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                      통계
                    </Link>
                  )}
                  
                  {/* 🔥 관리자만: 재고실사 */}
                  {isAdmin && (
                    <Link to="/inspections" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                      📋 재고실사
                    </Link>
                  )}
                  
                  {/* 모든 사용자: QR스캔 */}
                  <Link to="/mobile/qr-scan" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                    📱 QR스캔
                  </Link>
                  
                  {/* 🔥 관리자만: QR인쇄 */}
                  {isAdmin && (
                    <Link to="/qr-print" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                      🖨️ QR인쇄
                    </Link>
                  )}
                  
                  {/* 🔥 관리자만: 설정 */}
                  {isAdmin && (
                    <Link to="/settings" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                      ⚙️ 설정
                    </Link>
                  )}
                  
                  {/* 🔥 관리자만: 보고서 */}
                  {isAdmin && (
                    <Link to="/reports" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                      보고서
                    </Link>
                  )}
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
                  {/* 🔥 관리자만: 대시보드 */}
                  {isAdmin && (
                    <Link 
                      to="/" 
                      onClick={closeMobileMenu}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                    >
                      🏠 대시보드
                    </Link>
                  )}
                  
                  {/* 모든 사용자: 자산관리 */}
                  <Link 
                    to="/assets" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    💼 자산관리
                  </Link>
                  
                  {/* 모든 사용자: 장애처리 */}
                  <Link 
                    to="/issues" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  >
                    🚨 장애처리
                  </Link>
                  
                  {/* 🔥 관리자만: 통계 */}
                  {isAdmin && (
                    <Link 
                      to="/statistics" 
                      onClick={closeMobileMenu}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                    >
                      📊 통계
                    </Link>
                  )}
                  
                  {/* 🔥 관리자만: 재고실사 */}
                  {isAdmin && (
                    <Link 
                      to="/inspections" 
                      onClick={closeMobileMenu}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                    >
                      📋 재고실사
                    </Link>
                  )}
                  
                  {/* 모든 사용자: QR 스캔 */}
                  <Link 
                    to="/mobile/qr-scan" 
                    onClick={closeMobileMenu}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2 bg-green-50 dark:bg-green-900/30 rounded-lg px-3"
                  >
                    📱 QR 스캔
                  </Link>
                  
                  {/* 🔥 관리자만: QR 인쇄 */}
                  {isAdmin && (
                    <Link 
                      to="/qr-print" 
                      onClick={closeMobileMenu}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                    >
                      🖨️ QR 일괄 인쇄
                    </Link>
                  )}
                  
                  {/* 🔥 관리자만: 설정 */}
                  {isAdmin && (
                    <Link 
                      to="/settings" 
                      onClick={closeMobileMenu}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                    >
                      ⚙️ 설정
                    </Link>
                  )}
                  
                  {/* 🔥 관리자만: 보고서 */}
                  {isAdmin && (
                    <Link 
                      to="/reports" 
                      onClick={closeMobileMenu}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                    >
                      📄 보고서
                    </Link>
                  )}
                  
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
            {/* 🔥 대시보드: 관리자는 대시보드, 일반 사용자는 자산목록으로 */}
            <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/assets" replace />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* 🔥 관리자만: 사용자 관리 */}
            <Route path="/users" element={isAdmin ? <UserManagement /> : <Navigate to="/assets" replace />} />
            
            {/* 자산 관련 */}
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={isAdmin ? <AssetForm /> : <Navigate to="/assets" replace />} />
            <Route path="/assets/bulk-upload" element={isAdmin ? <AssetBulkUpload /> : <Navigate to="/assets" replace />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/assets/edit/:id" element={isAdmin ? <AssetEdit /> : <Navigate to="/assets" replace />} />
            
            {/* 장애 관련 */}
            <Route path="/issues" element={<IssueList />} />
            <Route path="/issues/new" element={<IssueForm />} />
            <Route path="/issues/edit/:id" element={<IssueEdit />} />
            
            {/* 🔥 관리자만: 통계, 대시보드 설정, 설정, 보고서 */}
            <Route path="/statistics" element={isAdmin ? <Statistics /> : <Navigate to="/assets" replace />} />
            <Route path="/dashboard-settings" element={isAdmin ? <DashboardSettings /> : <Navigate to="/assets" replace />} />
            <Route path="/settings" element={isAdmin ? <Settings /> : <Navigate to="/assets" replace />} />
            <Route path="/reports" element={isAdmin ? <Reports /> : <Navigate to="/assets" replace />} />
            
            {/* 🔥 관리자만: 재고 실사 목록 */}
            <Route path="/inspections" element={isAdmin ? <InspectionList /> : <Navigate to="/assets" replace />} />
            
            {/* 모바일 QR 관련 (모든 사용자) */}
            <Route path="/mobile/qr-scan" element={<QRActionSelector />} />
            <Route path="/mobile/asset/:assetNumber" element={<MobileAssetView />} />
            <Route path="/mobile/inspection/:assetNumber" element={<MobileInspection />} />
            
            {/* 기존 모바일 스캔 (하위 호환성 유지) */}
            <Route path="/mobile/scan" element={<MobileQRScanner />} />
            
            {/* 🔥 관리자만: QR 일괄 인쇄 */}
            <Route path="/qr-print" element={isAdmin ? <QRPrintPage /> : <Navigate to="/assets" replace />} />
            
            <Route path="*" element={<Navigate to={isAdmin ? "/" : "/assets"} replace />} />
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