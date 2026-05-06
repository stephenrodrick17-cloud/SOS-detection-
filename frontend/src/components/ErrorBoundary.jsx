import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
          <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-rose-500/10 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white">Oops! Something went wrong</h1>
            <p className="text-slate-400 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
                  Technical Details
                </summary>
                <pre className="mt-2 p-2 bg-slate-950 rounded text-xs overflow-auto max-h-48 text-slate-400">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-4 mt-6">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-lg transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
