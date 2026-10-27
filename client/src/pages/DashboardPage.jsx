import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { habitsApi, statsApi } from '../services/api';
import { getLocalTodayString, formatDisplayDate } from '../utils/dates';
import { triggerStreakCelebration } from '../utils/celebrate';

import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import WeeklyStrip from '../components/WeeklyStrip';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const DashboardPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const localToday = getLocalTodayString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [todayData, setTodayData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [todayRes, weeklyRes] = await Promise.all([
        statsApi.getTodayOverview({ date: localToday }),
        statsApi.getWeeklyStats({ date: localToday }),
      ]);

      setTodayData(todayRes.data);
      setWeeklyData(weeklyRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [localToday]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Optimistic Toggle Check-off
  const handleToggleHabit = async (habitId, currentCompletedStatus) => {
    if (!todayData) return;

    // Save previous snapshot for rollback
    const previousHabits = [...todayData.habits];
    const previousCompletedCount = todayData.completedCount;
    const targetHabit = todayData.habits.find((h) => h._id === habitId);
    if (!targetHabit) return;

    const newCompleted = !currentCompletedStatus;
    const streakDelta = newCompleted ? 1 : -1;
    const newStreak = Math.max(0, targetHabit.currentStreak + streakDelta);

    // Optimistically update todayData state
    setTodayData((prev) => {
      const updated = prev.habits.map((h) => {
        if (h._id === habitId) {
          return {
            ...h,
            completedToday: newCompleted,
            currentStreak: newStreak,
          };
        }
        return h;
      });

      const newCount = newCompleted ? prev.completedCount + 1 : prev.completedCount - 1;
      const newPct = prev.totalActive > 0 ? Math.round((newCount / prev.totalActive) * 100) : 0;

      return {
        ...prev,
        completedCount: newCount,
        progressPercentage: newPct,
        habits: updated,
      };
    });

    if (newCompleted) {
      triggerStreakCelebration(newStreak);
    }

    try {
      if (newCompleted) {
        await habitsApi.markCompleted(habitId, localToday);
        addToast(`Completed: ${targetHabit.name}! 🔥`, 'success', 2000);
      } else {
        await habitsApi.undoCompleted(habitId, localToday);
        addToast(`Unmarked: ${targetHabit.name}`, 'info', 2000);
      }

      // Refresh weekly stats smoothly in background
      statsApi.getWeeklyStats({ date: localToday }).then((res) => {
        setWeeklyData(res.data);
      }).catch(() => {});
    } catch (err) {
      // Revert optimistic update
      setTodayData((prev) => ({
        ...prev,
        habits: previousHabits,
        completedCount: previousCompletedCount,
        progressPercentage:
          prev.totalActive > 0
            ? Math.round((previousCompletedCount / prev.totalActive) * 100)
            : 0,
      }));
      addToast(`Error: ${err.message}. Changes reverted.`, 'error');
    }
  };

  // Add Habit Submit
  const handleCreateHabit = async (habitData) => {
    setIsCreating(true);
    try {
      await habitsApi.createHabit(habitData);
      addToast('Habit created successfully!', 'success');
      setIsFormOpen(false);
      // Refresh dashboard list
      fetchDashboardData();
    } catch (err) {
      addToast(`Error creating habit: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <Loader message="Loading your daily tracker..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const habits = todayData?.habits || [];
  const completedCount = todayData?.completedCount || 0;
  const totalActive = todayData?.totalActive || 0;
  const progressPct = todayData?.progressPercentage || 0;

  return (
    <div>
      {/* Header Greeting & Today Date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            📅 {formatDisplayDate(localToday)}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsFormOpen(true)}
          aria-label="Add new habit"
        >
          <span>+</span> Add Habit
        </button>
      </div>

      {/* Progress Card */}
      {totalActive > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <ProgressBar
            value={completedCount}
            max={totalActive}
            label={`Today's Progress: ${completedCount} of ${totalActive} habits completed`}
          />
        </div>
      )}

      {/* Weekly Consistency Strip */}
      {weeklyData && <WeeklyStrip weeklyData={weeklyData} />}

      {/* Habits List Header */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Today's Habits ({completedCount}/{totalActive})
        </h2>
        {totalActive > 0 && completedCount === totalActive && (
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--success-text)',
              backgroundColor: 'var(--success-subtle)',
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            🎉 All done for today!
          </span>
        )}
      </div>

      {/* Empty State */}
      {habits.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="No habits tracked yet"
          description="Build daily momentum by creating your first daily habit now."
          actionLabel="Create Habit"
          onAction={() => setIsFormOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {habits.map((habit) => (
            <HabitCard
              key={habit._id}
              habit={habit}
              isCompleted={habit.completedToday}
              streak={habit.currentStreak}
              longestStreak={habit.longestStreak}
              onToggleComplete={handleToggleHabit}
            />
          ))}
        </div>
      )}

      {/* Create Habit Modal */}
      <HabitForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateHabit}
        isLoading={isCreating}
      />
    </div>
  );
};

export default DashboardPage;
