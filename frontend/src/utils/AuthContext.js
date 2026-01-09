import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 초기 로드 시 로컬스토리지에서 사용자 정보 복원
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
        
        // 마지막 활동 시간 초기화
        localStorage.setItem('lastActivity', Date.now().toString());
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('lastActivity', Date.now().toString());
    setUser(userData);
    setIsAdmin(userData.role === 'admin');
  };

  const logout = (message = null) => {
    // 로컬스토리지 정리
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    
    // 상태 초기화
    setUser(null);
    setIsAdmin(false);
    
    // 메시지가 있으면 표시
    if (message) {
      alert(message);
    }
    
    // 로그인 페이지로 이동
    navigate('/login');
  };

  const value = {
    user,
    isAdmin,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};