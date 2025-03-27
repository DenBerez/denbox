'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { getGame } from '@/graphql/queries';
import { Game, GameStatus } from '@/types/game';
import LetterGameComponent from '@/app/components/LetterGame';
import { GameStateProvider } from '@/providers/GameStateProvider';
import DebugInfo from '@/app/components/DebugInfo';
import Lobby from '@/app/components/Lobby';
import PictureGameComponent from '@/app/components/PictureGame';

export default function GamePage({ params }: { params: { id: string } }) {
  // Unwrap params with React.use()
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const result = await client.graphql({
          query: getGame,
          variables: { id: gameId }
        });

        console.log('Fetched game:', result.data.getGame);
        setGame(result.data.getGame);
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading game...
        </Typography>
      </Box>
    );
  }

  if (error || !game) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          {error || 'Game not found'}
        </Typography>
      </Box>
    );
  }

  console.log('Rendering game with status:', game.status);

  return (
    <GameStateProvider gameId={gameId}>
      {/* <DebugInfo /> */}
      {game.status === 'LOBBY' ? (
        <Box sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80%',
          maxWidth: '1200px',
          mx: 'auto',
        }}>
          <Lobby
            game={game}
            onStartGame={() => {
              console.log('Starting game');
            }}
          />
        </Box>
      ) : (
        game.gameType === 'LETTER_RACE' ? (
          <LetterGameComponent game={game} />
        ) : (
          <PictureGameComponent game={game} onGameUpdate={() => { }} />
        )
      )}
    </GameStateProvider>
  );
}