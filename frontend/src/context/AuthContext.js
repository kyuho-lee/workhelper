import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../components/config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // axios 기본 헤더에 토큰 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 🔥 Axios Interceptor 설정
      setupAxiosInterceptor();
    }
    setLoading(false);
  }, []);

  // 🔥 토큰 만료 시간 확인 함수
  const isTokenExpiringSoon = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - currentTime;
      
      // 5분(300초) 이내 만료 예정이면 true
      return timeUntilExpiry < 300;
    } catch (error) {
      return true; // 디코딩 실패하면 갱신 필요
    }
  };

  // 🔥 Axios Interceptor 설정
  const setupAxiosInterceptor = () => {
    // 요청 인터셉터: API 호출 전에 토큰 체크
    axios.interceptors.request.use(
      async (config) => {
        const token = localStorage.getItem('token');
        
        // refresh API는 제외 (무한 루프 방지)
        if (config.url?.includes('/auth/refresh')) {
          return config;
        }
        
        if (token && isTokenExpiringSoon(token) && !isRefreshingRef.current) {
          console.log('🔄 토큰 만료 임박 - 갱신 시작');
          await refreshToken();
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터: 401 에러 시 토큰 갱신 시도
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // 401 에러 && 재시도 안 했으면
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await refreshToken();
            // 토큰 갱신 후 원래 요청 재시도
            return axios(originalRequest);
          } catch (refreshError) {
            // 갱신 실패 → 로그아웃
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  };

  // 🔥 토큰 갱신 함수
  const refreshToken = async () => {
    if (isRefreshingRef.current) {
      return; // 이미 갱신 중이면 중복 방지
    }
    
    isRefreshingRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 새 토큰으로 교체
      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      console.log('✅ 토큰 갱신 완료 (활동 감지):', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      
      // 401 에러면 로그아웃
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    
    // 🔥 로그인 시 Interceptor 설정
    setupAxiosInterceptor();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    refreshToken, // 🔥 수동 갱신용 (필요 시)
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl dark:text-white">로딩중...</div>
    </div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}