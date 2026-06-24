import React from 'react';
import { useLocation } from 'react-router-dom';

export default function StaticPage() {
  const location = useLocation();
  const path = location.pathname.replace('/', '');
  const title = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');

  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-6 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 text-lg">
          This is a placeholder for the {title} page. It will be fully populated in a future update.
        </p>
        <div className="pt-8 text-sm text-gray-400">
          FinEd Platform • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
