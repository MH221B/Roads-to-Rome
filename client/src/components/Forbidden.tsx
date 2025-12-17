import React from 'react';
import { Link } from 'react-router-dom';

const Forbidden: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-semibold">403 - Forbidden</h1>
      <p className="text-gray-600">You don’t have permission to access this page.</p>
      <div className="flex gap-3">
        <Link className="text-blue-600 underline" to="/">Go Home</Link>
        <Link className="text-blue-600 underline" to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Forbidden;
export { Forbidden };
