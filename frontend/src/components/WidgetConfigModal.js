import React, { useState, useEffect } from 'react';

// 🎨 확장된 색상 팔레트
const COLOR_PALETTE = [
  { name: 'red', hex: '#ef4444', label: '빨강' },
  { name: 'orange', hex: '#f97316', label: '주황' },
  { name: 'amber', hex: '#f59e0b', label: '황금' },
  { name: 'yellow', hex: '#eab308', label: '노랑' },
  { name: 'lime', hex: '#84cc16', label: '연두' },
  { name: 'green', hex: '#22c55e', label: '초록' },
  { name: 'emerald', hex: '#10b981', label: '에메랄드' },
  { name: 'cyan', hex: '#06b6d4', label: '청록' },
  { name: 'blue', hex: '#3b82f6', label: '파랑' },
  { name: 'indigo', hex: '#6366f1', label: '남색' },
  { name: 'purple', hex: '#a855f7', label: '보라' },
  { name: 'pink', hex: '#ec4899', label: '분홍' },
  { name: 'gray', hex: '#6b7280', label: '회색' }
];

function WidgetConfigModal({ widget, onSave, onClose }) {
  const [config, setConfig] = useState({});

  useEffect(() => {
    // 위젯의 현재 설정을 로드
    setConfig(widget.config_data || {});
  }, [widget]);

  const handleSave = () => {
    console.log('=== 모달에서 저장 클릭 ===');
    console.log('위젯:', widget);
    console.log('저장할 설정:', config);
    onSave(widget.widget_id, config);
  };

  // 색상 선택 컴포넌트
  const ColorPicker = ({ value, onChange, label }) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="grid grid-cols-7 gap-2">
          {COLOR_PALETTE.map(color => (
            <button
              key={color.name}
              onClick={() => onChange(color.name)}
              className={`w-10 h-10 rounded-md border-2 transition-all ${
                value === color.name 
                  ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.label}
            />
          ))}
        </div>
        {value && (
          <p className="text-xs text-gray-500 mt-2">
            선택: {COLOR_PALETTE.find(c => c.name === value)?.label}
          </p>
        )}
      </div>
    );
  };

  // 위젯 타입별 설정 옵션
  const renderConfigOptions = () => {
    switch (widget.widget_id) {
      case 'monthly_assets':
      case 'monthly_issues':
        return (
          <div className="space-y-4">
            {/* 차트 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                차트 종류
              </label>
              <select
                value={config.chart_type || 'line'}
                onChange={(e) => setConfig({ ...config, chart_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="line">선 그래프</option>
                <option value="bar">막대 그래프</option>
              </select>
            </div>

            {/* 색상 선택 (확장) */}
            <ColorPicker
              value={config.color || 'blue'}
              onChange={(color) => setConfig({ ...config, color })}
              label="색상"
            />

            {/* 기간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                기간
              </label>
              <select
                value={config.period || 12}
                onChange={(e) => setConfig({ ...config, period: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={3}>최근 3개월</option>
                <option value={6}>최근 6개월</option>
                <option value={12}>최근 12개월</option>
                <option value={24}>최근 24개월</option>
              </select>
            </div>
          </div>
        );

      case 'issue_priority':
        return (
          <div className="space-y-4">
            {/* 차트 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                차트 종류
              </label>
              <select
                value={config.chart_type || 'pie'}
                onChange={(e) => setConfig({ ...config, chart_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="bar">막대 그래프</option>
                <option value="pie">파이 차트</option>
                <option value="doughnut">도넛 차트</option>
              </select>
            </div>

            {/* 색상 프리셋 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                색상 프리셋
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '긴급': 'red', '높음': 'orange', '보통': 'yellow', '낮음': 'green' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 text-white rounded hover:opacity-80"
                >
                  긴급→낮음
                </button>
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '긴급': 'blue', '높음': 'indigo', '보통': 'purple', '낮음': 'pink' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded hover:opacity-80"
                >
                  쿨톤
                </button>
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '긴급': 'purple', '높음': 'pink', '보통': 'orange', '낮음': 'yellow' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white rounded hover:opacity-80"
                >
                  선셋
                </button>
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '긴급': 'cyan', '높음': 'emerald', '보통': 'lime', '낮음': 'yellow' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-cyan-500 via-emerald-500 to-lime-500 text-white rounded hover:opacity-80"
                >
                  민트
                </button>
              </div>
            </div>

            {/* 개별 색상 설정 */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                우선순위별 개별 색상
              </p>
              {['긴급', '높음', '보통', '낮음'].map((priority) => (
                <div key={priority} className="flex items-center gap-3">
                  <span className="text-sm w-12 text-gray-700 dark:text-gray-300">{priority}</span>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color.name}
                        onClick={() => {
                          const colors = config.custom_colors || { '긴급': 'red', '높음': 'orange', '보통': 'yellow', '낮음': 'green' };
                          setConfig({ 
                            ...config, 
                            custom_colors: {
                              ...colors,
                              [priority]: color.name
                            }
                          });
                        }}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          (config.custom_colors || { '긴급': 'red', '높음': 'orange', '보통': 'yellow', '낮음': 'green' })[priority] === color.name
                            ? 'border-gray-900 dark:border-white ring-2 ring-offset-1 ring-gray-400'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'issue_status':
        return (
          <div className="space-y-4">
            {/* 차트 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                차트 종류
              </label>
              <select
                value={config.chart_type || 'doughnut'}
                onChange={(e) => setConfig({ ...config, chart_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="bar">막대 그래프</option>
                <option value="pie">파이 차트</option>
                <option value="doughnut">도넛 차트</option>
              </select>
            </div>

            {/* 색상 프리셋 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                색상 프리셋
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '처리중': 'red', '진행중': 'amber', '해결됨': 'green', '종료': 'gray' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-red-500 via-green-500 to-gray-500 text-white rounded hover:opacity-80"
                >
                  신호등
                </button>
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '처리중': 'purple', '진행중': 'blue', '해결됨': 'cyan', '종료': 'green' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 text-white rounded hover:opacity-80"
                >
                  오션
                </button>
              </div>
            </div>

            {/* 개별 색상 설정 */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                상태별 개별 색상
              </p>
              {['처리중', '진행중', '해결됨', '종료'].map((status) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-gray-700 dark:text-gray-300">{status}</span>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color.name}
                        onClick={() => {
                          const colors = config.custom_colors || { '처리중': 'red', '진행중': 'amber', '해결됨': 'green', '종료': 'gray' };
                          setConfig({ 
                            ...config, 
                            custom_colors: {
                              ...colors,
                              [status]: color.name
                            }
                          });
                        }}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          (config.custom_colors || { '처리중': 'red', '진행중': 'amber', '해결됨': 'green', '종료': 'gray' })[status] === color.name
                            ? 'border-gray-900 dark:border-white ring-2 ring-offset-1 ring-gray-400'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'asset_status':
        return (
          <div className="space-y-4">
            {/* 차트 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                차트 종류
              </label>
              <select
                value={config.chart_type || 'bar'}
                onChange={(e) => setConfig({ ...config, chart_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="bar">막대 그래프</option>
                <option value="pie">파이 차트</option>
                <option value="doughnut">도넛 차트</option>
              </select>
            </div>

            {/* 색상 프리셋 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                색상 프리셋
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '정상': 'green', '수리중': 'orange', '정비중': 'blue', '폐기': 'gray' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-green-500 via-orange-500 to-gray-500 text-white rounded hover:opacity-80"
                >
                  기본
                </button>
                <button
                  onClick={() => setConfig({ 
                    ...config, 
                    custom_colors: { '정상': 'emerald', '수리중': 'amber', '정비중': 'cyan', '폐기': 'red' }
                  })}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-emerald-500 via-cyan-500 to-red-500 text-white rounded hover:opacity-80"
                >
                  선명
                </button>
              </div>
            </div>

            {/* 개별 색상 설정 */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                상태별 개별 색상
              </p>
              {['정상', '수리중', '정비중', '폐기'].map((status) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-gray-700 dark:text-gray-300">{status}</span>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color.name}
                        onClick={() => {
                          const colors = config.custom_colors || { 
                            '정상': 'green', 
                            '수리중': 'orange',
                            '정비중': 'blue',
                            '폐기': 'gray' 
                          };
                          setConfig({ 
                            ...config, 
                            custom_colors: {
                              ...colors,
                              [status]: color.name
                            }
                          });
                        }}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          (config.custom_colors || { 
                            '정상': 'green', 
                            '수리중': 'orange',
                            '정비중': 'blue',
                            '폐기': 'gray' 
                          })[status] === color.name
                            ? 'border-gray-900 dark:border-white ring-2 ring-offset-1 ring-gray-400'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'asset_categories':
        return (
          <div className="space-y-4">
            {/* 차트 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                차트 종류
              </label>
              <select
                value={config.chart_type || 'bar'}
                onChange={(e) => setConfig({ ...config, chart_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="bar">막대 그래프</option>
                <option value="pie">파이 차트</option>
              </select>
            </div>

            {/* 색상 모드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                색상 모드
              </label>
              <select
                value={config.color_mode || 'single'}
                onChange={(e) => setConfig({ ...config, color_mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="single">단일 색상</option>
                <option value="gradient">그라데이션</option>
                <option value="rainbow">무지개</option>
              </select>
            </div>

            {/* 단일 색상 선택 */}
            {config.color_mode === 'single' && (
              <ColorPicker
                value={config.color || 'green'}
                onChange={(color) => setConfig({ ...config, color })}
                label="기본 색상"
              />
            )}

            {/* 그라데이션 기본 색상 */}
            {config.color_mode === 'gradient' && (
              <ColorPicker
                value={config.color || 'blue'}
                onChange={(color) => setConfig({ ...config, color })}
                label="그라데이션 기본 색상"
              />
            )}

            {/* 표시 개수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                표시 개수
              </label>
              <select
                value={config.top_n || 10}
                onChange={(e) => setConfig({ ...config, top_n: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
              </select>
            </div>
          </div>
        );

      case 'recent_assets':
      case 'recent_issues':
        return (
          <div className="space-y-4">
            {/* 표시 개수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                표시 개수
              </label>
              <select
                value={config.count || 5}
                onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={3}>3개</option>
                <option value={5}>5개</option>
                <option value={10}>10개</option>
              </select>
            </div>
          </div>
        );

      default:
        return <p className="text-gray-500">이 위젯은 설정 옵션이 없습니다.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {widget.widget_name} 설정
          </h3>
        </div>

        {/* 본문 */}
        <div className="px-6 py-4">
          {renderConfigOptions()}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default WidgetConfigModal;