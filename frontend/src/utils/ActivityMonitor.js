import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { refreshToken } from '../utils/axiosInstance';

const ActivityMonitor = () => {
  const { user, logout } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const refreshIntervalRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // 활동 감지 설정
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)
  const REFRESH_INTERVAL = 25 * 60 * 1000;   // 25분마다 갱신 (30분 전에 갱신)
  const CHECK_INTERVAL = 60 * 1000;          // 1분마다 체크

  useEffect(() => {
    // 로그인하지 않았으면 모니터링 안 함
    if (!user) return;

    // 활동 이벤트 핸들러
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // 이벤트 리스너 등록
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // 정기적으로 토큰 갱신 (25분마다)
    refreshIntervalRef.current = setInterval(async () => {
      const lastActivity = lastActivityRef.current;
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      // 활동이 있었으면 토큰 갱신
      if (timeSinceActivity < INACTIVITY_TIMEOUT) {
        console.log('🔄 활동 감지됨. 토큰 갱신 중...');
        await refreshToken();
      }
    }, REFRESH_INTERVAL);

    // 비활동 체크 (1분마다)
    checkIntervalRef.current = setInterval(() => {
      const lastActivity = lastActivityRef.current;
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      // 30분 동안 활동 없으면 로그아웃
      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        console.log('⏰ 30분 동안 활동 없음. 자동 로그아웃.');
        clearInterval(refreshIntervalRef.current);
        clearInterval(checkIntervalRef.current);
        logout('30분 동안 활동이 없어 자동 로그아웃되었습니다.');
      }
    }, CHECK_INTERVAL);

    // 초기 활동 시간 설정
    handleActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, logout]);

  // 화면에 렌더링하지 않음
  return null;
};

export default ActivityMonitor;