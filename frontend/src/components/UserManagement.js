import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './config/api';

function UserManagement() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const resetPassword = async (userId, username) => {
    if (userId === user.id) {
      alert('자기 자신의 비밀번호는 초기화할 수 없습니다.');
      return;
    }

    if (window.confirm(`'${username}' 사용자의 비밀번호를 초기화하시겠습니까?`)) {
      try {
        const response = await axios.put(`${API_BASE_URL}/api/users/${userId}/reset-password`);
        
        alert(
          `비밀번호가 초기화되었습니다.\n\n` +
          `아이디: ${response.data.username}\n` +
          `임시 비밀번호: ${response.data.temp_password}\n\n` +
          `사용자에게 전달해주세요.`
        );
      } catch (error) {
        alert('비밀번호 초기화 실패: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const deleteUser = async (userId, username) => {
    if (userId === user.id) {
      alert('자기 자신은 삭제할 수 없습니다.');
      return;
    }

    if (window.confirm(`정말 '${username}' 사용자를 삭제하시겠습니까?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
        alert('사용자가 삭제되었습니다.');
        fetchUsers();
      } catch (error) {
        alert('삭제 실패: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">사용자 관리</h2>
        <button
          onClick={() => navigate('/profile')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          프로필로 돌아가기
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        총 {users.length}명의 사용자
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">아이디</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">권한</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">가입일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {u.username}
                  {u.id === user.id && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(나)</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {u.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {u.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    u.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {u.role === 'admin' ? '관리자' : '일반'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    u.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {u.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(u.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {u.id !== user.id && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => resetPassword(u.id, u.username)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        비밀번호 초기화
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.username)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;