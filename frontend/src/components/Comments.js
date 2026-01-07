import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Comments({ targetType, targetId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [targetType, targetId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/comments/${targetType}/${targetId}`);
      setComments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await axios.post(`http://localhost:8000/api/comments/${targetType}/${targetId}`, {
        content: newComment
      });
      
      setNewComment('');
      fetchComments();
    } catch (error) {
      alert('댓글 작성 실패: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (commentId) => {
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/comments/${commentId}`, {
        content: editContent
      });
      
      setEditingId(null);
      setEditContent('');
      fetchComments();
    } catch (error) {
      alert('댓글 수정 실패: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/comments/${commentId}`);
      fetchComments();
    } catch (error) {
      alert('댓글 삭제 실패: ' + (error.response?.data?.detail || error.message));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return <div className="text-center py-4 dark:text-white">로딩중...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          댓글 작성
        </label>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows="3"
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
          placeholder="댓글을 입력하세요..."
        />
        <button
          type="submit"
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          댓글 작성
        </button>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          댓글 {comments.length}개
        </h4>
        
        {comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            아직 댓글이 없습니다.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {comment.author}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {formatDate(comment.created_at)}
                  </span>
                  {comment.created_at !== comment.updated_at && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                      (수정됨)
                    </span>
                  )}
                </div>
                
                {(comment.author_id === user.id || user.role === 'admin') && (
                  <div className="flex gap-2">
                    {comment.author_id === user.id && (
                      <button
                        onClick={() => handleEdit(comment)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        수정
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Comments;