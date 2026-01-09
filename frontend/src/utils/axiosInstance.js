import axios from 'axios';
import API_BASE_URL from '../components/config/api';

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// Request interceptor - 모든 요청에 토큰 자동 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 에러 처리
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 토큰 만료 또는 인증 실패
      
      // 로컬스토리지 정리
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      
      // 사용자에게 알림
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// 토큰 갱신 함수
export const refreshToken = async () => {
  try {
    const response = await axiosInstance.post('/api/auth/refresh');
    
    if (response.data.access_token) {
      // 새 토큰 저장
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('lastActivity', Date.now().toString());
      
      console.log('✅ 토큰 자동 갱신 완료');
      return true;
    }
  } catch (error) {
    console.error('❌ 토큰 갱신 실패:', error);
    return false;
  }
};

export default axiosInstance;