import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MonthlyTrendChart,
  StatusDoughnutChart,
  AssetStatusBarChart,
  PriorityPieChart,
  CategoryBarChart
} from './Charts';

import {
  AssigneeWorkloadWidget,
  OldUnresolvedIssuesWidget,
  PeriodComparisonWidget
} from './Top3Widgets';
import API_BASE_URL from './config/api';

function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [widgetConfig, setWidgetConfig] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigneeWorkload, setAssigneeWorkload] = useState([]);
  const [oldIssues, setOldIssues] = useState([]);
  const [periodComparison, setPeriodComparison] = useState(null);

  useEffect(() => {
    fetchData();
  }, []); // ✅ 이렇게 수정!

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [
        statsRes, 
        configRes, 
        assetsRes, 
        issuesRes,
        workloadRes,      // 추가!
        oldIssuesRes,     // 추가!
        comparisonRes     // 추가!
      ] = await Promise.all([
        axios.get('${API_BASE_URL}/api/statistics/dashboard', config),
        axios.get('${API_BASE_URL}/api/dashboard-config', config),
        axios.get('${API_BASE_URL}/api/assets', config),
        axios.get('${API_BASE_URL}/api/issues', config),
        axios.get('${API_BASE_URL}/api/statistics/assignee-workload', config),              // 추가!
        axios.get('${API_BASE_URL}/api/statistics/old-unresolved-issues?limit=5', config), // 추가!
        axios.get('${API_BASE_URL}/api/statistics/period-comparison', config)              // 추가!
      ]);

      setStats(statsRes.data);
      setWidgetConfig(configRes.data);
      
      // 기존 코드...
      const sortedAssets = assetsRes.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentAssets(sortedAssets.slice(0, 5));

      const sortedIssues = issuesRes.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentIssues(sortedIssues.slice(0, 5));

      // 새 위젯 데이터 (추가!)
      setAssigneeWorkload(workloadRes.data);
      setOldIssues(oldIssuesRes.data);
      setPeriodComparison(comparisonRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      setLoading(false);
    }
  };

  const isWidgetVisible = (widgetId) => {
    const config = widgetConfig.find(w => w.widget_id === widgetId);
    return config ? config.is_visible : true;
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'open': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getStatusText = (status) => {
    const statusText = {
      'open': '처리중',
      'in_progress': '진행중',
      'resolved': '해결됨',
      'closed': '종료'
    };
    return statusText[status] || status;
  };

  // 위젯 렌더링 함수
  const renderWidget = (widgetId) => {
    if (!isWidgetVisible(widgetId) || !stats) return null;

    // 위젯 설정 가져오기
    const widgetSettings = widgetConfig.find(w => w.widget_id === widgetId);
    const config = widgetSettings?.config_data || {};


    switch (widgetId) {
      case 'monthly_assets':
        if (!stats.monthly_assets || stats.monthly_assets.length === 0) return null;
        
        // 기간에 따라 데이터 필터링
        const assetPeriod = config.period || 12;
        const filteredAssets = stats.monthly_assets.slice(-assetPeriod);

        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '300px' }}>
              <MonthlyTrendChart 
                data={filteredAssets} 
                title="월별 자산 등록 추이"
                config={config}
              />
            </div>
          </div>
        );

      case 'monthly_issues':
        if (!stats.monthly_issues || stats.monthly_issues.length === 0) return null;
        
        // 기간에 따라 데이터 필터링
        const issuePeriod = config.period || 12;
        const filteredIssues = stats.monthly_issues.slice(-issuePeriod);
        
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '300px' }}>
              <MonthlyTrendChart 
                data={filteredIssues} 
                title="월별 장애 등록 추이"
                config={config}
              />
            </div>
          </div>
        );

      case 'asset_status':
        return stats.asset_status && stats.asset_status.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '300px' }}>
              <AssetStatusBarChart 
                data={stats.asset_status} 
                title="자산 상태별 분포"
                config={config}
              />
            </div>
          </div>
        );

      case 'issue_priority':
        return stats.issue_priority && stats.issue_priority.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '300px' }}>
              <PriorityPieChart 
                data={stats.issue_priority} 
                title="장애 우선순위별 분포"
                config={config}
              />
            </div>
          </div>
        );

      case 'issue_status':
        return stats.issue_status && stats.issue_status.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '300px' }}>
              <StatusDoughnutChart 
                data={stats.issue_status} 
                title="장애 상태별 분포"
                config={config}
              />
            </div>
          </div>
        );

      case 'asset_categories':
        if (!stats.asset_categories || stats.asset_categories.length === 0) return null;
        
        // top_n에 따라 데이터 제한
        const topN = config.top_n || 10;
        const topCategories = stats.asset_categories.slice(0, topN);
        
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '300px' }}>
              <CategoryBarChart 
                data={topCategories} 
                title={`자산 분류별 Top ${topN}`}
                config={config}
              />
            </div>
          </div>
        );

      case 'recent_assets':
        const assetCount = config.count || 5;
        const displayAssets = recentAssets.slice(0, assetCount);
        
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                최근 등록된 자산 ({assetCount}개)
              </h3>
            </div>
            <div className="p-6">
              {displayAssets.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">등록된 자산이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {displayAssets.map((asset) => (
                    <Link
                      key={asset.id}
                      to={`/assets/${asset.id}`}
                      className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{asset.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{asset.asset_number}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(asset.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    to="/assets"
                    className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
                  >
                    전체보기 →
                  </Link>
                </div>
              )}
            </div>
          </div>
        );

      case 'recent_issues':
        const issueCount = config.count || 5;
        const displayIssues = recentIssues.slice(0, issueCount);

      
        
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                최근 등록된 장애 ({issueCount}개)
              </h3>
            </div>
            <div className="p-6">
              {displayIssues.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">등록된 장애가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {displayIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      to={`/issues/edit/${issue.id}`}
                      className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900 dark:text-white">{issue.title}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(issue.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(issue.status)}`}>
                          {getStatusText(issue.status)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {issue.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    to="/issues"
                    className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
                  >
                    전체보기 →
                  </Link>
                </div>
              )}
            </div>
          </div>
        );

        case 'assignee_workload':
        return <AssigneeWorkloadWidget data={assigneeWorkload} />;

        case 'old_unresolved_issues':
          return <OldUnresolvedIssuesWidget data={oldIssues} />;

        case 'period_comparison':
          return <PeriodComparisonWidget data={periodComparison} />;
          
      default:
        return null;
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;
  if (!stats) return <div className="text-center py-10 dark:text-white">데이터를 불러올 수 없습니다.</div>;

  // 표시 순서대로 정렬 (표시되는 위젯만)
  const sortedWidgets = [...widgetConfig]
    .filter(w => w.is_visible)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">대시보드</h2>
        {isAdmin && (
          <Link
            to="/dashboard-settings"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            대시보드 설정
          </Link>
        )}
      </div>

      {/* 요약 통계 (항상 표시) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 자산</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.total_assets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 장애</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.total_issues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">미해결 장애</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.open_issues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 모든 위젯을 순서대로 표시 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedWidgets.map(widget => (
          <React.Fragment key={widget.widget_id}>
            {renderWidget(widget.widget_id)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;