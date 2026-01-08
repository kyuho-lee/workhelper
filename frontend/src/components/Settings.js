import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from './config/api';

function Settings() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');
  
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState({ name: '', description: '' });
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('${API_BASE_URL}/api/categories');
      setCategories(response.data);
      setLoadingCategories(false);
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      setLoadingCategories(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('${API_BASE_URL}/api/locations');
      setLocations(response.data);
      setLoadingLocations(false);
    } catch (error) {
      console.error('위치 조회 실패:', error);
      setLoadingLocations(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('${API_BASE_URL}/api/categories', newCategory, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewCategory({ name: '', description: '' });
      fetchCategories();
      alert('카테고리가 추가되었습니다.');
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
      alert(error.response?.data?.detail || '카테고리 추가에 실패했습니다.');
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.name.trim()) {
      alert('위치 이름을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('${API_BASE_URL}/api/locations', newLocation, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewLocation({ name: '', description: '' });
      fetchLocations();
      alert('위치가 추가되었습니다.');
    } catch (error) {
      console.error('위치 추가 실패:', error);
      alert(error.response?.data?.detail || '위치 추가에 실패했습니다.');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`'${name}' 카테고리를 삭제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
      alert('카테고리가 삭제되었습니다.');
    } catch (error) {
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const handleDeleteLocation = async (id, name) => {
    if (!window.confirm(`'${name}' 위치를 삭제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLocations();
      alert('위치가 삭제되었습니다.');
    } catch (error) {
      alert('위치 삭제에 실패했습니다.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">접근 권한 없음</h2>
        <p className="text-gray-600 dark:text-gray-400">관리자만 설정 페이지에 접근할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">⚙️ 설정</h2>
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveTab('categories')} className={`pb-3 px-4 font-medium ${activeTab === 'categories' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}>📦 카테고리</button>
        <button onClick={() => setActiveTab('locations')} className={`pb-3 px-4 font-medium ${activeTab === 'locations' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}>📍 위치</button>
      </div>
      {activeTab === 'categories' ? <CategoryTab categories={categories} loading={loadingCategories} newCategory={newCategory} setNewCategory={setNewCategory} onAdd={handleAddCategory} onDelete={handleDeleteCategory} /> : <LocationTab locations={locations} loading={loadingLocations} newLocation={newLocation} setNewLocation={setNewLocation} onAdd={handleAddLocation} onDelete={handleDeleteLocation} />}
    </div>
  );
}

function CategoryTab({ categories, loading, newCategory, setNewCategory, onAdd, onDelete }) {
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">새 카테고리 추가</h3>
        <form onSubmit={onAdd} className="flex gap-4">
          <input type="text" placeholder="카테고리 이름 *" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="flex-1 border rounded px-4 py-2 dark:bg-gray-700 dark:text-white" required />
          <input type="text" placeholder="설명" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} className="flex-1 border rounded px-4 py-2 dark:bg-gray-700 dark:text-white" />
          <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded">+ 추가</button>
        </form>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b"><h3 className="font-semibold dark:text-white">카테고리 목록 ({categories.length}개)</h3></div>
        {loading ? <div className="py-10 text-center">로딩중...</div> : <table className="min-w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">이름</th><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">설명</th><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">등록일</th><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">작업</th></tr></thead><tbody className="divide-y dark:divide-gray-700">{categories.map(cat => <tr key={cat.id}><td className="px-6 py-4 dark:text-white">{cat.name}</td><td className="px-6 py-4 dark:text-gray-300">{cat.description || '-'}</td><td className="px-6 py-4 dark:text-gray-300">{new Date(cat.created_at).toLocaleDateString('ko-KR')}</td><td className="px-6 py-4"><button onClick={() => onDelete(cat.id, cat.name)} className="text-red-600">삭제</button></td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}

function LocationTab({ locations, loading, newLocation, setNewLocation, onAdd, onDelete }) {
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">새 위치 추가</h3>
        <form onSubmit={onAdd} className="flex gap-4">
          <input type="text" placeholder="위치 이름 *" value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} className="flex-1 border rounded px-4 py-2 dark:bg-gray-700 dark:text-white" required />
          <input type="text" placeholder="설명" value={newLocation.description} onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })} className="flex-1 border rounded px-4 py-2 dark:bg-gray-700 dark:text-white" />
          <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded">+ 추가</button>
        </form>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b"><h3 className="font-semibold dark:text-white">위치 목록 ({locations.length}개)</h3></div>
        {loading ? <div className="py-10 text-center">로딩중...</div> : <table className="min-w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">이름</th><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">설명</th><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">등록일</th><th className="px-6 py-3 text-left text-xs uppercase dark:text-gray-300">작업</th></tr></thead><tbody className="divide-y dark:divide-gray-700">{locations.map(loc => <tr key={loc.id}><td className="px-6 py-4 dark:text-white">{loc.name}</td><td className="px-6 py-4 dark:text-gray-300">{loc.description || '-'}</td><td className="px-6 py-4 dark:text-gray-300">{new Date(loc.created_at).toLocaleDateString('ko-KR')}</td><td className="px-6 py-4"><button onClick={() => onDelete(loc.id, loc.name)} className="text-red-600">삭제</button></td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}

export default Settings;