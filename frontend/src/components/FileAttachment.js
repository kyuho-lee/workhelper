import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';  // FileSaver.js import
import { useAuth } from '../context/AuthContext';

function FileAttachment({ entityType, entityId }) {
  const { user, isAdmin } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const fetchAttachments = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/attachments/${entityType}/${entityId}`
      );
      setAttachments(response.data);
    } catch (error) {
      console.error('첨부파일 조회 실패:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `http://localhost:8000/api/attachments?entity_type=${entityType}&entity_id=${entityId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('파일이 업로드되었습니다.');
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
      fetchAttachments();
    } catch (error) {
      console.error('업로드 실패:', error);
      alert(error.response?.data?.detail || '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      
      // axios로 blob 다운로드
      const response = await axios.get(
        `http://localhost:8000/api/attachments/download/${attachment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // FileSaver.js를 사용하여 다운로드
      saveAs(response.data, attachment.filename);
      
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const handleDelete = async (attachmentId, uploadedBy) => {
    if (!isAdmin && uploadedBy !== user.username) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (!window.confirm('정말 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8000/api/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('파일이 삭제되었습니다.');
      fetchAttachments();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (contentType) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType === 'application/pdf') return '📄';
    if (contentType.includes('word')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    if (contentType.includes('zip')) return '📦';
    return '📎';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        📎 첨부파일 ({attachments.length})
      </h3>

      {/* 파일 업로드 */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
        <div className="flex items-center gap-4">
          <input
            id="fileInput"
            type="file"
            onChange={handleFileSelect}
            className="flex-1 text-sm text-gray-700 dark:text-gray-300"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`px-4 py-2 rounded text-white ${
              uploading || !selectedFile
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          허용: 이미지(jpg, png, gif), 문서(pdf, doc, xls, txt), 압축(zip) | 최대 10MB
        </p>
      </div>

      {/* 첨부파일 목록 */}
      {attachments.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          첨부된 파일이 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{getFileIcon(attachment.content_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.filesize)} • {attachment.uploaded_by} • 
                    {' '}{new Date(attachment.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(attachment)}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  다운로드
                </button>
                {(isAdmin || attachment.uploaded_by === user.username) && (
                  <button
                    onClick={() => handleDelete(attachment.id, attachment.uploaded_by)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileAttachment;