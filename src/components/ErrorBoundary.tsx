import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    if (import.meta.env.DEV) {
      logger.error('ErrorBoundary caught an error', { error, errorInfo });
    }

    if (import.meta.env.PROD) {
      // In production, you could send to error tracking service
      // Example: sendToErrorService({ error, errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <div className="max-w-2xl w-full bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
              <h1 className="text-3xl font-bold text-slate-100">
                Something went wrong
              </h1>
            </div>

            <p className="text-slate-300 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
              You can try refreshing the page or returning to the home page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-sm font-mono text-red-400 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-slate-400 overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600"
              >
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

