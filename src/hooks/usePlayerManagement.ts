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
    setPlayers(globalPlayers);
  }, [globalPlayers]);

  return {
    player,
    players,
    loading,
    error,
    isConnected
  };
}

const createNewPlayer = async (gameId: string, existingPlayers: Player[]) => {
  const isHost = existingPlayers.length === 0;
  const playerName = `Player ${Math.floor(Math.random() * 1000)}`;
  
  try {
    const result = await client.graphql({
      query: createPlayer,
      variables: {
        input: {
          gameId,
          name: playerName,
          score: 0,
          isHost,
          isConfirmed: false,
          currentWords: [],
          gamePlayersId: gameId
        }
      }
    });
    const newPlayer = result.data.createPlayer;

    return newPlayer;
  } catch (error) {
    console.error('Error in createNewPlayer:', error);
    throw error;
  }
}; 