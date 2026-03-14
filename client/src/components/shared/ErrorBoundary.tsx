import React, { Component, type ErrorInfo, type ReactNode, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Props { children: ReactNode; resetKey?: string; }
interface State { hasError: boolean; error?: Error; }

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset when resetKey changes (e.g. route change)
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive opacity-80" />
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left text-xs bg-muted rounded p-3">
                <summary className="cursor-pointer font-medium mb-1">Error details</summary>
                <pre className="whitespace-pre-wrap break-words">{this.state.error.message}</pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => this.setState({ hasError: false, error: undefined })}>Try Again</Button>
              <Button variant="outline" onClick={() => { window.location.href = '/'; }}>Go Home</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Route-aware wrapper — auto-resets the error boundary on navigation */
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundaryClass resetKey={location.pathname}>
      {children}
    </ErrorBoundaryClass>
  );
}

/** Standalone version for wrapping the router itself */
export function RootErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}
