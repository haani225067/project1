import React, { useState } from 'react';
import { formatDisplayDate, diffInDays, getLocalTodayString } from '../utils/dates';

const Heatmap = ({
  days = [],
  title = 'Annual Consistency Heatmap',
  subtitle = 'Completions over the past 365 days',
  onCellClick = null,
  interactiveDaysLimit = 30, // Can only backfill up to 30 days
}) => {
  const [tooltip, setTooltip] = useState(null);
  const localToday = getLocalTodayString();

  if (!days || days.length === 0) {
    return null;
  }

  // Calculate day-of-week offset for first day (Monday = 0, ..., Sunday = 6)
  const firstDate = days[0].date;
  const [y, m, d] = firstDate.split('-').map(Number);
  const firstDayOfWeek = new Date(y, m - 1, d).getDay(); // 0 is Sun, 1 is Mon
  const paddingBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Grid cells including null padding before the start
  const cells = [
    ...Array(paddingBefore).fill(null),
    ...days,
  ];

  // Month labels calculation: find the first occurrence of each month
  const monthLabels = [];
  let currentMonth = -1;
  const totalWeeks = Math.ceil(cells.length / 7);

  cells.forEach((cell, index) => {
    if (cell) {
      const [year, month] = cell.date.split('-').map(Number);
      if (month !== currentMonth) {
        currentMonth = month;
        const weekCol = Math.floor(index / 7);
        const monthName = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short' });
        monthLabels.push({ name: monthName, col: weekCol });
      }
    }
  });

  const handleMouseEnter = (cell, e) => {
    if (!cell) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const countText = cell.total > 1
      ? `${cell.count} of ${cell.total} completed`
      : cell.count > 0 ? 'Completed' : 'No completions';

    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text: `${formatDisplayDate(cell.date)}: ${countText}`,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleCellClick = (cell) => {
    if (!cell || !onCellClick) return;

    // Check if within clickable window (today or past 30 days)
    const diff = diffInDays(localToday, cell.date);
    if (diff < -1) {
      return; // More than 1 day in the future
    }
    if (diff > interactiveDaysLimit) {
      return; // Beyond 30 days back-fill window
    }

    onCellClick(cell.date, cell.count > 0);
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {subtitle} {onCellClick ? '• Click past days (up to 30d) to toggle' : ''}
          </p>
        </div>
      </div>

      <div className="heatmap-container" tabIndex={0} aria-label={`${title} grid view`}>
        <div className="heatmap-scroll-area">
          {/* Month labels row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${totalWeeks}, 13px)`,
              gap: '3px',
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              height: '18px',
              marginBottom: '4px',
            }}
          >
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                style={{
                  gridColumnStart: lbl.col + 1,
                  gridColumnEnd: 'span 3',
                  whiteSpace: 'nowrap',
                }}
              >
                {lbl.name}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            {/* Day of week labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 13px)',
                gap: '3px',
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                lineHeight: '13px',
                textAlign: 'right',
                paddingRight: '2px',
                userSelect: 'none',
              }}
            >
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
              <span>Sun</span>
            </div>

            {/* Heatmap 7-row CSS Grid */}
            <div className="heatmap-grid" role="grid" aria-label="Habit calendar heatmap">
              {cells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      style={{ width: '13px', height: '13px', visibility: 'hidden' }}
                    />
                  );
                }

                const diff = diffInDays(localToday, cell.date);
                const isClickable = onCellClick && diff >= -1 && diff <= interactiveDaysLimit;

                return (
                  <button
                    key={cell.date}
                    type="button"
                    className="heatmap-cell"
                    data-level={cell.level || 0}
                    style={{
                      cursor: isClickable ? 'pointer' : 'default',
                      border: cell.date === localToday ? '1px solid var(--primary)' : 'none',
                    }}
                    onClick={() => handleCellClick(cell)}
                    onMouseEnter={(e) => handleMouseEnter(cell, e)}
                    onMouseLeave={handleMouseLeave}
                    onFocus={(e) => handleMouseEnter(cell, e)}
                    onBlur={handleMouseLeave}
                    aria-label={`${cell.date}: ${cell.count} completed`}
                    role="gridcell"
                  />
                );
              })}
            </div>
          </div>

          {/* Heatmap 5-level Legend */}
          <div className="heatmap-legend" aria-hidden="true">
            <span>Less</span>
            <span className="heatmap-legend-cell" style={{ backgroundColor: 'var(--heat-0)' }}></span>
            <span className="heatmap-legend-cell" style={{ backgroundColor: 'var(--heat-1)' }}></span>
            <span className="heatmap-legend-cell" style={{ backgroundColor: 'var(--heat-2)' }}></span>
            <span className="heatmap-legend-cell" style={{ backgroundColor: 'var(--heat-3)' }}></span>
            <span className="heatmap-legend-cell" style={{ backgroundColor: 'var(--heat-4)' }}></span>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default Heatmap;
