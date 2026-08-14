import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiHome, HiArrowLeft, HiSearch } from 'react-icons/hi';

const NotFound = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/projects?search=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface-lowest flex items-center justify-center px-4 fade-in">
      <div className="text-center w-full max-w-lg">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.35)] group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
        </Link>

        {/* 404 Illustration */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-bold text-outline leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-6xl">🔍</span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-outline max-w-md mx-auto mb-8">
            Oops! The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="w-5 h-5 text-outline" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for projects…"
              className="input pl-10 pr-16 w-full"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-medium text-primary hover:text-primary-dim"
            >
              Search
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn btn-primary btn-lg inline-flex items-center justify-center"
            >
              <HiHome className="w-5 h-5 mr-2" />
              Go to Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary btn-lg inline-flex items-center justify-center"
            >
              <HiArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-surface-variant">
          <p className="text-outline mb-4">Or check out these pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/projects"
              className="text-primary hover:text-primary-dim text-glow font-medium transition-colors"
            >
              Browse Projects
            </Link>
            <span className="text-outline">•</span>
            <Link
              to="/support"
              className="text-primary hover:text-primary-dim text-glow font-medium transition-colors"
            >
              Contact Support
            </Link>
            <span className="text-outline">•</span>
            <Link
              to="/login"
              className="text-primary hover:text-primary-dim text-glow font-medium transition-colors"
            >
              Login
            </Link>
            <span className="text-outline">•</span>
            <Link
              to="/signup"
              className="text-primary hover:text-primary-dim text-glow font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
