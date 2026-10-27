import React from 'react';

const EmptyState = ({
  icon = '🌱',
  title = 'No habits yet',
  description = 'Start building consistency today by creating your first daily habit.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="state-container card">
      <div className="state-icon" aria-hidden="true">{icon}</div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
