import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="state-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p className="state-description">{message}</p>
    </div>
  );
};

export default Loader;
