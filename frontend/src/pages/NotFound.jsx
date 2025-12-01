import { Link } from 'react-router-dom';
import { HiHome, HiArrowLeft } from 'react-icons/hi';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4 fade-in">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-bold text-secondary-200 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-6xl">🔍</span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-secondary-600 max-w-md mx-auto mb-8">
            Oops! The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

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
        <div className="mt-12 pt-8 border-t border-secondary-200">
          <p className="text-secondary-500 mb-4">Or check out these pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/projects"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Browse Projects
            </Link>
            <span className="text-secondary-300">•</span>
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Login
            </Link>
            <span className="text-secondary-300">•</span>
            <Link
              to="/signup"
              className="text-primary-600 hover:text-primary-700 font-medium"
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