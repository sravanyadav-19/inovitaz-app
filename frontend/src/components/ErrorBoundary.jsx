/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI.
 */

import React from 'react';
import { HiExclamationCircle, HiRefresh, HiHome } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Vite exposes environment variables through import.meta.env, not process.env.
    if (import.meta.env.PROD) {
      fetch('/api/logs/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.toString(), info: errorInfo.componentStack }),
      }).catch((telemetryError) => {
        console.error('Failed to log error to service', telemetryError);
      });
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
        <main className="min-h-screen bg-surface-lowest flex items-center justify-center px-4" role="alert">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-500/15 border border-red-500/25 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiExclamationCircle className="w-12 h-12 text-red-400" aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-outline mb-8">
              We’re sorry, but something unexpected happened. Please refresh the page or return home.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary inline-flex items-center justify-center gap-2"
              >
                <HiRefresh className="w-5 h-5" aria-hidden="true" />
                Refresh page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-secondary inline-flex items-center justify-center gap-2"
              >
                <HiHome className="w-5 h-5" aria-hidden="true" />
                Go to home
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left bg-surface-low border border-red-500/30 rounded-lg p-4">
                <summary className="text-red-300 font-medium cursor-pointer">Error details for development</summary>
                <pre className="mt-4 text-xs text-red-200 overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
