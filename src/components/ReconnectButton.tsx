import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { ConnectionStateManager } from '@/utils/connectionStateManager';

interface ReconnectButtonProps {
  gameId: string;
  playerId?: string;
  onReconnect?: () => void;
}

export function ReconnectButton({ gameId, playerId, onReconnect }: ReconnectButtonProps) {
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const wsManager = ConnectionStateManager.getInstance();
      wsManager.removeConnection(gameId, playerId);
      await wsManager.getOrCreateConnection(gameId, playerId);
      onReconnect?.();
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleReconnect}
      disabled={isReconnecting}
      startIcon={isReconnecting ? <CircularProgress size={20} /> : null}
    >
      {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
    </Button>
  );
} 