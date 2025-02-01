import { useState, useEffect, useRef } from 'react';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { playersByGameId } from '@/graphql/queries';
import { createPlayer } from '@/graphql/mutations';
import { Player } from '@/types/game';

interface UsePlayerManagementProps {
  gameId: string;
}

export function usePlayerManagement({ gameId }: UsePlayerManagementProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerCreationInProgress = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const playerManager = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        setError(null);

        // 1. Get all current players
        const existingPlayersResult = await client.graphql({
          query: playersByGameId,
          variables: { gameId }
        });
        
        if (!isMounted) return;
        
        const existingPlayers = existingPlayersResult.data?.playersByGameId.items || [];
        setPlayers(existingPlayers);

        // 2. Check for stored player ID
        const storedPlayerId = localStorage.getItem(`player_${gameId}`);
        const existingPlayer = existingPlayers.find(p => p.id === storedPlayerId);

        if (existingPlayer) {
          setPlayer(existingPlayer);
          return;
        }

        // 3. Create new player if none exists and no creation is in progress
        if (!existingPlayer && !playerCreationInProgress.current) {
          playerCreationInProgress.current = true;
          
          const isHost = existingPlayers.length === 0;
          const playerName = `Player ${Math.floor(Math.random() * 1000)}`;
          
          const newPlayer = await client.graphql({
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

          if (isMounted && newPlayer.data?.createPlayer) {
            localStorage.setItem(`player_${gameId}`, newPlayer.data.createPlayer.id);
            setPlayer(newPlayer.data.createPlayer);
          }
        }
      } catch (error) {
        console.error('Error in player management:', error);
        if (isMounted) {
          setError('Failed to initialize player');
        }
      } finally {
        playerCreationInProgress.current = false;
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    playerManager();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  return {
    player,
    players,
    loading,
    error,
    setPlayer,
    setPlayers
  };
} 