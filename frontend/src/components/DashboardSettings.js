import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WidgetConfigModal from './WidgetConfigModal';
import API_BASE_URL from './config/api';

function DashboardSettings() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [configModalWidget, setConfigModalWidget] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/');
      return;
    }
    fetchWidgets();
  }, [isAdmin, navigate]);

  const fetchWidgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('${API_BASE_URL}/api/dashboard-config', config);
      console.log('위젯 개수:', response.data.length);
      console.log('위젯 목록:', response.data.map(w => w.widget_name));
      setWidgets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const toggleVisibility = async (widgetId, currentVisibility) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE_URL}/api/dashboard-config/${widgetId}`, {
        is_visible: !currentVisibility
      }, config);
      fetchWidgets();
    } catch (error) {
      alert('설정 변경 실패: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[draggedItem];
    
    newWidgets.splice(draggedItem, 1);
    newWidgets.splice(index, 0, draggedWidget);
    
    setDraggedItem(index);
    setWidgets(newWidgets);
  };

  const handleDragEnd = async () => {
    if (draggedItem === null) return;

    const widgetOrders = widgets.map((widget, index) => ({
      widget_id: widget.widget_id,
      display_order: index + 1
    }));

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('${API_BASE_URL}/api/dashboard-config/reorder', widgetOrders, config);
      setDraggedItem(null);
      fetchWidgets();
    } catch (error) {
      alert('순서 변경 실패: ' + (error.response?.data?.detail || error.message));
      fetchWidgets();
    }
  };

  const openConfigModal = (widget) => {
    setConfigModalWidget(widget);
  };

  const closeConfigModal = () => {
    setConfigModalWidget(null);
  };

  const saveWidgetConfig = async (widgetId, configData) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(
        `${API_BASE_URL}/api/dashboard-config/${widgetId}`, 
        {
          config_data: configData
        },
        config
      );
      
      closeConfigModal();
      await fetchWidgets();
      
      if (window.confirm('위젯 설정이 저장되었습니다.\n대시보드를 새로고침하시겠습니까?')) {
        navigate('/');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
      
    } catch (error) {
      console.error('=== 저장 실패 ===');
      console.error('에러:', error);
      console.error('에러 응답:', error.response?.data);
      alert('설정 저장 실패: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetToDefault = async () => {
    if (!window.confirm('모든 설정을 초기화하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('${API_BASE_URL}/api/dashboard-config/reset', {}, config);
      alert('설정이 초기화되었습니다.');
      fetchWidgets();
    } catch (error) {
      alert('초기화 실패: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          대시보드 설정 (위젯 {widgets.length}개)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            초기화
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">사용 방법</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>체크박스를 클릭하여 위젯을 표시하거나 숨길 수 있습니다.</li>
            <li>위젯을 드래그하여 순서를 변경할 수 있습니다.</li>
            <li><strong>⚙️ 버튼</strong>을 클릭하여 그래프 종류, 색상, 기간 등을 변경할 수 있습니다.</li>
            <li>변경사항은 자동으로 저장되며, 모든 사용자에게 적용됩니다.</li>
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">위젯 목록</h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {widgets.map((widget, index) => (
            <div
              key={widget.widget_id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                draggedItem === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4 cursor-move">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={widget.is_visible}
                      onChange={() => toggleVisibility(widget.widget_id, widget.is_visible)}
                      className="h-4 w-4 text-blue-600 rounded mr-3 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {widget.widget_name}
                    </span>
                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                      widget.is_visible 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {widget.is_visible ? '표시' : '숨김'}
                    </span>
                  </div>
                  {widget.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                      {widget.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openConfigModal(widget)}
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                    title="위젯 설정"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    순서: {index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              위젯의 ⚙️ 버튼을 클릭하여 그래프 종류, 색상, 표시 개수 등을 변경할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 설정 모달 */}
      {configModalWidget && (
        <WidgetConfigModal
          widget={configModalWidget}
          onSave={saveWidgetConfig}
          onClose={closeConfigModal}
        />
      )}
    </div>
  );
}

export default DashboardSettings;