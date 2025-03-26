import { useState, useEffect, useCallback } from 'react';
import { ConnectionStateManager } from '@/utils/connectionStateManager';
import { WebSocketMessage, WebSocketMessageType } from '@/services/WebSocketService';

interface UseWebSocketOptions {
  gameId: string;
  playerId?: string;
  onStateRecovery?: (data: any) => void;
  onGameUpdate?: (data: any) => void;
  onPlayerUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useWebSocket({
  gameId,
  playerId,
  onStateRecovery,
  onGameUpdate,
  onPlayerUpdate,
  onError
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const wsManager = ConnectionStateManager.getInstance();

  const sendMessage = useCallback(async (message: WebSocketMessage) => {
    try {
      const connection = await wsManager.getOrCreateConnection(gameId, playerId);
      return await connection.send(message);
    } catch (error) {
      setError(error as Error);
      onError?.(error as Error);
      return false;
    }
  }, [gameId, playerId]);

  const connect = useCallback(async () => {
    try {
      const connection = await wsManager.getOrCreateConnection(gameId, playerId);
      setIsConnected(true);
      setError(null);
      return connection;
    } catch (error) {
      if ((error as Error).message.includes('auth')) {
        setError('Authentication failed. Please refresh the page.');
      } else {
        setError('Failed to connect to game server');
      }
      onError?.(error as Error);
      return null;
    }
  }, [gameId, playerId]);

  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      try {
        const connection = await wsManager.getOrCreateConnection(gameId, playerId);
        if (!mounted) return;

        setIsConnected(true);
        setError(null);

        // Set up event handlers
        if (onStateRecovery) {
          wsManager.addEventListener(gameId, 'STATE_RECOVERY', onStateRecovery);
        }
        if (onGameUpdate) {
          wsManager.addEventListener(gameId, 'GAME_UPDATE', onGameUpdate);
        }
        if (onPlayerUpdate) {
          wsManager.addEventListener(gameId, 'PLAYER_UPDATE', onPlayerUpdate);
        }
      } catch (error) {
        if (!mounted) return;
        setError(error as Error);
        onError?.(error as Error);
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      if (onStateRecovery) {
        wsManager.removeEventListener(gameId, 'STATE_RECOVERY', onStateRecovery);
      }
      if (onGameUpdate) {
        wsManager.removeEventListener(gameId, 'GAME_UPDATE', onGameUpdate);
      }
      if (onPlayerUpdate) {
        wsManager.removeEventListener(gameId, 'PLAYER_UPDATE', onPlayerUpdate);
      }
    };
  }, [gameId, playerId]);

  return {
    isConnected,
    error,
    sendMessage
  };
} 