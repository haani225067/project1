import React from 'react';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading your data. Please try again.',
  onRetry,
}) => {
  return (
    <div className="state-container card" role="alert">
      <div className="state-icon" aria-hidden="true">⚠️</div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
