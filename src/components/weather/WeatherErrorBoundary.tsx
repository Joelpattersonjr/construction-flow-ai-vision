import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class WeatherErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ 
      error, 
      errorInfo 
    });

    // Log error to console
    console.error('Weather component error:', error, errorInfo);

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="p-6 border-destructive/20 bg-destructive/5">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-destructive">
                Weather Component Error
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Something went wrong while loading the weather data. This might be a 
                temporary issue with the weather service or a network problem.
              </p>
            </div>

            {this.state.error && (
              <details className="w-full max-w-md">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Bug className="h-3 w-3" />
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-muted/50 rounded border text-xs font-mono text-left overflow-auto max-h-32">
                  <div className="font-semibold text-destructive mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-muted-foreground">
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support or try refreshing the page.
            </p>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
interface WeatherErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

export const WeatherErrorBoundaryWrapper: React.FC<WeatherErrorBoundaryWrapperProps> = ({
  children,
  fallback,
  onRetry
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // You could integrate with error reporting services here
    // e.g., Sentry, LogRocket, etc.
    console.error('Weather Error:', { error, errorInfo });
  };

  return (
    <WeatherErrorBoundary
      fallback={fallback}
      onError={handleError}
    >
      {children}
    </WeatherErrorBoundary>
  );
};