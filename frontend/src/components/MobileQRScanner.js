import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

const MobileQRScanner = () => {
  const [scanning, setScanning] = useState(true);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [inspectionStatus, setInspectionStatus] = useState('정상');
  const [actualLocation, setActualLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    // 통계 로드
    fetchStats();

    // QR 스캐너 초기화
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    qrScanner.render(onScanSuccess, onScanError);
    setScanner(qrScanner);

    return () => {
      qrScanner.clear().catch(error => {
        console.error("Failed to clear scanner.", error);
      });
    };
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/inspections/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const onScanSuccess = async (decodedText) => {
    // 스캔 성공 시 진동
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // 음성 피드백
    playSound('success');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/inspections/scan/${decodedText}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.already_inspected) {
        setMessage('⚠️ 이미 실사 완료된 자산입니다!');
        playSound('warning');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      setScannedAsset(response.data.asset);
      setActualLocation(response.data.asset.location || '');
      setScanning(false);

      // 스캐너 일시 중지
      if (scanner) {
        scanner.pause();
      }

    } catch (error) {
      setMessage('❌ 자산을 찾을 수 없습니다!');
      playSound('error');
      console.error('스캔 오류:', error);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const onScanError = (error) => {
    // 스캔 오류는 무시 (계속 스캔)
  };

  const playSound = (type) => {
    // 간단한 음성 피드백
    const utterance = new SpeechSynthesisUtterance(
      type === 'success' ? '스캔 성공' :
      type === 'warning' ? '이미 완료' :
      type === 'complete' ? '실사 완료' : '오류'
    );
    utterance.lang = 'ko-KR';
    utterance.rate = 1.5;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/inspections/scan`,
        {
          asset_number: scannedAsset.asset_number,
          status: inspectionStatus,
          actual_location: actualLocation,
          condition_notes: notes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('✅ 실사 완료!');
      playSound('complete');

      // 통계 업데이트
      fetchStats();

      // 폼 초기화
      resetForm();

      // 스캐너 재개
      if (scanner) {
        scanner.resume();
      }

      setTimeout(() => setMessage(''), 2000);

    } catch (error) {
      setMessage('❌ 실사 기록 실패!');
      playSound('error');
      console.error('실사 기록 오류:', error);
    }
  };

  const resetForm = () => {
    setScannedAsset(null);
    setInspectionStatus('정상');
    setActualLocation('');
    setNotes('');
    setScanning(true);
  };

  const handleCancel = () => {
    resetForm();
    if (scanner) {
      scanner.resume();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">📱 재고 실사 QR 스캔</h1>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 p-4 m-4 rounded-lg shadow">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.inspected_count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">실사 완료</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.pending_count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">미실사</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">진행률</span>
              <span className="font-bold text-blue-600">{stats.inspection_rate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${stats.inspection_rate}%` }}
              ></div>
            </div>
          </div>
          
          {/* 이상 항목 */}
          {(stats.location_mismatch_count > 0 || stats.status_abnormal_count > 0 || stats.missing_count > 0) && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="text-sm font-bold mb-2 text-red-600">⚠️ 이상 항목</div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {stats.location_mismatch_count > 0 && (
                  <div>
                    <div className="font-bold text-yellow-600">{stats.location_mismatch_count}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">위치불일치</div>
                  </div>
                )}
                {stats.status_abnormal_count > 0 && (
                  <div>
                    <div className="font-bold text-orange-600">{stats.status_abnormal_count}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">상태이상</div>
                  </div>
                )}
                {stats.missing_count > 0 && (
                  <div>
                    <div className="font-bold text-red-600">{stats.missing_count}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">분실</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 메시지 */}
      {message && (
        <div className={`mx-4 mb-4 p-4 rounded-lg text-center font-bold ${
          message.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
          message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
        }`}>
          {message}
        </div>
      )}

      {/* QR 스캐너 */}
      {scanning && (
        <div className="bg-white dark:bg-gray-800 p-4 m-4 rounded-lg shadow">
          <div className="text-center mb-4">
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              📷 QR 코드를 스캔하세요
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              자산의 QR 코드를 카메라에 비춰주세요
            </p>
          </div>
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}

      {/* 실사 확인 폼 */}
      {scannedAsset && !scanning && (
        <div className="bg-white dark:bg-gray-800 p-6 m-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            🔍 자산 정보 확인
          </h2>

          <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <div className="flex justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">자산번호:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{scannedAsset.asset_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">품목명:</span>
              <span className="dark:text-white">{scannedAsset.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">카테고리:</span>
              <span className="dark:text-white">{scannedAsset.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">등록위치:</span>
              <span className="dark:text-white">{scannedAsset.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">담당자:</span>
              <span className="dark:text-white">{scannedAsset.assigned_to}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">상태:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                scannedAsset.status === '정상' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                scannedAsset.status === '수리중' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
              }`}>
                {scannedAsset.status}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                실사 결과 *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['정상', '위치불일치', '상태이상', '분실'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setInspectionStatus(status)}
                    className={`p-3 rounded-lg font-bold transition-all ${
                      inspectionStatus === status
                        ? status === '정상' ? 'bg-green-600 text-white' :
                          status === '위치불일치' ? 'bg-yellow-600 text-white' :
                          status === '상태이상' ? 'bg-orange-600 text-white' :
                          'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                실제 위치
              </label>
              <input
                type="text"
                value={actualLocation}
                onChange={(e) => setActualLocation(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
                placeholder="실제 위치 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                메모
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
                placeholder="상태 메모 (선택)"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                ✅ 실사 완료
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MobileQRScanner;