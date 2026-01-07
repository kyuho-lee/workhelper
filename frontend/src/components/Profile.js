import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 정책 검증
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (passwordData.new_password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (!passwordRegex.test(passwordData.new_password)) {
      setError('비밀번호는 대문자, 소문자, 숫자, 특수문자(@$!%*?&)를 각각 1개 이상 포함해야 합니다.');
      return;
    }

    try {
      await axios.put('http://localhost:8000/api/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setSuccess('비밀번호가 변경되었습니다.');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
    } catch (error) {
      setError(error.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">내 프로필</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 사용자 정보 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold dark:text-white mb-4">기본 정보</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">아이디</span>
              <p className="font-medium dark:text-white">{user.username}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">이름</span>
              <p className="font-medium dark:text-white">{user.full_name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">이메일</span>
              <p className="font-medium dark:text-white">{user.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">권한</span>
              <p className="font-medium dark:text-white">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {user.role === 'admin' ? '관리자' : '일반 사용자'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold dark:text-white mb-4">계정 관리</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              비밀번호 변경
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/users')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
              >
                사용자 관리
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 폼 */}
      {showPasswordChange && (
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold dark:text-white mb-4">비밀번호 변경</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  새 비밀번호 (8자 이상, 대소문자/숫자/특수문자 포함)
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                >
                  변경
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded"
                >
                  취소
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Profile;