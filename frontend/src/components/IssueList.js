import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 추가!

function IssueList() {
  const { isAdmin } = useAuth(); // 추가!
  
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [priorityFilter, setPriorityFilter] = useState('전체');
  const [sortOrder, setSortOrder] = useState('최신순');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 일괄 삭제
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterAndSortIssues();
  }, [issues, statusFilter, priorityFilter, sortOrder]);

  const fetchIssues = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/issues');
      setIssues(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const filterAndSortIssues = () => {
    let filtered = [...issues];

    // 상태 필터
    if (statusFilter !== '전체') {
      const statusMap = {
        '처리중': 'open',
        '진행중': 'in_progress',
        '해결됨': 'resolved',
        '종료': 'closed'
      };
      filtered = filtered.filter(issue => issue.status === statusMap[statusFilter]);
    }

    // 우선순위 필터
    if (priorityFilter !== '전체') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortOrder === '최신순') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOrder === '오래된순') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortOrder === '우선순위높은순') {
        const priorityOrder = { '긴급': 4, '높음': 3, '보통': 2, '낮음': 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      return 0;
    });

    setFilteredIssues(filtered);
    setCurrentPage(1);
    setSelectedIssues([]);
    setSelectAll(false);
  };

  const deleteIssue = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await axios.delete(`http://localhost:8000/api/issues/${id}`);
        fetchIssues();
      } catch (error) {
        alert('삭제 실패');
      }
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIssues([]);
    } else {
      const currentPageIds = currentItems.map(issue => issue.id);
      setSelectedIssues(currentPageIds);
    }
    setSelectAll(!selectAll);
  };

  // 개별 체크박스
  const handleSelectIssue = (issueId) => {
    if (selectedIssues.includes(issueId)) {
      setSelectedIssues(selectedIssues.filter(id => id !== issueId));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedIssues, issueId];
      setSelectedIssues(newSelected);
      
      const currentPageIds = currentItems.map(issue => issue.id);
      if (currentPageIds.every(id => newSelected.includes(id))) {
        setSelectAll(true);
      }
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedIssues.length === 0) {
      alert('삭제할 장애를 선택해주세요.');
      return;
    }

    if (window.confirm(`정말 ${selectedIssues.length}개의 장애를 삭제하시겠습니까?`)) {
      try {
        const token = localStorage.getItem('token');
        
        await axios.delete('http://localhost:8000/api/issues/bulk-delete', {
          headers: { Authorization: `Bearer ${token}` },
          data: { issue_ids: selectedIssues }
        });
        
        setSelectedIssues([]);
        setSelectAll(false);
        fetchIssues();
        alert(`${selectedIssues.length}개의 장애가 삭제되었습니다.`);
      } catch (error) {
        console.error('일괄 삭제 실패:', error);
        alert('일괄 삭제에 실패했습니다.');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      'open': '처리중',
      'in_progress': '진행중',
      'resolved': '해결됨',
      'closed': '종료'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      '긴급': 'text-red-600 dark:text-red-400 font-bold',
      '높음': 'text-orange-600 dark:text-orange-400 font-semibold',
      '보통': 'text-blue-600 dark:text-blue-400',
      '낮음': 'text-gray-600 dark:text-gray-400'
    };
    return colors[priority] || 'text-gray-600 dark:text-gray-400';
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">장애 처리</h2>
        <Link to="/issues/new" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          + 장애 등록
        </Link>
      </div>

      {/* 필터 및 정렬 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option>전체</option>
              <option>처리중</option>
              <option>진행중</option>
              <option>해결됨</option>
              <option>종료</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">우선순위</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option>전체</option>
              <option>긴급</option>
              <option>높음</option>
              <option>보통</option>
              <option>낮음</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">정렬</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option>최신순</option>
              <option>오래된순</option>
              <option>우선순위높은순</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">페이지당</label>
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
      </div>

      {/* 일괄 삭제 버튼 - 관리자만 */}
      {isAdmin && selectedIssues.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {selectedIssues.length}개 항목 선택됨
          </span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            🗑️ 선택 삭제
          </button>
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        전체 <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredIssues.length}</span>개 중 
        <span className="font-semibold text-blue-600 dark:text-blue-400 ml-1">
          {filteredIssues.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredIssues.length)}
        </span>개 표시
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {currentItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">우선순위</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">신고자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">담당자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">등록일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIssues.includes(issue.id)}
                          onChange={() => handleSelectIssue(issue.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{issue.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue.status)}`}>
                        {getStatusText(issue.status)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{issue.reporter}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{issue.assignee || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(issue.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link 
                        to={`/issues/edit/${issue.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        수정
                      </Link>
                      <button 
                        onClick={() => deleteIssue(issue.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
                  {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredIssues.length)} / {filteredIssues.length}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default IssueList;