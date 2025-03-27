import { useState, useEffect, useRef } from 'react';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { playersByGameId } from '@/graphql/queries';
import { createPlayer } from '@/graphql/mutations';
import { onCreatePlayerByGameId, onUpdatePlayerByGameId } from '@/graphql/subscriptions';
import { Player } from '@/types/game';
import config from '../aws-exports';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGameState } from '@/providers/GameStateProvider';

interface UsePlayerManagementProps {
  gameId: string;
}

export function usePlayerManagement({ gameId }: UsePlayerManagementProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isConnected, currentPlayer, players: globalPlayers } = useGameState();

  useEffect(() => {
    if (currentPlayer) {
      setPlayer(currentPlayer);
      setLoading(false);
    }
  }, [currentPlayer]);

  useEffect(() => {
    if (globalPlayers && globalPlayers.length > 0) {
      setPlayers(globalPlayers);
    }
  }, [globalPlayers]);

  return {
    player,
    players,
    loading: loading || !currentPlayer,
    error,
    isConnected
  };
}

// Example of how player creation might be fixed
export async function createNewPlayer(gameId, playerName) {
  try {
    const response = await client.graphql({
      query: createPlayer,
      variables: {
        input: {
          gameId,
          name: playerName,
          score: 0,
          isHost: false,
          isConfirmed: true,
          currentWords: []
        }
      }
    });
    
    // Store player ID in session storage instead of localStorage
    // This makes it available in the current window only
    sessionStorage.setItem('currentPlayerId', response.data.createPlayer.id);
    
    return response.data.createPlayer;
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
}