import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from './config/api';

function FilterManagement({ isOpen, onClose, entityType = 'asset', onSave }) {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFilter, setNewFilter] = useState({
    name: '',
    label: '',
    filter_type: 'dropdown',
    field_name: '',
    is_active: true,
    order_index: 0,
    entity_type: entityType,
    options: []
  });
  const [newOptionForNewFilter, setNewOptionForNewFilter] = useState({ value: '', label: '' });
  const [optionInputs, setOptionInputs] = useState({}); // 각 필터별 옵션 입력 state

  // 자산 테이블의 사용 가능한 필드들
  const availableFields = [
    { value: 'manufacturer', label: '제조사 (manufacturer)' },
    { value: 'model', label: '모델명 (model)' },
    { value: 'serial_number', label: '시리얼번호 (serial_number)' },
    { value: 'purchase_date', label: '구매일 (purchase_date)' },
    { value: 'warranty_end_date', label: '보증종료일 (warranty_end_date)' },
    { value: 'price', label: '가격 (price)' },
    { value: 'status', label: '상태 (status)' },
    { value: 'category', label: '카테고리 (category)' },
    { value: 'location', label: '위치 (location)' },
    { value: 'assigned_to', label: '담당자 (assigned_to)' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchFilters();
    }
  }, [isOpen, entityType]);

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/filter-configs?entity_type=${entityType}&active_only=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFilters(response.data);
      
      // 각 필터별 옵션 입력 state 초기화
      const inputs = {};
      response.data.forEach(filter => {
        inputs[filter.id] = { value: '', label: '' };
      });
      setOptionInputs(inputs);
      
      setLoading(false);
    } catch (error) {
      console.error('필터 조회 실패:', error);
      setLoading(false);
    }
  };

  const handleCreateFilter = async () => {
    if (!newFilter.name || !newFilter.label || !newFilter.field_name) {
      alert('필터 이름, 레이블, 필드명은 필수입니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/filter-configs`, newFilter, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('필터가 생성되었습니다.');
      fetchFilters();
      setNewFilter({
        name: '',
        label: '',
        filter_type: 'dropdown',
        field_name: '',
        is_active: true,
        order_index: 0,
        entity_type: entityType,
        options: []
      });
      setNewOptionForNewFilter({ value: '', label: '' });
    } catch (error) {
      alert('필터 생성 실패: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleActive = async (filterId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/filter-configs/${filterId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFilters();
    } catch (error) {
      alert('상태 변경 실패');
    }
  };

  const handleDeleteFilter = async (filterId) => {
    if (!window.confirm('정말 이 필터를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/filter-configs/${filterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('필터가 삭제되었습니다.');
      fetchFilters();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleAddOption = async (filterId) => {
    const optionInput = optionInputs[filterId];
    
    if (!optionInput || !optionInput.value || !optionInput.label) {
      alert('값과 레이블을 입력하세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/filter-configs/${filterId}/options`,
        optionInput,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 해당 필터의 입력만 초기화
      setOptionInputs({
        ...optionInputs,
        [filterId]: { value: '', label: '' }
      });
      
      fetchFilters();
    } catch (error) {
      alert('옵션 추가 실패');
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (!window.confirm('이 옵션을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/filter-configs/options/${optionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFilters();
    } catch (error) {
      alert('옵션 삭제 실패');
    }
  };

  const handleAddNewFilterOption = () => {
    if (!newOptionForNewFilter.value || !newOptionForNewFilter.label) {
      alert('값과 레이블을 입력하세요.');
      return;
    }

    setNewFilter({
      ...newFilter,
      options: [...(newFilter.options || []), { ...newOptionForNewFilter, order_index: (newFilter.options || []).length }]
    });
    setNewOptionForNewFilter({ value: '', label: '' });
  };

  const handleRemoveNewFilterOption = (index) => {
    setNewFilter({
      ...newFilter,
      options: newFilter.options.filter((_, i) => i !== index)
    });
  };

  const updateOptionInput = (filterId, field, value) => {
    setOptionInputs({
      ...optionInputs,
      [filterId]: {
        ...optionInputs[filterId],
        [field]: value
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              필터 관리
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 새 필터 생성 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              새 필터 생성
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  필터 이름 (내부용, 영문) *
                </label>
                <input
                  type="text"
                  value={newFilter.name}
                  onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                  placeholder="예: manufacturer"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  영문 소문자와 언더스코어(_)만 사용
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  레이블 (화면 표시명) *
                </label>
                <input
                  type="text"
                  value={newFilter.label}
                  onChange={(e) => setNewFilter({ ...newFilter, label: e.target.value })}
                  placeholder="예: 제조사"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  사용자에게 보이는 이름
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  필터 타입 *
                </label>
                <select
                  value={newFilter.filter_type}
                  onChange={(e) => setNewFilter({ ...newFilter, filter_type: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="dropdown">드롭다운 (선택)</option>
                  <option value="text">텍스트 입력 (검색)</option>
                  <option value="date">날짜 선택</option>
                  <option value="number">숫자 입력</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DB 필드명 * <span className="text-xs text-gray-500">(자산 테이블의 컬럼명)</span>
                </label>
                <select
                  value={newFilter.field_name}
                  onChange={(e) => setNewFilter({ ...newFilter, field_name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">선택하세요</option>
                  {availableFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 필터로 검색할 자산의 속성을 선택하세요
                </p>
              </div>
            </div>

            {newFilter.filter_type === 'dropdown' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  드롭다운 옵션 <span className="text-xs text-gray-500">(사용자가 선택할 항목들)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newOptionForNewFilter.value}
                    onChange={(e) => setNewOptionForNewFilter({ ...newOptionForNewFilter, value: e.target.value })}
                    placeholder="값 (예: samsung)"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newOptionForNewFilter.label}
                    onChange={(e) => setNewOptionForNewFilter({ ...newOptionForNewFilter, label: e.target.value })}
                    placeholder="레이블 (예: 삼성)"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleAddNewFilterOption}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    추가
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  💡 값은 DB에 저장된 실제 데이터, 레이블은 화면에 보이는 이름
                </p>
                {newFilter.options && newFilter.options.length > 0 && (
                  <div className="space-y-1">
                    {newFilter.options.map((opt, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {opt.label} ({opt.value})
                        </span>
                        <button
                          onClick={() => handleRemoveNewFilterOption(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCreateFilter}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
            >
              필터 생성
            </button>
          </div>

          {/* 기존 필터 목록 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              기존 필터 목록
            </h3>
            {loading ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">로딩중...</div>
            ) : filters.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                필터가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {filter.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          내부명: {filter.name} | 타입: {filter.filter_type} | 필드: {filter.field_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(filter.id, filter.is_active)}
                          className={`px-3 py-1 rounded text-sm ${
                            filter.is_active
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-gray-400 hover:bg-gray-500 text-white'
                          }`}
                        >
                          {filter.is_active ? '활성' : '비활성'}
                        </button>
                        <button
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {filter.filter_type === 'dropdown' && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={optionInputs[filter.id]?.value || ''}
                            onChange={(e) => updateOptionInput(filter.id, 'value', e.target.value)}
                            placeholder="값"
                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-600 dark:text-white"
                          />
                          <input
                            type="text"
                            value={optionInputs[filter.id]?.label || ''}
                            onChange={(e) => updateOptionInput(filter.id, 'label', e.target.value)}
                            placeholder="레이블"
                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => handleAddOption(filter.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            추가
                          </button>
                        </div>
                        <div className="space-y-1">
                          {filter.options?.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between bg-white dark:bg-gray-600 p-2 rounded text-sm"
                            >
                              <span className="text-gray-700 dark:text-gray-300">
                                {option.label} ({option.value})
                              </span>
                              <button
                                onClick={() => handleDeleteOption(option.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={() => {
              fetchFilters();
              if (onSave) onSave();
              onClose();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
          >
            저장 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterManagement;