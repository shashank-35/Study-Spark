/**
 * components/ErrorBoundary.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * React Error Boundary that catches render errors and displays a recoverable
 * fallback UI instead of a blank screen.
 */

import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback renderer */
  fallback?: (props: { error: Error; reset: () => void }) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<
  ErrorBoundaryProps & { onReset?: () => void },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback({ error, reset: this.handleReset });
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <svg
              className="h-7 w-7 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-xs text-left text-muted-foreground bg-muted p-3 rounded-lg max-w-lg overflow-auto max-h-48">
              {error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorBoundary integrated with React Query's reset mechanism.
 * Wrapping sections in this will:
 *  1. Catch render crashes
 *  2. Show a recoverable error UI
 *  3. Reset React Query failed queries on "Try Again"
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundaryInner onReset={reset} fallback={fallback}>
          {children}
        </ErrorBoundaryInner>
      )}
    </QueryErrorResetBoundary>
  );
}

export default ErrorBoundary;
