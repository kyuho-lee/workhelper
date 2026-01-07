import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Comments from './Comments';
import FileAttachment from './FileAttachment';

function IssueEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);  // 사용자 목록 추가
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    reporter: '',
    assignee: '',
    asset_number: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssue();
    fetchUsers();  // 사용자 목록 불러오기
  }, [id]);

  const fetchIssue = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/issues/${id}`);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      alert('장애 정보를 불러오지 못했습니다.');
      navigate('/issues');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/users/simple-list', {
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
      await axios.put(`http://localhost:8000/api/issues/${id}`, formData);
      alert('장애가 수정되었습니다.');
      navigate('/issues');
    } catch (error) {
      alert('수정 실패');
      console.error(error);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">장애 수정</h2>
        <button
          onClick={() => navigate('/issues')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          취소
        </button>
      </div>

      {/* 수정 폼 */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
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
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                담당자
              </label>
              <select
                name="assignee"
                value={formData.assignee || ''}
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
                담당자 변경 시 알림이 전송됩니다
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              관련 자산번호
            </label>
            <input
              type="text"
              name="asset_number"
              value={formData.asset_number || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              placeholder="예: PC001"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            수정
          </button>
        </div>
      </form>

      {/* 첨부파일 섹션 */}
      <div className="mb-6">
        <FileAttachment entityType="issue" entityId={parseInt(id)} />
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          댓글 및 작업 이력
        </h3>
        <Comments targetType="issue" targetId={parseInt(id)} />
      </div>
    </div>
  );
}

export default IssueEdit;