import { Component } from 'react';
import { RiErrorWarningLine, RiRefreshLine } from 'react-icons/ri';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-surface">
          <div className="card max-w-md w-full text-center py-10">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
              <RiErrorWarningLine className="text-3xl" />
            </div>
            <h1 className="text-xl font-bold text-txt-primary mb-2">Something went wrong</h1>
            <p className="text-sm text-txt-secondary mb-8">
              An unexpected error occurred in the application.
            </p>
            <button
              onClick={() => window.location.replace('/')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RiRefreshLine /> Refresh Application
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left p-4 bg-bg-elevated rounded-lg overflow-auto text-xs text-rose-400 font-mono">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
