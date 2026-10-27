import React, { useState, useEffect, useCallback } from 'react';
import { statsApi } from '../services/api';
import { getLocalTodayString } from '../utils/dates';

import Heatmap from '../components/Heatmap';
import WeeklyStrip from '../components/WeeklyStrip';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const InsightsPage = () => {
  const localToday = getLocalTodayString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [heatRes, weekRes] = await Promise.all([
        statsApi.getHeatmapData({ days: 365, date: localToday }),
        statsApi.getWeeklyStats({ date: localToday }),
      ]);

      setHeatmapData(heatRes.data);
      setWeeklyData(weekRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load insights data');
    } finally {
      setLoading(false);
    }
  }, [localToday]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return <Loader message="Compiling overall habits analysis & heatmap..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchInsights} />;
  }

  const days = heatmapData?.days || [];
  const totalHabits = heatmapData?.totalExpectedPerDay || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Habit Insights & Heatmap
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Long-term consistency visualization across all your active habits
        </p>
      </div>

      {totalHabits === 0 ? (
        <EmptyState
          icon="📊"
          title="No habits to analyze"
          description="Create some active habits and start checking them off to see your consistency heatmap evolve."
        />
      ) : (
        <>
          {/* Weekly Summary */}
          {weeklyData && <WeeklyStrip weeklyData={weeklyData} />}

          {/* Aggregate Heatmap */}
          <Heatmap
            days={days}
            title="All-Habits Annual Consistency Heatmap"
            subtitle={`Tracking ${totalHabits} active habits across the past 365 days`}
            onCellClick={null}
          />

          {/* Motivational Tip Card */}
          <div
            className="card"
            style={{
              borderLeft: '5px solid var(--primary)',
              backgroundColor: 'var(--bg-surface)',
              marginTop: '1.5rem',
            }}
          >
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              💡 The Power of Consistency
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Research shows that small, consistent daily actions compound dramatically over time. Don't worry about perfection—even completing 70% of your habits creates lasting life momentum. Keep your streaks alive!
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default InsightsPage;
