import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from './config/api';

function IssueForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: '보통',
    reporter: user.username,
    assignee: user.username,
    asset_number: searchParams.get('asset_number') || ''
  });

  // 사용자 목록 불러오기
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/api/users/simple-list', {  // ← simple-list 사용!
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.reporter) {
      alert('제목과 신고자는 필수 항목입니다.');
      return;
    }

    try {
      await axios.post('${API_BASE_URL}/api/issues', formData);
      alert('장애가 등록되었습니다.');
      
      // 관련 자산이 있으면 자산 상세로, 없으면 장애 목록으로
      if (formData.asset_number) {
        // 자산번호로 자산 ID 찾기
        const assetsRes = await axios.get('${API_BASE_URL}/api/assets');
        const asset = assetsRes.data.find(a => a.asset_number === formData.asset_number);
        if (asset) {
          navigate(`/assets/${asset.id}`);
        } else {
          navigate('/issues');
        }
      } else {
        navigate('/issues');
      }
    } catch (error) {
      alert('등록 실패');
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">장애 등록</h2>
        <button
          onClick={() => navigate('/issues')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          취소
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                우선순위 *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option>낮음</option>
                <option>보통</option>
                <option>높음</option>
                <option>긴급</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태 *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="open">처리중</option>
                <option value="in_progress">진행중</option>
                <option value="resolved">해결됨</option>
                <option value="closed">종료</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                신고자 *
              </label>
              <input
                type="text"
                name="reporter"
                value={formData.reporter}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 dark:text-white cursor-not-allowed"
                readOnly
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                현재 로그인한 사용자로 자동 설정됩니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                담당자
              </label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="">선택하세요</option>
                {users.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.full_name} ({u.username})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                담당자를 지정하면 알림이 전송됩니다
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              관련 자산번호
              {searchParams.get('asset_number') && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                  (자동 입력됨)
                </span>
              )}
            </label>
            <input
              type="text"
              name="asset_number"
              value={formData.asset_number}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              placeholder="예: PC001"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              이 장애와 관련된 자산의 번호를 입력하세요
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
}

export default IssueForm;