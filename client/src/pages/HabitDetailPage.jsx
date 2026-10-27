import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { habitsApi, statsApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import { getLocalTodayString, formatDisplayDate } from '../utils/dates';
import { triggerStreakCelebration } from '../utils/celebrate';

import Heatmap from '../components/Heatmap';
import HabitForm from '../components/HabitForm';
import StreakBadge from '../components/StreakBadge';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';

const HabitDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const localToday = getLocalTodayString();

  const [habit, setHabit] = useState(null);
  const [stats, setStats] = useState(null);
  const [heatmapDays, setHeatmapDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchHabitDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [habitRes, statsRes, heatmapRes] = await Promise.all([
        habitsApi.getHabitById(id),
        habitsApi.getHabitStats(id, { today: localToday }),
        statsApi.getHeatmapData({ days: 365, date: localToday, habitId: id }),
      ]);

      setHabit(habitRes.data.habit);
      setStats(statsRes.data);
      setHeatmapDays(heatmapRes.data.days || []);
    } catch (err) {
      setError(err.message || 'Failed to load habit details');
    } finally {
      setLoading(false);
    }
  }, [id, localToday]);

  useEffect(() => {
    fetchHabitDetail();
  }, [fetchHabitDetail]);

  // Handle cell click in heatmap (back-fill or undo past day up to 30 days)
  const handleCellClick = async (dateStr, isCurrentlyCompleted) => {
    try {
      if (isCurrentlyCompleted) {
        await habitsApi.undoCompleted(id, dateStr);
        addToast(`Unmarked ${formatDisplayDate(dateStr)}`, 'info', 2000);
      } else {
        await habitsApi.markCompleted(id, dateStr);
        addToast(`Marked completed for ${formatDisplayDate(dateStr)}!`, 'success', 2000);
      }

      // Refresh stats and heatmap
      const [statsRes, heatmapRes] = await Promise.all([
        habitsApi.getHabitStats(id, { today: localToday }),
        statsApi.getHeatmapData({ days: 365, date: localToday, habitId: id }),
      ]);
      setStats(statsRes.data);
      setHeatmapDays(heatmapRes.data.days || []);

      if (!isCurrentlyCompleted) {
        triggerStreakCelebration(statsRes.data.currentStreak);
      }
    } catch (err) {
      addToast(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleUpdateHabit = async (formData) => {
    setIsUpdating(true);
    try {
      const res = await habitsApi.updateHabit(id, formData);
      setHabit(res.data.habit);
      addToast('Habit updated successfully!', 'success');
      setIsEditOpen(false);
    } catch (err) {
      addToast(`Update error: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <Loader message="Loading habit analysis & heatmap..." />;
  }

  if (error) {
    return (
      <div>
        <Link to="/habits" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
          ← Back to Habits
        </Link>
        <ErrorState message={error} onRetry={fetchHabitDetail} />
      </div>
    );
  }

  if (!habit) return null;

  return (
    <div>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/habits" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
          ← Back to Habits
        </Link>
      </div>

      {/* Habit Header Card */}
      <div
        className="card"
        style={{
          borderLeft: `6px solid ${habit.color || 'var(--primary)'}`,
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{habit.icon || '⭐'}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {habit.name}
                </h1>
                {habit.isArchived && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    Archived
                  </span>
                )}
              </div>
              {habit.description && (
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {habit.description}
                </p>
              )}
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditOpen(true)}
          >
            ✏️ Edit Habit
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              CURRENT STREAK
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: '0.25rem 0' }}>
              🔥 {stats.currentStreak}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>consecutive days</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              LONGEST STREAK
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
              🏆 {stats.longestStreak}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>all-time record</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              TOTAL COMPLETIONS
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', margin: '0.25rem 0' }}>
              📈 {stats.totalCompletions}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>days recorded</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              LAST 30 DAYS
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
              🎯 {stats.completionRateLast30Days}%
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>consistency rate</p>
          </div>
        </div>
      )}

      {/* 365-Day Single Habit Heatmap */}
      <Heatmap
        days={heatmapDays}
        title="365-Day Consistency Heatmap"
        subtitle="Visual history for this habit"
        onCellClick={handleCellClick}
        interactiveDaysLimit={30}
      />

      {/* Edit Modal */}
      <HabitForm
        isOpen={isEditOpen}
        initialData={habit}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateHabit}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default HabitDetailPage;
