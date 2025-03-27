import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { ReconnectButton } from '@/components/ReconnectButton';
import { paperStyles } from '@/constants/styles';

interface Props {
  children: ReactNode;
  gameId: string;
  playerId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('WebSocket error caught by boundary:', error, errorInfo);
  }

  handleReconnect = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, gameId, playerId } = this.props;

    if (hasError) {
      return (
        <Paper sx={{ ...paperStyles.standard, p: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Connection Error
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {error?.message || 'Failed to connect to the game server.'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <ReconnectButton 
                gameId={gameId} 
                playerId={playerId} 
                onReconnect={this.handleReconnect} 
              />
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
          </Box>
        </Paper>
      );
    }

    return children;
  }
} 