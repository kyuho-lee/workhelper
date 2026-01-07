import React from 'react';
import { Link } from 'react-router-dom';

// 1. 담당자별 업무 현황 위젯
export function AssigneeWorkloadWidget({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          담당자별 업무 현황
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          👥 담당자별 업무 현황
        </h3>
        <Link
          to="/issues"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          전체보기 →
        </Link>
      </div>
      
      <div className="space-y-4">
        {data.slice(0, 5).map((assignee, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {assignee.assignee}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({assignee.in_progress} 처리중 / {assignee.completed} 완료)
                </span>
              </div>
              <span className={`text-sm font-semibold ${
                assignee.completion_rate >= 80 ? 'text-green-600 dark:text-green-400' :
                assignee.completion_rate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {assignee.completion_rate}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  assignee.completion_rate >= 80 ? 'bg-green-500' :
                  assignee.completion_rate >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${assignee.completion_rate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. 미해결 장애 타임라인 위젯
export function OldUnresolvedIssuesWidget({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          오래된 미해결 장애
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          미해결 장애가 없습니다. 🎉
        </p>
      </div>
    );
  }

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getUrgencyText = (days) => {
    if (days === 0) return '오늘';
    if (days === 1) return '1일 경과';
    return `${days}일 경과`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ⏰ 오래된 미해결 장애
        </h3>
        <Link
          to="/issues"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          전체보기 →
        </Link>
      </div>
      
      <div className="space-y-3">
        {data.map((issue) => (
          <Link
            key={issue.id}
            to={`/issues/edit/${issue.id}`}
            className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2 flex-1">
                <span className="text-lg">{getUrgencyIcon(issue.urgency)}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {issue.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    담당자: {issue.assignee || '미배정'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold ${
                  issue.urgency === 'high' ? 'text-red-600 dark:text-red-400' :
                  issue.urgency === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {getUrgencyText(issue.elapsed_days)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                {issue.priority}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// 3. 주간/월간 비교 위젯
export function PeriodComparisonWidget({ data }) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          기간 비교
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">데이터가 없습니다.</p>
      </div>
    );
  }

  const renderChangeIndicator = (change) => {
    if (change === 0) {
      return <span className="text-gray-600 dark:text-gray-400">→ 변동없음</span>;
    }
    
    const isPositive = change > 0;
    return (
      <span className={`flex items-center gap-1 ${
        isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
      }`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change)}%
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📊 기간별 비교
      </h3>
      
      <div className="space-y-6">
        {/* 주간 비교 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            이번 주 vs 지난 주
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📦</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">자산</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {data.weekly.assets.this_week}개
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium">
                {renderChangeIndicator(data.weekly.assets.change)}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🔧</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">장애</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {data.weekly.issues.this_week}건
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium">
                {renderChangeIndicator(data.weekly.issues.change)}
              </div>
            </div>
          </div>
        </div>

        {/* 월간 비교 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            이번 달 vs 지난 달
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📦</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">자산</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {data.monthly.assets.this_month}개
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium">
                {renderChangeIndicator(data.monthly.assets.change)}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🔧</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">장애</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {data.monthly.issues.this_month}건
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium">
                {renderChangeIndicator(data.monthly.issues.change)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}