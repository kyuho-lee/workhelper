import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from './config/api';

function MobileInspection() {
  const { assetNumber } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  // 🔥 모든 Hooks를 먼저 선언
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [alreadyInspected, setAlreadyInspected] = useState(false);
  
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({
    total_assets: 0,
    inspected_count: 0,
    pending_count: 0,
    inspection_rate: 0
  });
  
  const [formData, setFormData] = useState({
    status: '정상',
    actual_location: '',
    condition_notes: ''
  });

  useEffect(() => {
    // 🔥 관리자가 아니면 데이터 fetch 안 함
    if (!isAdmin) return;
    
    fetchAsset();
    fetchLocations();
    fetchStats();
  }, [assetNumber, isAdmin]);

  // 🔥 관리자가 아니면 자산 페이지로 리다이렉트 (Hooks 선언 후에 조건부 리턴)
  if (!isAdmin) {
    return <Navigate to={`/mobile/asset/${assetNumber}`} replace />;
  }

  const fetchAsset = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/inspections/scan/${assetNumber}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.already_inspected) {
        setAlreadyInspected(true);
        setAsset(response.data.asset);
      } else {
        setAsset(response.data.asset);
        setFormData(prev => ({
          ...prev,
          actual_location: response.data.asset.location || ''
        }));
      }
      setLoading(false);
    } catch (error) {
      console.error('자산 조회 실패:', error);
      setMessage({ type: 'error', text: '자산을 찾을 수 없습니다.' });
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/locations`);
      setLocations(response.data);
    } catch (error) {
      console.error('위치 조회 실패:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/inspections/stats`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setStats(response.data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const handleSubmit = async () => {
    if (!asset) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/inspections/scan`,
        {
          asset_number: asset.asset_number,
          status: formData.status,
          actual_location: formData.actual_location,
          condition_notes: formData.condition_notes
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // 음성 피드백
      const speech = new SpeechSynthesisUtterance('실사 완료');
      speech.lang = 'ko-KR';
      window.speechSynthesis.speak(speech);

      // 진동 피드백
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setMessage({ type: 'success', text: '✅ 실사가 완료되었습니다!' });
      
      // 2초 후 다음 스캔으로 이동
      setTimeout(() => {
        navigate('/mobile/qr-scan');
      }, 2000);

    } catch (error) {
      console.error('실사 저장 실패:', error);
      setMessage({ type: 'error', text: '❌ 저장에 실패했습니다.' });
      setSubmitting(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleScanAnother = () => {
    navigate('/mobile/qr-scan');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-700">자산 정보 조회 중...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full">
          <p className="text-xl mb-4">❌ 자산을 찾을 수 없습니다</p>
          <button
            onClick={handleGoBack}
            className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 이미 실사 완료된 경우
  if (alreadyInspected) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold">이미 실사 완료</h2>
              <p className="text-green-100 mt-2">이 자산은 이미 실사가 완료되었습니다</p>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-gray-500 w-24 text-sm">자산번호</span>
                  <span className="font-bold text-green-600">{asset.asset_number}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-24 text-sm">품목명</span>
                  <span className="font-medium">{asset.name}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/mobile/asset/${assetNumber}`)}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl"
                >
                  📦 자산 정보 보기
                </button>
                <button
                  onClick={handleScanAnother}
                  className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl"
                >
                  📷 다른 자산 스캔
                </button>
                <button
                  onClick={handleGoBack}
                  className="w-full py-4 bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  ← 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 overflow-y-auto">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-20 bg-black/30 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={handleGoBack}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="text-white text-lg font-bold">
            📋 재고 실사
          </h1>
          <button
            onClick={handleScanAnother}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            📷 스캔
          </button>
        </div>
        
        {/* 통계 */}
        <div className="flex justify-around text-white text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-green-400">{stats.inspected_count}</div>
            <div className="text-xs opacity-80">완료</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-yellow-400">{stats.pending_count}</div>
            <div className="text-xs opacity-80">미실사</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-400">{stats.inspection_rate}%</div>
            <div className="text-xs opacity-80">진행률</div>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      {message.text && (
        <div className={`mx-4 mt-2 p-4 rounded-xl text-center font-bold ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="p-4 pb-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 자산 정보 헤더 */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h2 className="text-xl font-bold mb-2">🔍 자산 정보</h2>
            <p className="text-purple-100 text-sm">실사 정보를 입력해주세요</p>
          </div>

          <div className="p-6 space-y-4">
            {/* 자산 정보 요약 */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center">
                <span className="text-gray-500 w-24 text-sm">자산번호</span>
                <span className="font-bold text-lg text-purple-600">{asset.asset_number}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-24 text-sm">품목명</span>
                <span className="font-semibold text-gray-800">{asset.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-24 text-sm">분류</span>
                <span className="text-gray-700">{asset.category}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-24 text-sm">등록위치</span>
                <span className="text-gray-700">{asset.location || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-24 text-sm">담당자</span>
                <span className="text-gray-700">{asset.assigned_to || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-24 text-sm">현재상태</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  asset.status === '정상' ? 'bg-green-100 text-green-800' :
                  asset.status === '수리중' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {asset.status}
                </span>
              </div>
            </div>

            {/* 실사 입력 폼 */}
            <div className="space-y-4 pt-4">
              {/* 실사 결과 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  실사 결과 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['정상', '위치불일치', '상태이상', '분실'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        formData.status === status
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 실제 위치 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  실제 위치
                </label>
                <select
                  value={formData.actual_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, actual_location: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
                >
                  <option value="">위치 선택</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  value={formData.condition_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition_notes: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  placeholder="특이사항을 입력하세요 (선택)"
                />
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleGoBack}
                className="flex-1 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? '저장 중...' : '✅ 실사 완료'}
              </button>
            </div>
          </div>
        </div>

        {/* 자산 관리 버튼 */}
        <button
          onClick={() => navigate(`/mobile/asset/${assetNumber}`)}
          className="w-full mt-4 py-4 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
        >
          📦 자산 정보 상세보기
        </button>
      </div>
    </div>
  );
}

export default MobileInspection;