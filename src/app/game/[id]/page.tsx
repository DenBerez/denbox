'use client';

import { useState, useEffect } from 'react';
import { Container, CircularProgress, Box } from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { getGame } from '@/graphql/queries';
import { updateGame } from '@/graphql/mutations';
import { onUpdateGame } from '@/graphql/subscriptions';
import GameTypeSelector from '@/app/components/GameTypeSelector';
import LetterGameComponent from '@/app/components/LetterGame';
import { GameStatus } from '@/types/game';
import { use } from 'react';

const client = generateClient();

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise using React.use()
  const { id } = use(params);
  
  const [game, setGame] = useState<any>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGame();
    const unsubscribe = subscribeToGameUpdates();
    
    const storedPlayerId = localStorage.getItem(`player_${id}`);
    if (storedPlayerId) setPlayerId(storedPlayerId);

    return () => {
      unsubscribe();
    };
  }, [id]);

  const fetchGame = async () => {
    try {
      const result = await client.graphql({
        query: getGame,
        variables: { id }
      });
      setGame(result.data.getGame);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching game:', error);
      setLoading(false);
    }
  };

  const subscribeToGameUpdates = () => {
    const subscription = client.graphql({
      query: onUpdateGame,
      variables: { filter: { id: { eq: id } } }
    }).subscribe({
      next: ({ data }) => {
        if (data?.onUpdateGame) {
          setGame(data.onUpdateGame);
        }
      },
      error: (error) => console.error('Subscription error:', error),
    });

    return () => subscription.unsubscribe();
  };

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!game.gameType ? (
        <GameTypeSelector onSelectGameType={handleGameTypeSelect} />
      ) : (
        <LetterGameComponent 
          game={game} 
          onGameUpdate={setGame} 
        />
      )}
    </Container>
  );
}