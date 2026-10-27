import React from 'react';
import { getLocalTodayString } from '../utils/dates';

const WeeklyStrip = ({ weeklyData }) => {
  const localToday = getLocalTodayString();

  if (!weeklyData || !weeklyData.days) {
    return null;
  }

  const { days, overallWeeklyPercentage } = weeklyData;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Weekly Consistency
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Monday to Sunday habit cadence
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)' }}>
            {overallWeeklyPercentage}%
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>weekly score</p>
        </div>
      </div>

      <div className="weekly-strip" role="region" aria-label="Weekly habit consistency">
        {days.map((day) => {
          const isToday = day.date === localToday;
          const dayNum = parseInt(day.date.split('-')[2], 10);
          const hasCompletions = day.completed > 0;

          return (
            <div
              key={day.date}
              className={`weekly-day-card ${isToday ? 'is-today' : ''}`}
              title={`${day.dayName}, ${day.date}: ${day.completed}/${day.total} habits completed (${day.percentage}%)`}
              aria-label={`${day.dayName} ${day.date}: ${day.completed} of ${day.total} completed`}
            >
              <span className="weekly-day-name">{day.dayName}</span>
              <span className="weekly-day-date">{dayNum}</span>
              <span
                className="weekly-day-ratio"
                style={{
                  color: hasCompletions ? 'var(--success-text)' : 'var(--text-muted)',
                }}
              >
                {day.completed}/{day.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyStrip;
