import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import API_BASE_URL from './config/api'; 

function AssetBulkUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const template = [
      {
        '자산번호': 'A001',
        '이름': '노트북',
        '분류': 'IT장비',
        '제조사': 'Dell',
        '모델': 'Latitude 5420',
        '상태': '정상',
        '위치': '본사 2층',
        '담당자': '홍길동',
        '구매일': '2024-01-15',
        '메모': '신규 구매'
      },
      {
        '자산번호': 'A002',
        '이름': '모니터',
        '분류': 'IT장비',
        '제조사': 'LG',
        '모델': '27인치',
        '상태': '정상',
        '위치': '본사 3층',
        '담당자': '김철수',
        '구매일': '2024-01-20',
        '메모': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '자산목록');
    XLSX.writeFile(workbook, '자산_업로드_템플릿.xlsx');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        alert('엑셀 파일만 업로드 가능합니다.');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('${API_BASE_URL}/api/assets/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFile(null);
      
      if (response.data.error_count === 0) {
        alert(`성공적으로 ${response.data.success_count}개의 자산을 등록했습니다!`);
      }
    } catch (error) {
      alert('업로드 실패: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">엑셀 일괄 업로드</h2>
        <button
          onClick={() => navigate('/assets')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          목록으로
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold dark:text-white mb-4">사용 방법</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
          <li>아래 "템플릿 다운로드" 버튼을 클릭하여 엑셀 템플릿을 다운로드합니다.</li>
          <li>템플릿 파일을 열고 자산 정보를 입력합니다.</li>
          <li>필수 항목: 자산번호, 이름, 분류, 상태</li>
          <li>상태는 "정상", "수리중", "폐기" 중 하나여야 합니다.</li>
          <li>작성한 파일을 업로드합니다.</li>
        </ol>
        
        <button
          onClick={downloadTemplate}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
        >
          📥 템플릿 다운로드
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold dark:text-white mb-4">파일 업로드</h3>
        
        <div className="mb-4">
            <label className="block">
            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-500 file:text-white
                hover:file:bg-blue-600
                dark:file:bg-blue-600
                dark:hover:file:bg-blue-700
                file:cursor-pointer
                file:transition-all file:duration-200
                file:shadow-sm hover:file:shadow-md
                cursor-pointer"
            />
            </label>
        </div>

        {file && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              선택된 파일: {file.name}
            </p>
          </div>
        )}

        <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`px-6 py-2 rounded text-white transition-all duration-200 ${
            !file || uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 hover:shadow-md'
            }`}
        >
            {uploading ? '⏳ 업로드 중...' : '📤 업로드 시작'}
        </button>
        </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold dark:text-white mb-4">업로드 결과</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">성공</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.success_count}건
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">실패</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {result.error_count}건
              </p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">오류 내역:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-red-600 dark:text-red-400">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {result.success_count > 0 && (
            <button
              onClick={() => navigate('/assets')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              자산 목록 보기 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AssetBulkUpload;