'use client';

import { useState, useEffect } from 'react';
import { Container, CircularProgress, Box } from '@mui/material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { getGame } from '@/graphql/queries';
import { updateGame } from '@/graphql/mutations';
import { onUpdateGame } from '@/graphql/subscriptions';
import GameTypeSelector from '@/app/components/GameTypeSelector';
import LetterGameComponent from '@/app/components/LetterGame';
import { Game, GameStatus } from '@/types/game';
import { use } from 'react';
import { graphqlWithRetry } from '@/utils/apiClient';

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Fetch game data
  const fetchGame = async () => {
    try {
      const result = await graphqlWithRetry(getGame, { id });
      setGame(result.data.getGame);
    } catch (error) {
      console.error('Error fetching game:', error);
    }
  };

  // Poll for game updates instead of using subscriptions
  useEffect(() => {
    fetchGame();
    
    // Poll every 3 seconds
    const pollInterval = setInterval(() => {
      fetchGame();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [id]);

  // Store player ID in localStorage
  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`player_${id}`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
  }, [id]);

  const handleGameTypeSelect = async (gameType: any) => {
    try {
      // Get the default settings from the gameType object
      const settings = gameType.defaultSettings;
      
      if (!settings) {
        console.error('Default settings not found for game type:', gameType);
        return;
      }

      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id,
            gameType: gameType.id,
            maxRounds: settings.maxRounds,
            status: GameStatus.LOBBY,
            settings: JSON.stringify(settings),
            timeRemaining: settings.timePerRound
          }
        }
      });
      setGame(result.data.updateGame);
    } catch (error) {
      console.error('Error updating game type:', error);
    }
  };

  if (!game) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!game.gameType ? (
        <GameTypeSelector onSelectGameType={handleGameTypeSelect} />
      ) : (
        <LetterGameComponent 
          game={game} 
          onGameUpdate={(updatedGame) => setGame(updatedGame)} 
        />
      )}
    </Container>
  );
}