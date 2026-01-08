import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from './config/api';

function AssetEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    asset_number: '',
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    status: '',
    location: '',
    assigned_to: '',
    purchase_date: '',
    serial_number: '',
    purchase_price: '',
    warranty_end_date: '',
    last_inspection_date: '',
    next_inspection_date: '',
    notes: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [assetRes, categoriesRes, locationsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/assets/${id}`),
        axios.get(`${API_BASE_URL}/api/categories`),
        axios.get(`${API_BASE_URL}/api/locations`)
      ]);
      
      const asset = assetRes.data;
      
      setFormData({
        asset_number: asset.asset_number,
        name: asset.name,
        category: asset.category,
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        status: asset.status,
        location: asset.location || '',
        assigned_to: asset.assigned_to || '',
        purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
        serial_number: asset.serial_number || '',
        purchase_price: asset.purchase_price || '',
        warranty_end_date: asset.warranty_end_date || '',
        last_inspection_date: asset.last_inspection_date || '',
        next_inspection_date: asset.next_inspection_date || '',
        notes: asset.notes || ''
      });
      
      setCategories(categoriesRes.data);
      setLocations(locationsRes.data);
      setLoading(false);
    } catch (error) {
      alert('자산 정보를 불러오지 못했습니다.');
      navigate('/assets');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      alert('이름과 분류는 필수 항목입니다.');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/assets/${id}`, formData);
      alert('자산이 수정되었습니다.');
      navigate(`/assets/${id}`);
    } catch (error) {
      alert('수정 실패');
      console.error(error);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">자산 수정</h2>
        <button
          onClick={() => navigate(`/assets/${id}`)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          취소
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
              📌 기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  자산번호 (변경불가)
                </label>
                <input
                  type="text"
                  name="asset_number"
                  value={formData.asset_number}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  분류 *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">분류 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ⚙️ <span className="cursor-pointer hover:underline" onClick={() => navigate('/settings')}>설정</span>에서 카테고리를 추가할 수 있습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태 *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option>정상</option>
                  <option>수리중</option>
                  <option>폐기</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  제조사
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  모델
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시리얼 번호
                </label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="SN123456789"
                />
              </div>
            </div>
          </div>

          {/* 위치 및 담당자 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
              📍 위치 및 담당자
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  위치
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">위치 선택</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ⚙️ <span className="cursor-pointer hover:underline" onClick={() => navigate('/settings')}>설정</span>에서 위치를 추가할 수 있습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  담당자
                </label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 구매 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
              💰 구매 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  구매가격 (원)
                </label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="1500000"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  구매일
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  보증 종료일
                </label>
                <input
                  type="date"
                  name="warranty_end_date"
                  value={formData.warranty_end_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 점검 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
              🔧 점검 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  마지막 점검일
                </label>
                <input
                  type="date"
                  name="last_inspection_date"
                  value={formData.last_inspection_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  다음 점검일
                </label>
                <input
                  type="date"
                  name="next_inspection_date"
                  value={formData.next_inspection_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
              📝 메모
            </h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              placeholder="추가 정보나 특이사항을 입력하세요..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => navigate(`/assets/${id}`)}
            className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default AssetEdit;