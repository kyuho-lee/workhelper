import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from './config/api';

function MobileAssetView() {
  const { assetNumber } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [formData, setFormData] = useState({
    status: '',
    location: '',
    assigned_to: '',
    notes: ''
  });

  useEffect(() => {
    fetchAsset();
    fetchCategories();
    fetchLocations();
  }, [assetNumber]);

  const fetchAsset = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/assets/by-number/${assetNumber}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setAsset(response.data);
      setFormData({
        status: response.data.status || '정상',
        location: response.data.location || '',
        assigned_to: response.data.assigned_to || '',
        notes: response.data.notes || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('자산 조회 실패:', error);
      setMessage({ type: 'error', text: '자산을 찾을 수 없습니다.' });
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/assets/${asset.id}`,
        {
          ...asset,
          status: formData.status,
          location: formData.location,
          assigned_to: formData.assigned_to,
          notes: formData.notes
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // 음성 피드백
      const speech = new SpeechSynthesisUtterance('저장 완료');
      speech.lang = 'ko-KR';
      window.speechSynthesis.speak(speech);

      // 진동 피드백
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setMessage({ type: 'success', text: '✅ 저장되었습니다!' });
      setEditMode(false);
      fetchAsset(); // 새로고침

      // 메시지 3초 후 제거
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('저장 실패:', error);
      setMessage({ type: 'error', text: '❌ 저장에 실패했습니다.' });
    } finally {
      setSaving(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return `₩${Number(value).toLocaleString('ko-KR')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-y-auto">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-20 bg-black/30 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleGoBack}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="text-white text-lg font-bold">
            📦 자산 관리
          </h1>
          <button
            onClick={handleScanAnother}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            📷 스캔
          </button>
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
      <div className="p-4 pb-24">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 자산 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">자산번호</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                asset.status === '정상' ? 'bg-green-400 text-green-900' :
                asset.status === '수리중' ? 'bg-yellow-400 text-yellow-900' :
                'bg-red-400 text-red-900'
              }`}>
                {asset.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{asset.asset_number}</h2>
            <p className="text-blue-100 mt-1">{asset.name}</p>
          </div>

          {/* 자산 정보 */}
          <div className="p-6">
            {/* 기본 정보 */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">기본 정보</h3>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">분류</span>
                  <span className="font-medium">{asset.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">제조사</span>
                  <span className="font-medium">{asset.manufacturer || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">모델</span>
                  <span className="font-medium">{asset.model || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">시리얼번호</span>
                  <span className="font-medium text-sm">{asset.serial_number || '-'}</span>
                </div>
              </div>
            </div>

            {/* 위치 및 담당자 */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">위치 및 담당자</h3>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">위치</span>
                  <span className="font-medium">{asset.location || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">담당자</span>
                  <span className="font-medium">{asset.assigned_to || '-'}</span>
                </div>
              </div>
            </div>

            {/* 구매 정보 */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">구매 정보</h3>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">구매가격</span>
                  <span className="font-medium">{formatCurrency(asset.purchase_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">구매일</span>
                  <span className="font-medium">{formatDate(asset.purchase_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">보증종료</span>
                  <span className="font-medium">{formatDate(asset.warranty_end_date)}</span>
                </div>
              </div>
            </div>

            {/* 수정 모드 */}
            {editMode ? (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800">✏️ 정보 수정</h3>
                
                {/* 상태 선택 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">상태</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['정상', '수리중', '폐기'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(status)}
                        className={`py-3 rounded-xl font-medium transition-all ${
                          formData.status === status
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 위치 선택 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">위치</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                  >
                    <option value="">위치 선택</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                {/* 담당자 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">담당자</label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all"
                    placeholder="담당자 이름"
                  />
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">메모</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all resize-none"
                    placeholder="메모 입력"
                  />
                </div>

                {/* 버튼들 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        status: asset.status,
                        location: asset.location || '',
                        assigned_to: asset.assigned_to || '',
                        notes: asset.notes || ''
                      });
                    }}
                    className="flex-1 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl"
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? '저장 중...' : '💾 저장'}
                  </button>
                </div>
              </div>
            ) : (
              /* 수정 버튼 */
              <button
                onClick={() => setEditMode(true)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                ✏️ 정보 수정하기
              </button>
            )}
          </div>
        </div>

        {/* 추가 액션 버튼들 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* 🔥 관리자만: 재고실사 버튼 */}
          {isAdmin && (
            <button
              onClick={() => navigate(`/mobile/inspection/${assetNumber}`)}
              className="py-4 bg-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              📋 재고실사
            </button>
          )}
          <button
            onClick={handleScanAnother}
            className={`py-4 bg-green-600 text-white font-bold rounded-xl hover:shadow-lg transition-all ${!isAdmin ? 'col-span-2' : ''}`}
          >
            📷 다른 자산 스캔
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileAssetView;