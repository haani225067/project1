import React from 'react';

const ProgressBar = ({
  value = 0,
  max = 100,
  label = 'Today\'s Progress',
  showText = true,
}) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;

  return (
    <div className="progress-bar-wrapper">
      {showText && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{percentage}%</span>
        </div>
      )}
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
