import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

function MobileQRScanner() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [stats, setStats] = useState({
    total_assets: 0,
    inspected_count: 0,
    pending_count: 0,
    inspection_rate: 0
  });
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    status: '정상',
    actual_location: '',
    condition_notes: ''
  });
  
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    fetchStats();
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
      );
      
      setScanning(true);
    } catch (err) {
      console.error("카메라 시작 실패:", err);
      setMessage('카메라 접근 권한을 허용해주세요.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error("스캐너 정지 오류:", err);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    // 진동
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // 음성 피드백
    const speech = new SpeechSynthesisUtterance('스캔 성공');
    speech.lang = 'ko-KR';
    speech.rate = 1.2;
    window.speechSynthesis.speak(speech);

    // 스캐너 일시 중지
    await stopScanner();

    // 자산 조회
    fetchAsset(decodedText);
  };

  const onScanError = (error) => {
    // 무시 (계속 스캔)
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/inspections/stats`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setStats(response.data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const fetchAsset = async (assetNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/inspections/scan/${assetNumber}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.already_inspected) {
        setMessage('⚠️ 이미 실사 완료된 자산입니다!');
        
        const speech = new SpeechSynthesisUtterance('이미 완료');
        speech.lang = 'ko-KR';
        window.speechSynthesis.speak(speech);
        
        setTimeout(() => {
          setMessage('');
          startScanner();
        }, 2000);
        return;
      }

      setScannedAsset(response.data.asset);
      setFormData({
        status: '정상',
        actual_location: response.data.asset.location || '',
        condition_notes: ''
      });
      setMessage('');
    } catch (error) {
      console.error('자산 조회 실패:', error);
      setMessage('❌ 자산을 찾을 수 없습니다!');
      
      const speech = new SpeechSynthesisUtterance('오류');
      speech.lang = 'ko-KR';
      window.speechSynthesis.speak(speech);
      
      setTimeout(() => {
        setMessage('');
        startScanner();
      }, 2000);
    }
  };

  const handleSubmit = async () => {
    if (!scannedAsset) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/inspections/scan`,
        {
          asset_number: scannedAsset.asset_number,
          status: formData.status,
          actual_location: formData.actual_location,
          condition_notes: formData.condition_notes
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setMessage('✅ 실사 완료!');
      
      const speech = new SpeechSynthesisUtterance('실사 완료');
      speech.lang = 'ko-KR';
      window.speechSynthesis.speak(speech);

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setTimeout(() => {
        setScannedAsset(null);
        setFormData({
          status: '정상',
          actual_location: '',
          condition_notes: ''
        });
        setMessage('');
        fetchStats();
        startScanner();
      }, 1500);

    } catch (error) {
      console.error('실사 저장 실패:', error);
      setMessage('❌ 저장 실패. 다시 시도해주세요.');
    }
  };

  const handleCancel = () => {
    setScannedAsset(null);
    setFormData({
      status: '정상',
      actual_location: '',
      condition_notes: ''
    });
    setMessage('');
    startScanner();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
      {/* 상단 헤더 (반투명) */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <h1 className="text-white text-xl font-bold text-center mb-2">
          📱 재고 실사
        </h1>
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

      {/* 카메라 뷰 */}
      {!scannedAsset && (
        <div className="relative w-full h-full">
          <div id="qr-reader" className="w-full h-full"></div>
          
          {/* 스캔 가이드 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* 스캔 박스 */}
              <div className="w-64 h-64 border-4 border-white rounded-3xl shadow-2xl animate-pulse">
                {/* 모서리 강조 */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-blue-500 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-blue-500 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-blue-500 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-blue-500 rounded-br-3xl"></div>
              </div>
              
              {/* 스캔 라인 애니메이션 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan"></div>
            </div>
          </div>

          {/* 하단 안내 */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
            <p className="text-white text-lg font-medium mb-2">
              QR 코드를 스캔 영역에 맞춰주세요
            </p>
            <p className="text-white/60 text-sm">
              자동으로 인식됩니다
            </p>
          </div>

          {/* 메시지 오버레이 */}
          {message && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="bg-white rounded-2xl shadow-2xl p-6 text-center animate-bounce">
                <p className="text-xl font-bold text-gray-800">{message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 자산 정보 모달 */}
      {scannedAsset && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 overflow-y-auto z-30">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">🔍 자산 정보</h2>
                <p className="text-blue-100 text-sm">실사 정보를 입력해주세요</p>
              </div>

              {/* 자산 정보 카드 */}
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 text-sm">자산번호</span>
                    <span className="font-bold text-lg text-blue-600">{scannedAsset.asset_number}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 text-sm">품목명</span>
                    <span className="font-semibold text-gray-800">{scannedAsset.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 text-sm">분류</span>
                    <span className="text-gray-700">{scannedAsset.category}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 text-sm">등록위치</span>
                    <span className="text-gray-700">{scannedAsset.location}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 text-sm">담당자</span>
                    <span className="text-gray-700">{scannedAsset.assigned_to}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 text-sm">상태</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      scannedAsset.status === '정상' ? 'bg-green-100 text-green-800' :
                      scannedAsset.status === '수리중' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {scannedAsset.status}
                    </span>
                  </div>
                </div>

                {/* 실사 결과 입력 */}
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      실사 결과 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['정상', '위치불일치', '상태이상', '분실'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFormData({...formData, status})}
                          className={`py-3 px-4 rounded-xl font-medium transition-all ${
                            formData.status === status
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      실제 위치
                    </label>
                    <input
                      type="text"
                      value={formData.actual_location}
                      onChange={(e) => setFormData({...formData, actual_location: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="실제 위치를 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      메모
                    </label>
                    <textarea
                      value={formData.condition_notes}
                      onChange={(e) => setFormData({...formData, condition_notes: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      placeholder="특이사항을 입력하세요 (선택)"
                    />
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    ✅ 실사 완료
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 애니메이션 CSS */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(256px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default MobileQRScanner;
// 테스트용 
