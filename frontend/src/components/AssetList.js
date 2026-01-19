import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import FilterManagement from './FilterManagement';
import API_BASE_URL from './config/api';

function AssetList() {
  const { isAdmin } = useAuth();
  
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 빠른보기 모달
  const [quickViewAsset, setQuickViewAsset] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  
  // 동적 필터
  const [filterConfigs, setFilterConfigs] = useState([]);
  const [filters, setFilters] = useState({ searchTerm: '' });
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showFilterManagement, setShowFilterManagement] = useState(false);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 일괄 삭제
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchFilterConfigs();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, filters]);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assets`);
      setAssets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchFilterConfigs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/filter-configs?entity_type=asset&active_only=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFilterConfigs(response.data);
      
      const initialFilters = { searchTerm: '' };
      response.data.forEach(config => {
        initialFilters[config.name] = config.filter_type === 'dropdown' ? '전체' : '';
      });
      setFilters(initialFilters);
    } catch (error) {
      console.error('필터 설정 조회 실패:', error);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (filters.searchTerm) {
      filtered = filtered.filter(asset =>
        asset.asset_number.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        asset.assigned_to?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    filterConfigs.forEach(config => {
      const filterValue = filters[config.name];
      
      if (!filterValue || filterValue === '전체' || filterValue === '') return;

      switch (config.filter_type) {
        case 'dropdown':
          filtered = filtered.filter(asset => asset[config.field_name] === filterValue);
          break;
        case 'text':
          filtered = filtered.filter(asset =>
            asset[config.field_name]?.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        case 'date':
          break;
        case 'number':
          filtered = filtered.filter(asset => asset[config.field_name] == filterValue);
          break;
      }
    });

    setFilteredAssets(filtered);
    setCurrentPage(1);
    setSelectedAssets([]);
    setSelectAll(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    const resetFilters = { searchTerm: '' };
    filterConfigs.forEach(config => {
      resetFilters[config.name] = config.filter_type === 'dropdown' ? '전체' : '';
    });
    setFilters(resetFilters);
  };

  const deleteAsset = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/assets/${id}`);
        fetchAssets();
      } catch (error) {
        alert('삭제 실패');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssets([]);
    } else {
      const currentPageIds = currentItems.map(asset => asset.id);
      setSelectedAssets(currentPageIds);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAsset = (assetId) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedAssets, assetId];
      setSelectedAssets(newSelected);
      
      const currentPageIds = currentItems.map(asset => asset.id);
      if (currentPageIds.every(id => newSelected.includes(id))) {
        setSelectAll(true);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) {
      alert('삭제할 자산을 선택해주세요.');
      return;
    }

    if (window.confirm(`정말 ${selectedAssets.length}개의 자산을 삭제하시겠습니까?`)) {
      try {
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API_BASE_URL}/api/assets/bulk-delete`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { asset_ids: selectedAssets }
        });
        
        setSelectedAssets([]);
        setSelectAll(false);
        fetchAssets();
        alert(`${selectedAssets.length}개의 자산이 삭제되었습니다.`);
      } catch (error) {
        console.error('일괄 삭제 실패:', error);
        alert('일괄 삭제에 실패했습니다.');
      }
    }
  };

  const openQuickView = async (assetId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assets/${assetId}`);
      setQuickViewAsset(response.data);
      setShowQuickView(true);
    } catch (error) {
      alert('자산 정보를 불러오지 못했습니다.');
    }
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setQuickViewAsset(null);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredAssets.map(asset => ({
        '자산번호': asset.asset_number,
        '이름': asset.name,
        '분류': asset.category,
        '제조사': asset.manufacturer || '',
        '모델': asset.model || '',
        '상태': asset.status,
        '위치': asset.location || '',
        '담당자': asset.assigned_to || '',
        '시리얼번호': asset.serial_number || '',
        '구매가격': asset.purchase_price || '',
        '구매일': asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('ko-KR') : '',
        '보증종료일': asset.warranty_end_date ? new Date(asset.warranty_end_date).toLocaleDateString('ko-KR') : '',
        '마지막점검': asset.last_inspection_date ? new Date(asset.last_inspection_date).toLocaleDateString('ko-KR') : '',
        '다음점검': asset.next_inspection_date ? new Date(asset.next_inspection_date).toLocaleDateString('ko-KR') : '',
        '등록일': new Date(asset.created_at).toLocaleDateString('ko-KR')
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '자산목록');
    XLSX.writeFile(workbook, `자산목록_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'searchTerm') return value !== '';
    return value !== '전체' && value !== '';
  }).length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const renderFilter = (config) => {
    switch (config.filter_type) {
      case 'dropdown':
        return (
          <div key={config.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {config.label}
            </label>
            <select
              value={filters[config.name] || '전체'}
              onChange={(e) => handleFilterChange(config.name, e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option>전체</option>
              {config.options?.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      case 'text':
        return (
          <div key={config.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {config.label}
            </label>
            <input
              type="text"
              value={filters[config.name] || ''}
              onChange={(e) => handleFilterChange(config.name, e.target.value)}
              placeholder={`${config.label}로 검색...`}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>
        );
      
      case 'date':
        return (
          <div key={config.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {config.label}
            </label>
            <input
              type="date"
              value={filters[config.name] || ''}
              onChange={(e) => handleFilterChange(config.name, e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={config.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {config.label}
            </label>
            <input
              type="number"
              value={filters[config.name] || ''}
              onChange={(e) => handleFilterChange(config.name, e.target.value)}
              placeholder={config.label}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return `₩${Number(value).toLocaleString('ko-KR')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">자산 관리</h2>
        {/* 🔥 관리자만: 일괄 업로드, 자산 추가 버튼 */}
        {isAdmin && (
          <div className="flex gap-2">
            <Link to="/assets/bulk-upload" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              📤 일괄 업로드
            </Link>
            <Link to="/assets/new" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              + 자산 추가
            </Link>
          </div>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="자산번호, 이름, 담당자로 검색..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
          />
          
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-white px-4 py-2 rounded flex items-center gap-2"
          >
            🔍 고급 검색
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              페이지당:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value={5}>5개</option>
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>

        {showAdvancedFilter && (
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterConfigs.map(config => renderFilter(config))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={resetFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                🔄 초기화
              </button>
              
              {/* 🔥 관리자만: 필터 관리 버튼 */}
              {isAdmin && (
                <button
                  onClick={() => setShowFilterManagement(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  ⚙️ 필터 관리
                </button>
              )}

              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center ml-2">
                {activeFiltersCount > 0 && `${activeFiltersCount}개의 필터 적용 중`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 관리자만: 일괄 삭제 */}
      {isAdmin && selectedAssets.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {selectedAssets.length}개 항목 선택됨
          </span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            🗑️ 선택 삭제
          </button>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          전체 <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredAssets.length}</span>개 중 
          <span className="font-semibold text-blue-600 dark:text-blue-400 ml-1">
            {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAssets.length)}
          </span>개 표시
        </div>
        {/* 🔥 관리자만: 엑셀 다운로드 */}
        {isAdmin && (
          <button
            onClick={exportToExcel}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            📊 엑셀 다운로드
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {currentItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {/* 🔥 관리자만: 체크박스 컬럼 */}
                    {isAdmin && (
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">자산번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">분류</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">담당자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">위치</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentItems.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {/* 🔥 관리자만: 체크박스 */}
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={() => handleSelectAsset(asset.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {asset.asset_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{asset.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{asset.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          asset.status === '정상' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          asset.status === '수리중' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{asset.assigned_to || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{asset.location || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => openQuickView(asset.id)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="빠른보기"
                        >
                          👁️
                        </button>
                        <Link 
                          to={`/assets/${asset.id}`}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          상세
                        </Link>
                        {/* 🔥 관리자만: 수정, 삭제 */}
                        {isAdmin && (
                          <>
                            <Link 
                              to={`/assets/edit/${asset.id}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              수정
                            </Link>
                            <button 
                              onClick={() => deleteAsset(asset.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              삭제
                            </button>
                          </>
                        )}
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
                  {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAssets.length)} / {filteredAssets.length}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 빠른보기 모달 */}
      {showQuickView && quickViewAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                자산 상세 정보
              </h3>
              <button
                onClick={closeQuickView}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 내용 */}
            <div className="px-6 py-4 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  📌 기본 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">자산번호</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.asset_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">이름</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">분류</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">상태</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      quickViewAsset.status === '정상' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      quickViewAsset.status === '수리중' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {quickViewAsset.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">담당자</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.assigned_to || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">위치</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.location || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 구매 정보 */}
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  💰 구매 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">구매가격</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{formatCurrency(quickViewAsset.purchase_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">구매일</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(quickViewAsset.purchase_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">보증종료일</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(quickViewAsset.warranty_end_date)}</p>
                  </div>
                </div>
              </div>

              {/* 점검 정보 */}
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  🔧 점검 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">마지막 점검일</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(quickViewAsset.last_inspection_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">다음 점검일</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(quickViewAsset.next_inspection_date)}</p>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  📝 추가 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">시리얼 번호</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.serial_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">제조사</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.manufacturer || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">모델</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{quickViewAsset.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">등록일</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(quickViewAsset.created_at)}</p>
                  </div>
                </div>
                {quickViewAsset.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">메모</p>
                    <p className="text-base text-gray-900 dark:text-white mt-1">{quickViewAsset.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 푸터 */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex gap-2 justify-end">
              {/* 🔥 관리자만: 수정하기 버튼 */}
              {isAdmin && (
                <Link
                  to={`/assets/edit/${quickViewAsset.id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  수정하기
                </Link>
              )}
              <button
                onClick={closeQuickView}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 관리 모달 */}
      <FilterManagement
        isOpen={showFilterManagement}
        onClose={() => setShowFilterManagement(false)}
        entityType="asset"
        onSave={fetchFilterConfigs}
      />
    </div>
  );
}

export default AssetList;