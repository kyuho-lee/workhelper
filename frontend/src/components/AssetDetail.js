import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Comments from './Comments';
import FileAttachment from './FileAttachment';

function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [relatedIssues, setRelatedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // info, issues, history, comments, attachments

  useEffect(() => {
    fetchAssetData();
  }, [id]);

  const fetchAssetData = async () => {
    try {
      const [assetRes, issuesRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/assets/${id}`),
        axios.get(`http://localhost:8000/api/assets/${id}/issues`)
      ]);
      setAsset(assetRes.data);
      setRelatedIssues(issuesRes.data);
      setLoading(false);
    } catch (error) {
      alert('자산 정보를 불러오지 못했습니다.');
      navigate('/assets');
    }
  };

  const downloadQR = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/qr/generate/${asset.asset_number}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${asset.asset_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('QR 코드 다운로드 실패');
      console.error('QR download error:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'open': '처리중',
      'in_progress': '진행중',
      'resolved': '해결됨',
      'closed': '종료'
    };
    return texts[status] || status;
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;
  if (!asset) return null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">자산 상세 정보</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {asset.asset_number} - {asset.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/assets/edit/${id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            수정
          </Link>
          <button
            onClick={() => navigate('/assets')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            목록으로
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2">
          {/* 탭 버튼 */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-3 px-2 ${
                  activeTab === 'info'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                기본 정보
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className={`pb-3 px-2 ${
                  activeTab === 'issues'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                관련 장애 ({relatedIssues.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 px-2 ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                변경 이력
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 px-2 ${
                  activeTab === 'comments'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                댓글
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`pb-3 px-2 ${
                  activeTab === 'attachments'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                📎 첨부파일
              </button>
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            {/* 기본 정보 탭 */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold dark:text-white mb-4">자산 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">자산번호</span>
                    <p className="font-medium dark:text-white">{asset.asset_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">이름</span>
                    <p className="font-medium dark:text-white">{asset.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">분류</span>
                    <p className="font-medium dark:text-white">{asset.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">제조사</span>
                    <p className="font-medium dark:text-white">{asset.manufacturer || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">모델</span>
                    <p className="font-medium dark:text-white">{asset.model || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">상태</span>
                    <p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        asset.status === '정상' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        asset.status === '수리중' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {asset.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">위치</span>
                    <p className="font-medium dark:text-white">{asset.location || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">담당자</span>
                    <p className="font-medium dark:text-white">{asset.assigned_to || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">구매일</span>
                    <p className="font-medium dark:text-white">
                      {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">등록일</span>
                    <p className="font-medium dark:text-white">
                      {new Date(asset.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                {asset.notes && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">메모</span>
                    <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{asset.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* 관련 장애 탭 */}
            {activeTab === 'issues' && (
              <div>
                <h3 className="text-lg font-semibold dark:text-white mb-4">관련 장애 목록</h3>
                {relatedIssues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>관련된 장애가 없습니다.</p>
                    <Link 
                      to="/issues/new" 
                      className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                    >
                      장애 등록하기 →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatedIssues.map(issue => (
                      <div key={issue.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <Link 
                            to={`/issues/edit/${issue.id}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {issue.title}
                          </Link>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue.status)}`}>
                            {getStatusText(issue.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{issue.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>우선순위: {issue.priority}</span>
                          <span>신고자: {issue.reporter}</span>
                          <span>담당자: {issue.assignee || '-'}</span>
                          <span>등록: {new Date(issue.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 변경 이력 탭 */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold dark:text-white mb-4">변경 이력</h3>
                <div className="space-y-3">
                  <div className="border-l-2 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium dark:text-white">자산 등록</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">최초 등록됨</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(asset.created_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  {asset.updated_at !== asset.created_at && (
                    <div className="border-l-2 border-green-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium dark:text-white">정보 수정</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">자산 정보가 업데이트됨</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(asset.updated_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-4">
                    * 상세 변경 이력은 향후 업데이트 예정입니다.
                  </p>
                </div>
              </div>
            )}

            {/* 댓글 탭 */}
            {activeTab === 'comments' && (
              <div>
                <Comments targetType="asset" targetId={parseInt(id)} />
              </div>
            )}

            {/* 첨부파일 탭 - 새로 추가! */}
            {activeTab === 'attachments' && (
              <div>
                <FileAttachment entityType="asset" entityId={parseInt(id)} />
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* QR 코드 */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold dark:text-white mb-4">QR 코드</h3>
            <img
              src={`http://localhost:8000/api/qr/generate/${asset.asset_number}`}
              alt="QR Code"
              className="mx-auto mb-4 border dark:border-gray-700 p-2 bg-white"
            />
            <button
              onClick={downloadQR}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full mb-2"
            >
              QR 코드 다운로드
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              모바일에서 스캔하여 자산 정보 확인
            </p>
          </div>

          {/* 통계 */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold dark:text-white mb-4">통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">관련 장애</span>
                <span className="font-medium dark:text-white">{relatedIssues.length}건</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">미해결 장애</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {relatedIssues.filter(i => i.status === 'open' || i.status === 'in_progress').length}건
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">해결된 장애</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {relatedIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length}건
                </span>
              </div>
            </div>
          </div>

          {/* 빠른 작업 */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold dark:text-white mb-4">빠른 작업</h3>
            <div className="space-y-2">
              <Link
                to={`/assets/edit/${id}`}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center px-4 py-2 rounded"
              >
                자산 정보 수정
              </Link>
              <Link
                to={`/issues/new?asset_number=${asset.asset_number}`}
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center px-4 py-2 rounded"
              >
                관련 장애 등록
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetDetail;