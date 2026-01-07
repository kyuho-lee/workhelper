import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MonthlyTrendChart,
  StatusDoughnutChart,
  AssetStatusBarChart,
  PriorityPieChart,
  CategoryBarChart
} from './Charts';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/statistics/dashboard');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-white">로딩중...</div>;
  if (!stats) return <div className="text-center py-10 dark:text-white">데이터를 불러올 수 없습니다.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">통계 및 리포트</h2>
        <button
          onClick={() => window.print()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          인쇄/PDF
        </button>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">전체 자산</p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.summary.total_assets}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">전체 장애</p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{stats.summary.total_issues}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">미해결 장애</p>
          <p className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.summary.open_issues}</p>
        </div>
      </div>

      {/* 모든 차트 표시 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.monthly_assets && stats.monthly_assets.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '350px' }}>
              <MonthlyTrendChart data={stats.monthly_assets} title="월별 자산 등록 추이" />
            </div>
          </div>
        )}

        {stats.monthly_issues && stats.monthly_issues.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '350px' }}>
              <MonthlyTrendChart data={stats.monthly_issues} title="월별 장애 등록 추이" />
            </div>
          </div>
        )}

        {stats.asset_status && stats.asset_status.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '350px' }}>
              <AssetStatusBarChart data={stats.asset_status} title="자산 상태별 분포" />
            </div>
          </div>
        )}

        {stats.issue_priority && stats.issue_priority.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '350px' }}>
              <PriorityPieChart data={stats.issue_priority} title="장애 우선순위별 분포" />
            </div>
          </div>
        )}

        {stats.issue_status && stats.issue_status.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div style={{ height: '350px' }}>
              <StatusDoughnutChart data={stats.issue_status} title="장애 상태별 분포" />
            </div>
          </div>
        )}

        {stats.asset_categories && stats.asset_categories.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
            <div style={{ height: '350px' }}>
              <CategoryBarChart data={stats.asset_categories} title="자산 분류별 Top 10" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Statistics;