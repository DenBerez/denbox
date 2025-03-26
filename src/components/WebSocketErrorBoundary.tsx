import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ConnectionStateManager } from '@/utils/connectionStateManager';

interface Props {
  children: ReactNode;
  gameId: string;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebSocket error:', error, errorInfo);
    
    // Check if it's an auth error
    if (error.message.includes('auth')) {
      this.setState({
        hasError: true,
        error: new Error('Authentication failed. Please refresh the page.')
      });
    } else {
      this.setState({ hasError: true, error });
    }
    
    this.props.onError?.(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="websocket-error">
          <h2>Connection Error</h2>
          <p>Failed to connect to game server. Please try refreshing the page.</p>
          <button
            onClick={() => {
              // Attempt to reconnect
              const wsManager = ConnectionStateManager.getInstance();
              wsManager.removeConnection(this.props.gameId);
              this.setState({ hasError: false, error: null });
            }}
          >
            Retry Connection
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 