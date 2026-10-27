import React from 'react';
import { Link } from 'react-router-dom';
import StreakBadge from './StreakBadge';

const HabitCard = ({
  habit,
  isCompleted = false,
  streak = 0,
  longestStreak = 0,
  onToggleComplete,
  onEdit = null,
  onDelete = null,
  isManagement = false,
}) => {
  const handleCheckClick = (e) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(habit._id, isCompleted);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleCheckClick(e);
    }
  };

  return (
    <div
      className="habit-card"
      style={{
        borderLeft: `5px solid ${habit.color || 'var(--primary)'}`,
        opacity: habit.isArchived ? 0.75 : 1,
      }}
    >
      {/* Habit Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
        {/* Check Button for Dashboard */}
        {!isManagement && (
          <button
            type="button"
            className={`habit-check-btn ${isCompleted ? 'checked' : ''}`}
            onClick={handleCheckClick}
            onKeyDown={handleKeyDown}
            aria-label={`Mark ${habit.name} as ${isCompleted ? 'incomplete' : 'completed'}`}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {isCompleted ? '✓' : ''}
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{habit.icon || '⭐'}</span>
            <Link
              to={`/habits/${habit._id}`}
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
              className="habit-title-link"
            >
              {habit.name}
            </Link>
            {habit.isArchived && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '2px 6px',
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
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                marginTop: '0.25rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {habit.description}
            </p>
          )}
        </div>
      </div>

      {/* Streak Badge & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <StreakBadge streak={streak} longestStreak={longestStreak} />

        {isManagement && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {onEdit && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onEdit(habit)}
                aria-label={`Edit ${habit.name}`}
                title="Edit habit"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onDelete(habit)}
                aria-label={`Delete ${habit.name}`}
                title="Delete habit"
                style={{ color: 'var(--danger)' }}
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
