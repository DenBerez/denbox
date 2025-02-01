'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { updateGame, updatePlayer } from '@/graphql/mutations';
import { GameStatus, GameType, Player } from '@/types/game';
import { PictureGame } from '@/lib/games/PictureGame';
import { DrawingData } from '@/lib/games/PictureGame';
import DrawingCanvas from './DrawingCanvas';
import GameHeader from './GameHeader';
import Lobby from './Lobby';
import PostRoundScreen from './PostRoundScreen';
import { playSound, Sounds } from '@/utils/soundEffects';
import { usePlayerManagement } from '@/hooks/usePlayerManagement';

interface PictureGameProps {
  game: any;
  onGameUpdate: (game: any) => void;
}

export default function PictureGameComponent({ game, onGameUpdate }: PictureGameProps) {
  const { player, players, loading } = usePlayerManagement({ gameId: game.id });
  const [timeLeft, setTimeLeft] = useState(game.timeRemaining || 60);
  const [guess, setGuess] = useState('');
  const [gameEngine, setGameEngine] = useState<PictureGame | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRoundReady, setIsRoundReady] = useState(false);

  // Define endRound before it's used in useEffect
  const endRound = useCallback(async () => {
    try {
      if (!gameEngine) return;
      await gameEngine.endRound();
      
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: GameStatus.ROUND_END,
            timeRemaining: 0,
            currentDrawing: null
          }
        }
      });

      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error ending round:', error);
    }
  }, [gameEngine, game.id, onGameUpdate]);

  useEffect(() => {
    setGameEngine(new PictureGame(game));
  }, [game]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (game.status === GameStatus.PLAYING && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            if (timer) clearInterval(timer);
            endRound();
          }
          return Math.max(newTime, 0);
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [game.status, timeLeft, endRound]);

  useEffect(() => {
    if (game.settings) {
      try {
        const parsedSettings = JSON.parse(game.settings);
        console.log('Parsed settings:', parsedSettings);
        
        if (
          game.status === GameStatus.PLAYING &&
          parsedSettings.currentWord &&
          parsedSettings.currentDrawer
        ) {
          setIsRoundReady(true);
        } else {
          setIsRoundReady(false);
        }
      } catch (error) {
        console.error('Error parsing game settings:', error);
        setIsRoundReady(false);
      }
    } else {
      setIsRoundReady(false);
    }
  }, [game.status, game.settings]);

  const handleDrawingUpdate = async (drawing: DrawingData) => {
    if (!gameEngine || !player) return;
    
    try {
      // First update the game engine
      const success = await gameEngine.updateDrawing(drawing, player.id);
      if (!success) return;

      // Then update the game state
      await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            currentDrawing: JSON.stringify(drawing),
            timeRemaining: timeLeft
          }
        }
      });
      
      setCurrentDrawing(drawing);
    } catch (error) {
      console.error('Error updating drawing:', error);
    }
  };

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !gameEngine || !player) return;

    try {
      const isCorrect = await gameEngine.validateMove({
        playerId: player.id,
        value: guess.trim(),
        timestamp: Date.now()
      });

      if (isCorrect) {
        // playSound(Sounds.SUCCESS);
        await endRound();
      } else {
        setError('Incorrect guess. Try again!');
        setGuess('');
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      setError('Failed to submit guess. Please try again.');
    }
  };

  const startRound = async () => {
    try {
      playSound(Sounds.START);
      
      if (!gameEngine) return;

      // Get current settings
      const currentSettings = game.settings ? JSON.parse(game.settings) : gameEngine.settings;
      
      // If we're in LOBBY, start at round 1, otherwise increment
      const nextRound = game.status === GameStatus.LOBBY ? 1 : game.currentRound + 1;

      // Start new round in game engine first
      await gameEngine.startNewRound();

      // Then update game state with the values from game engine
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: GameStatus.PLAYING,
            currentRound: nextRound,
            timeRemaining: currentSettings.timePerRound,
            settings: JSON.stringify({
              ...currentSettings,
              currentWord: gameEngine.currentWord,
              currentDrawer: gameEngine.currentDrawer
            })
          }
        }
      });

      // Reset local state
      setGuess('');
      setError(null);
      setCurrentDrawing(null);
      setTimeLeft(currentSettings.timePerRound);
      
      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error starting round:', error);
      setError('Failed to start round. Please try again.');
    }
  };

  const isDrawer = player?.id === (game.settings ? JSON.parse(game.settings).currentDrawer : null);

  return (
    <Container maxWidth="lg">
      <GameHeader 
        game={game} 
        showRoundInfo={game.status !== GameStatus.LOBBY} 
      />

      {game.status === GameStatus.LOBBY && player && (
        <Lobby
          game={game}
          player={player}
          players={players}
          onStartGame={startRound}
          settings={gameEngine?.settings || {}}
        />
      )}

      {game.status === GameStatus.PLAYING && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  {!isRoundReady ? (
                    'Preparing round...'
                  ) : (
                    isDrawer ? 'You are drawing:' : 'Guess the drawing!'
                  )}
                </Typography>
                <Chip
                  label={`Time: ${timeLeft}s`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              {isDrawer && isRoundReady && (
                <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                  {game.settings && JSON.parse(game.settings).currentWord}
                </Typography>
              )}
            </Paper>
          </Grid>

          {isRoundReady && (
            <>
              <Grid item xs={12}>
                <DrawingCanvas
                  isDrawer={isDrawer}
                  onDrawingUpdate={handleDrawingUpdate}
                  currentDrawing={currentDrawing}
                />
              </Grid>

              {!isDrawer && (
                <Grid item xs={12}>
                  <form onSubmit={handleGuessSubmit}>
                    <TextField
                      fullWidth
                      label="Enter your guess"
                      value={guess}
                      onChange={(e) => {
                        setGuess(e.target.value);
                        setError(null);
                      }}
                      error={!!error}
                      helperText={error}
                      disabled={!isRoundReady}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={!isRoundReady || !guess.trim()}
                    >
                      Submit Guess
                    </Button>
                  </form>
                </Grid>
              )}
            </>
          )}
        </Grid>
      )}

      {game.status === GameStatus.ROUND_END && (
        <PostRoundScreen 
          game={game}
          player={player}
          onNextRound={startRound}
          settings={gameEngine?.settings || {}}
          isLastRound={game.currentRound >= (gameEngine?.settings?.maxRounds || 5)}
        />
      )}
    </Container>
  );
} 