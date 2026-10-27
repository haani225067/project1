import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="state-container" style={{ minHeight: '60vh' }}>
      <span style={{ fontSize: '4rem', lineHeight: 1 }} aria-hidden="true">🔍</span>
      <h1 className="state-title" style={{ fontSize: '1.75rem' }}>
        404 - Page Not Found
      </h1>
      <p className="state-description">
        The page you are looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
