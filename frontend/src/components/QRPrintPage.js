import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from './config/api';

function QRPrintPage() {
  const [assets, setAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '전체',
    location: '전체'
  });
  const [filteredAssets, setFilteredAssets] = useState([]);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, filters]);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/assets/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('자산 조회 실패:', error);
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    if (filters.searchTerm) {
      filtered = filtered.filter(asset =>
        asset.asset_number?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        asset.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        asset.assigned_to?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.category !== '전체') {
      filtered = filtered.filter(asset => asset.category === filters.category);
    }

    if (filters.location !== '전체') {
      filtered = filtered.filter(asset => asset.location === filters.location);
    }

    setFilteredAssets(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
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

  const handlePrintPreview = () => {
    if (selectedAssets.length === 0) {
      alert('인쇄할 자산을 선택해주세요.');
      return;
    }

    // 백엔드 QR 이미지 로드 대기
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const categories = [...new Set(assets.map(a => a.category).filter(Boolean))];
  const locations = [...new Set(assets.map(a => a.location).filter(Boolean))];

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const selectedAssetData = assets.filter(asset => selectedAssets.includes(asset.id));

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div>
      {/* 화면 표시용 (인쇄 시 숨김) */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            QR 코드 일괄 인쇄
          </h2>
          <button
            onClick={handlePrintPreview}
            disabled={selectedAssets.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🖨️ 인쇄 미리보기 ({selectedAssets.length}개)
          </button>
        </div>

        {/* 필터 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                검색
              </label>
              <input
                type="text"
                placeholder="자산번호, 이름, 담당자..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                분류
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option>전체</option>
                {categories.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                위치
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option>전체</option>
                {locations.map(loc => <option key={loc}>{loc}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                페이지당 항목
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
              </select>
            </div>
          </div>
        </div>

        {/* 자산 목록 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                현재 페이지 전체 선택 ({selectedAssets.length} / {filteredAssets.length})
              </span>
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              전체 <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredAssets.length}</span>개 중 
              <span className="font-semibold text-blue-600 dark:text-blue-400 ml-1">
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAssets.length)}
              </span>개 표시
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    선택
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    자산번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    분류
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    위치
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset.id)}
                        onChange={() => handleSelectAsset(asset.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                      {asset.asset_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {asset.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {asset.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {asset.assigned_to || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {asset.location || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
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
        </div>
      </div>

      {/* 인쇄용 레이아웃 */}
      <div className="hidden print:block">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>

        <div className="grid grid-cols-4 gap-4 p-4">
          {selectedAssetData.map((asset) => (
            <div key={asset.id} className="border border-gray-300 rounded p-3 text-center break-inside-avoid">
              {/* 백엔드 QR 코드 */}
              <img 
                src={`${API_BASE_URL}/api/qr/generate/${asset.asset_number}`}
                alt={asset.asset_number}
                className="w-full h-auto mb-2 bg-white"
                crossOrigin="anonymous"
              />
              
              {/* 자산 정보 */}
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm">{asset.asset_number}</div>
                <div className="text-gray-700">{asset.category || '-'}</div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-gray-600">{asset.assigned_to || '-'}</div>
                <div className="text-gray-600">{asset.location || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QRPrintPage;