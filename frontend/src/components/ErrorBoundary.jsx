/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */

import React from 'react';
import { HiExclamationCircle, HiRefresh, HiHome } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if monitoring should be enabled
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example mock for calling an external telemetry endpoint
        fetch('/api/logs/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.toString(), info: errorInfo.componentStack })
        }).catch(err => console.error('Failed to log error to service', err));
      } catch (e) {
        // Ignore telemetry failure
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiExclamationCircle className="w-12 h-12 text-red-500" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-secondary-900 mb-3">
              Something went wrong
            </h1>
            <p className="text-secondary-600 mb-8">
              We're sorry, but something unexpected happened. 
              Please try refreshing the page or go back to the home page.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn btn-primary inline-flex items-center justify-center gap-2"
              >
                <HiRefresh className="w-5 h-5" />
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary inline-flex items-center justify-center gap-2"
              >
                <HiHome className="w-5 h-5" />
                Go to Home
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left">
                <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <summary className="text-red-800 font-medium cursor-pointer">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-4 text-xs text-red-700 overflow-auto max-h-48">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;