import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from './config/api';

function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'this_week':
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'last_week':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 6);
        lastWeekStart.setHours(0, 0, 0, 0);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        startDate = lastWeekStart;
        endDate = lastWeekEnd;
        break;
      
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : null;
        endDate = customEndDate ? new Date(customEndDate) : null;
        break;
      
      default:
        startDate = null;
        endDate = null;
    }

    return { startDate, endDate };
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { startDate, endDate } = getDateRange();

      const params = {};
      if (startDate) params.start_date = startDate.toISOString();
      if (endDate) params.end_date = endDate.toISOString();

      const response = await axios.get('${API_BASE_URL}/api/reports/combined-summary', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setReportData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('보고서 조회 실패:', error);
      alert('보고서 조회에 실패했습니다.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleGenerateReport = () => {
    fetchReport();
  };

  const exportToPDF = () => {
    window.print();
  };

  const getPeriodLabel = () => {
    const { startDate, endDate } = getDateRange();
    if (!startDate || !endDate) return '전체 기간';
    
    return `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;
  };

  return (
    <div>
      {/* 인쇄 전용 스타일 */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          /* 색상 정확하게 출력 */
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          /* 다크모드 클래스 무시 */
          .dark * {
            color: inherit;
            background-color: inherit;
            border-color: inherit;
          }
          
          /* 섹션이 중간에 잘리지 않도록 */
          .avoid-break {
            page-break-inside: avoid;
          }
          
          .table-section {
            page-break-inside: avoid;
          }
          
          .section-break-auto {
            page-break-before: auto;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          h2, h3 {
            page-break-after: avoid;
          }
        }
      `}</style>

      {/* 설정 패널 (인쇄 시 숨김) */}
      <div className="print:hidden mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            보고서 생성
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                기간 선택
              </label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="this_week">이번 주</option>
                <option value="last_week">지난 주</option>
                <option value="this_month">이번 달</option>
                <option value="last_month">지난 달</option>
                <option value="custom">직접 선택</option>
                <option value="all">전체 기간</option>
              </select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {loading ? '생성 중...' : '보고서 생성'}
            </button>
            {reportData && (
              <button
                onClick={exportToPDF}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
              >
                📄 PDF 저장
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 보고서 내용 */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          보고서 생성 중...
        </div>
      ) : reportData ? (
        <div className="bg-white dark:bg-gray-800 p-6 print:p-0 print:bg-white">
          {/* 헤더 */}
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 avoid-break">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white print:text-gray-800 mb-2">
              WorkHelper 운영 보고서
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">
              <p>기간: {getPeriodLabel()}</p>
              <p>생성일시: {new Date().toLocaleString('ko-KR')}</p>
              <p>생성자: {user.full_name}</p>
            </div>
          </div>

          {/* 자산 현황 */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white print:text-gray-800 mb-4">
              📦 자산 현황
            </h2>
            
            {/* 자산 요약 박스들 */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 print:bg-blue-50 p-3 rounded-lg avoid-break border border-blue-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">총 자산 수</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">
                  {reportData.assets.summary.total_assets}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 print:bg-green-50 p-3 rounded-lg avoid-break border border-green-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">상태별 분포</h3>
                <div className="text-xs space-y-0.5">
                  {Object.entries(reportData.assets.summary.status_distribution).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">{status}</span>
                      <span className="font-semibold text-gray-800 dark:text-white print:text-gray-800">{count}개</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 print:bg-purple-50 p-3 rounded-lg avoid-break border border-purple-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">카테고리별 분포</h3>
                <div className="text-xs space-y-0.5">
                  {Object.entries(reportData.assets.summary.category_distribution).map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">{category}</span>
                      <span className="font-semibold text-gray-800 dark:text-white print:text-gray-800">{count}개</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 print:bg-yellow-50 p-3 rounded-lg avoid-break border border-yellow-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">위치별 분포</h3>
                <div className="text-xs space-y-0.5">
                  {Object.entries(reportData.assets.summary.location_distribution).map(([location, count]) => (
                    <div key={location} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">{location}</span>
                      <span className="font-semibold text-gray-800 dark:text-white print:text-gray-800">{count}개</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 최근 추가된 자산 - 전체 표시 */}
            <div className="table-section mb-5">
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-2">
                최근 추가된 자산 ({reportData.assets.recent_assets.length}개)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs border border-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-700 print:bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">자산번호</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">이름</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">카테고리</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">상태</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 print:bg-white divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.assets.recent_assets.map((asset, index) => (
                      <tr key={index}>
                        <td className="px-2 py-1.5 text-gray-800 dark:text-white print:text-gray-800">{asset.asset_number}</td>
                        <td className="px-2 py-1.5 text-gray-800 dark:text-white print:text-gray-800">{asset.name}</td>
                        <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 print:text-gray-600">{asset.category}</td>
                        <td className="px-2 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            asset.status === '정상' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 print:bg-green-100 print:text-green-800' :
                            asset.status === '수리중' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 print:bg-yellow-100 print:text-yellow-800' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 print:bg-red-100 print:text-red-800'
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 print:text-gray-600">
                          {asset.created_at ? new Date(asset.created_at).toLocaleDateString('ko-KR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 장애 현황 - 스마트 페이지 나누기 */}
          <div className="section-break-auto mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white print:text-gray-800 mb-4">
              🔧 장애 현황
            </h2>
            
            {/* 장애 요약 박스들 */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-red-50 dark:bg-red-900/20 print:bg-red-50 p-3 rounded-lg avoid-break border border-red-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">총 장애 수</h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 print:text-red-600">
                  {reportData.issues.summary.total_issues}
                </p>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 print:text-gray-600">
                  <span>해결: {reportData.issues.summary.resolved_count}</span>
                  <span className="mx-1">|</span>
                  <span>미해결: {reportData.issues.summary.open_count}</span>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 print:bg-indigo-50 p-3 rounded-lg avoid-break border border-indigo-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">평균 해결 시간</h3>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 print:text-indigo-600">
                  {reportData.issues.summary.avg_resolution_time_days}일
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 print:bg-green-50 p-3 rounded-lg avoid-break border border-green-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">상태별 분포</h3>
                <div className="text-xs space-y-0.5">
                  {Object.entries(reportData.issues.summary.status_distribution).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">{status}</span>
                      <span className="font-semibold text-gray-800 dark:text-white print:text-gray-800">{count}건</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 print:bg-orange-50 p-3 rounded-lg avoid-break border border-orange-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-1">우선순위별 분포</h3>
                <div className="text-xs space-y-0.5">
                  {Object.entries(reportData.issues.summary.priority_distribution).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">{priority}</span>
                      <span className="font-semibold text-gray-800 dark:text-white print:text-gray-800">{count}건</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 담당자별 분포 */}
            <div className="bg-gray-50 dark:bg-gray-700 print:bg-gray-50 p-3 rounded-lg mb-5 avoid-break border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-2">담당자별 장애 수</h3>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(reportData.issues.summary.assignee_distribution).map(([assignee, count]) => (
                  <div key={assignee} className="text-center">
                    <p className="text-xl font-bold text-gray-800 dark:text-white print:text-gray-800">{count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 print:text-gray-600">{assignee}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 장애 - 전체 표시 */}
            <div className="table-section">
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 print:text-gray-700 mb-2">
                최근 장애 ({reportData.issues.recent_issues.length}개)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs border border-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-700 print:bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">제목</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">상태</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">우선순위</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">담당자</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 print:text-gray-500">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 print:bg-white divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.issues.recent_issues.map((issue, index) => (
                      <tr key={index}>
                        <td className="px-2 py-1.5 text-gray-800 dark:text-white print:text-gray-800">{issue.title}</td>
                        <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 print:text-gray-600">{issue.status}</td>
                        <td className="px-2 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            issue.priority === '긴급' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 print:bg-red-100 print:text-red-800' :
                            issue.priority === '높음' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 print:bg-orange-100 print:text-orange-800' :
                            issue.priority === '보통' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 print:bg-yellow-100 print:text-yellow-800' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 print:bg-green-100 print:text-green-800'
                          }`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 print:text-gray-600">{issue.assignee}</td>
                        <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 print:text-gray-600">
                          {issue.created_at ? new Date(issue.created_at).toLocaleDateString('ko-KR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Reports;