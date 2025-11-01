import React from 'react';

const ProtectedRoute = ({ children }) => {
  // Skip authentication - directly render children for internal network deployment
  return children;
};

export default ProtectedRoute;