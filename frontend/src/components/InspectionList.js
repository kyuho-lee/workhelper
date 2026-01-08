import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import API_BASE_URL from './config/api'; 

function InspectionList() {
  const { isAdmin } = useAuth();
  
  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 필터
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '전체',
    campaignId: '전체'
  });
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchInspections();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    filterInspections();
  }, [inspections, filters]);

  const fetchInspections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/inspections/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      setInspections(response.data);
      setLoading(false);
    } catch (error) {
      console.error('실사 기록 조회 실패:', error);
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/inspections/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data);
    } catch (error) {
      console.error('캠페인 조회 실패:', error);
    }
  };

  const filterInspections = () => {
    let filtered = [...inspections];

    // 검색어 필터 (자산번호, 자산명, 점검자, 위치)
    if (filters.searchTerm) {
      filtered = filtered.filter(inspection =>
        inspection.asset?.asset_number?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        inspection.asset?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        inspection.inspector_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        inspection.actual_location?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (filters.status !== '전체') {
      filtered = filtered.filter(inspection => inspection.status === filters.status);
    }

    // 캠페인 필터
    if (filters.campaignId !== '전체') {
      filtered = filtered.filter(inspection => 
        inspection.campaign_id === parseInt(filters.campaignId)
      );
    }

    setFilteredInspections(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      status: '전체',
      campaignId: '전체'
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(value);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredInspections.map(inspection => ({
        '실사일시': new Date(inspection.inspection_date).toLocaleString('ko-KR'),
        '자산번호': inspection.asset?.asset_number || '',
        '자산명': inspection.asset?.name || '',
        '제조사': inspection.asset?.manufacturer || '',
        '모델': inspection.asset?.model || '',
        '시리얼번호': inspection.asset?.serial_number || '',
        '구매가격': inspection.asset?.purchase_price || '',
        '점검자': inspection.inspector_name,
        '실사상태': inspection.status,
        '실제위치': inspection.actual_location || '',
        '등록위치': inspection.asset?.location || '',
        '메모': inspection.condition_notes || ''
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '실사기록');
    XLSX.writeFile(workbook, `재고실사_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      '정상': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      '위치불일치': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      '상태이상': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      '분실': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInspections.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">재고 실사 기록</h2>
        <div className="flex gap-2">
          <a
            href="/mobile/scan"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            📱 모바일 실사
          </a>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              검색
            </label>
            <input
              type="text"
              placeholder="자산번호, 자산명, 점검자..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              상태
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option>전체</option>
              <option>정상</option>
              <option>위치불일치</option>
              <option>상태이상</option>
              <option>분실</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              캠페인
            </label>
            <select
              value={filters.campaignId}
              onChange={(e) => handleFilterChange('campaignId', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option>전체</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaign_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              페이지당
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value={5}>5개</option>
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={resetFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            🔄 초기화
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          전체 <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredInspections.length}</span>개 중 
          <span className="font-semibold text-blue-600 dark:text-blue-400 ml-1">
            {filteredInspections.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredInspections.length)}
          </span>개 표시
        </div>
        <button
          onClick={exportToExcel}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          📊 엑셀 다운로드
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {currentItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            실사 기록이 없습니다.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      실사일시
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      자산번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      자산명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      시리얼번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      점검자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      실사상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      실제위치
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      메모
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentItems.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(inspection.inspection_date).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {inspection.asset?.asset_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {inspection.asset?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {inspection.asset?.serial_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {inspection.inspector_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(inspection.status)}`}>
                          {inspection.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {inspection.actual_location || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                        {inspection.condition_notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    처음
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    이전
                  </button>
                  
                  <span className="text-sm text-gray-700 dark:text-gray-300 mx-2">
                    <span className="font-semibold">{currentPage}</span> / {totalPages} 페이지
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    다음
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    마지막
                  </button>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredInspections.length)} / {filteredInspections.length}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default InspectionList;