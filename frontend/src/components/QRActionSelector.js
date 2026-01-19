import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from './config/api';

function QRActionSelector() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scannedAssetNumber, setScannedAssetNumber] = useState(null);
  const [assetInfo, setAssetInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();
    
    return () => {
      isMountedRef.current = false;
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

      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        return;
      }

      html5QrCodeRef.current = new Html5Qrcode("qr-reader-selector");
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        () => {} // 에러 무시
      );
      
      if (isMountedRef.current) {
        setScanning(true);
      }
    } catch (err) {
      console.error("카메라 시작 실패:", err);
      if (isMountedRef.current) {
        setMessage('카메라 접근 권한을 허용해주세요.');
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current;
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
        html5QrCodeRef.current = null;
        if (isMountedRef.current) {
          setScanning(false);
        }
      } catch (err) {
        console.error("스캐너 정지 오류:", err);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // 진동 피드백
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // 음성 피드백
    const speech = new SpeechSynthesisUtterance('스캔 성공');
    speech.lang = 'ko-KR';
    speech.rate = 1.2;
    window.speechSynthesis.speak(speech);

    await stopScanner();

    const assetNumber = decodedText.replace(/^ASSET:/i, '');
    setScannedAssetNumber(assetNumber);
    
    // 자산 정보 조회
    await fetchAssetInfo(assetNumber);
  };

  const fetchAssetInfo = async (assetNumber) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/assets/by-number/${assetNumber}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (isMountedRef.current) {
        setAssetInfo(response.data);
        setMessage('');
      }
    } catch (error) {
      console.error('자산 조회 실패:', error);
      if (isMountedRef.current) {
        setMessage('❌ 자산을 찾을 수 없습니다!');
        setAssetInfo(null);
        
        // 3초 후 다시 스캔
        setTimeout(() => {
          if (isMountedRef.current) {
            resetAndRestart();
          }
        }, 3000);
      }
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleSelectAssetManagement = () => {
    // 자산관리 페이지로 이동
    navigate(`/mobile/asset/${scannedAssetNumber}`);
  };

  const handleSelectInspection = () => {
    // 재고실사 페이지로 이동
    navigate(`/mobile/inspection/${scannedAssetNumber}`);
  };

  const resetAndRestart = () => {
    setScannedAssetNumber(null);
    setAssetInfo(null);
    setMessage('');
    isProcessingRef.current = false;
    
    setTimeout(() => {
      if (isMountedRef.current) {
        startScanner();
      }
    }, 300);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleGoBack}
            className="text-white p-2"
          >
            ← 뒤로
          </button>
          <h1 className="text-white text-xl font-bold">
            📱 QR 스캔
          </h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* 카메라 뷰 (선택 전) */}
      {!scannedAssetNumber && (
        <div className="relative w-full h-full">
          <div id="qr-reader-selector" className="w-full h-full"></div>
          
          {/* 스캔 프레임 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="w-64 h-64 border-4 border-white rounded-3xl shadow-2xl animate-pulse">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-green-500 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-green-500 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-green-500 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-green-500 rounded-br-3xl"></div>
              </div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan"></div>
            </div>
          </div>

          {/* 하단 안내 */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
            <p className="text-white text-lg font-medium mb-2">
              QR 코드를 스캔하세요
            </p>
            <p className="text-white/60 text-sm">
              자산관리 또는 재고실사를 선택할 수 있습니다
            </p>
          </div>

          {/* 메시지 */}
          {message && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
                <p className="text-xl font-bold text-gray-800">{message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 선택 화면 */}
      {scannedAssetNumber && assetInfo && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 overflow-y-auto z-30">
          <div className="min-h-full flex items-center justify-center p-4 pt-20">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">✅ 스캔 완료</h2>
                <p className="text-green-100 text-sm">작업을 선택해주세요</p>
              </div>

              {/* 자산 정보 요약 */}
              <div className="p-6">
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <span className="text-gray-500 w-20 text-sm">자산번호</span>
                    <span className="font-bold text-lg text-green-600">{assetInfo.asset_number}</span>
                  </div>
                  <div className="flex items-center mb-3">
                    <span className="text-gray-500 w-20 text-sm">품목명</span>
                    <span className="font-semibold text-gray-800">{assetInfo.name}</span>
                  </div>
                  <div className="flex items-center mb-3">
                    <span className="text-gray-500 w-20 text-sm">분류</span>
                    <span className="text-gray-700">{assetInfo.category}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-20 text-sm">상태</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      assetInfo.status === '정상' ? 'bg-green-100 text-green-800' :
                      assetInfo.status === '수리중' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assetInfo.status}
                    </span>
                  </div>
                </div>

                {/* 선택 버튼들 */}
                <div className="space-y-4">
                  <button
                    onClick={handleSelectAssetManagement}
                    className="w-full py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">📦</span>
                    <div className="text-left">
                      <div className="text-lg">자산 관리</div>
                      <div className="text-sm font-normal opacity-80">상태 확인 및 정보 수정</div>
                    </div>
                  </button>

                  {/* 🔥 관리자만: 재고실사 버튼 */}
                  {isAdmin && (
                    <button
                      onClick={handleSelectInspection}
                      className="w-full py-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <span className="text-2xl">📋</span>
                      <div className="text-left">
                        <div className="text-lg">재고 실사</div>
                        <div className="text-sm font-normal opacity-80">실사 결과 기록</div>
                      </div>
                    </button>
                  )}
                </div>

                {/* 다시 스캔 버튼 */}
                <button
                  onClick={resetAndRestart}
                  className="w-full mt-6 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                >
                  🔄 다시 스캔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-700">자산 정보 조회 중...</p>
          </div>
        </div>
      )}

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

export default QRActionSelector;