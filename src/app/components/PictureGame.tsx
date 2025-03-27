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
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { updateGame, updatePlayer } from '@/graphql/mutations';
import { getGame } from '@/graphql/queries';
import { GameStatus, GameType, Player } from '@/types/game';
import { PictureGame, PlayerDrawing } from '@/lib/games/PictureGame';
import { DrawingData } from '@/lib/games/PictureGame';
import DrawingCanvas from './DrawingCanvas';
import GameHeader from './GameHeader';
import Lobby from './Lobby';
import PostRoundScreen from './PostRoundScreen';
import { playSound, Sounds } from '@/utils/soundEffects';
import { usePlayerManagement } from '@/hooks/usePlayerManagement';
import GameSettingsDialog from './GameSettingsDialog';
import { pictureGameDefaults } from '@/constants/gameSettings';
import { useGameState } from '@/providers/GameStateProvider';

interface PictureGameProps {
  game: any;
  onGameUpdate: (game: any) => void;
}

export default function PictureGameComponent({ game, onGameUpdate }: PictureGameProps) {
  const { player, players, loading } = usePlayerManagement({ gameId: game.id });
  const { isConnected, game: gameState, updateGame: updateGameState } = useGameState();
  const [timeLeft, setTimeLeft] = useState(game.timeRemaining || 60);
  const [guess, setGuess] = useState('');
  const [gameEngine, setGameEngine] = useState<PictureGame | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'PROMPT' | 'DRAW' | 'GUESS' | 'REVEAL'>('DRAW');
  const [prompt, setPrompt] = useState('');
  const [drawings, setDrawings] = useState<Map<string, PlayerDrawing>>(new Map());
  const [currentDrawingIndex, setCurrentDrawingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const mountedRef = useRef(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectingRef = useRef(false);

  // Define moveToNextDrawing before using it in useEffect
  const moveToNextDrawing = useCallback(async () => {
    const drawingsArray = Array.from(drawings.values());
    if (currentDrawingIndex < drawingsArray.length - 1) {
      setCurrentDrawingIndex(prev => prev + 1);
      setTimeLeft(gameEngine?.settings.guessTime || 30);
    } else {
      // Move to reveal phase
      setCurrentPhase('REVEAL');
      await gameEngine?.updateGameState({
        settings: JSON.stringify({
          ...JSON.parse(game.settings),
          phase: 'REVEAL'
        })
      });
    }
  }, [currentDrawingIndex, drawings, gameEngine, game.settings]);

  useEffect(() => {
    setGameEngine(new PictureGame(game));
  }, [game]);

  useEffect(() => {
    if (game.settings) {
      const settings = JSON.parse(game.settings);
      setCurrentPhase(settings.phase || 'DRAW');
      if (settings.drawings) {
        const drawingsMap = new Map(
          settings.drawings.map((d: PlayerDrawing) => [d.playerId, d])
        );
        setDrawings(drawingsMap);
      }
    }
  }, [game.settings]);

  // Listen for game updates from gameState
  useEffect(() => {
    if (gameState && gameState.settings) {
      try {
        const settings = JSON.parse(gameState.settings);
        if (settings.phase && settings.phase !== currentPhase) {
          setCurrentPhase(settings.phase);
        }
        if (settings.drawings) {
          setDrawings(new Map(settings.drawings.map((d: PlayerDrawing) => [d.playerId, d])));
        }
      } catch (error) {
        console.error('Error parsing game settings:', error);
      }
    }
  }, [gameState, currentPhase]);

  // Timer effect
  useEffect(() => {
    if (game.status !== GameStatus.PLAYING) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (currentPhase === 'DRAW') {
            handleDrawingComplete();
          } else if (currentPhase === 'GUESS') {
            moveToNextDrawing();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game.status, currentPhase, moveToNextDrawing]);

  const handleDrawingComplete = async () => {
    if (!player || !gameEngine) return;

    try {
      // Get current drawings from settings
      const currentSettings = JSON.parse(game.settings || '{}');
      const currentDrawings = currentSettings.drawings || [];
      
      // Find player's drawing
      const playerDrawing = currentDrawings.find((d: PlayerDrawing) => d.playerId === player.id);
      
      if (playerDrawing) {
        // Update game settings to move to GUESS phase
        await updateGameState({
          settings: JSON.stringify({
            ...currentSettings,
            phase: 'GUESS'
          })
        });
        
        setCurrentPhase('GUESS');
        setTimeLeft(gameEngine.settings.guessTime || 30);
      }
    } catch (error) {
      console.error('Error completing drawing:', error);
      setError('Failed to complete drawing');
    }
  };

  const handleGuessSubmit = async () => {
    if (!player || !gameEngine || !guess.trim()) return;

    try {
      const drawingsArray = Array.from(drawings.values());
      const currentDrawing = drawingsArray[currentDrawingIndex];
      
      if (!currentDrawing) return;
      
      // Don't allow guessing your own drawing
      if (currentDrawing.playerId === player.id) {
        setError("You can't guess your own drawing!");
        return;
      }
      
      // Get current settings
      const currentSettings = JSON.parse(game.settings || '{}');
      const currentDrawings = currentSettings.drawings || [];
      
      // Find and update the current drawing with the new guess
      const updatedDrawings = currentDrawings.map((d: PlayerDrawing) => {
        if (d.playerId === currentDrawing.playerId) {
          // Check if player already guessed
          const existingGuessIndex = d.guesses.findIndex(g => g.playerId === player.id);
          
          if (existingGuessIndex >= 0) {
            // Update existing guess
            d.guesses[existingGuessIndex].guess = guess;
          } else {
            // Add new guess
            d.guesses.push({
              playerId: player.id,
              guess
            });
          }
        }
        return d;
      });
      
      // Update game settings with new guesses
      await updateGameState({
        settings: JSON.stringify({
          ...currentSettings,
          drawings: updatedDrawings
        })
      });
      
      // Clear guess input
      setGuess('');
      
      // Play sound effect
      playSound(Sounds.SUCCESS);
    } catch (error) {
      console.error('Error submitting guess:', error);
      setError('Failed to submit guess');
    }
  };

  const renderPhase = () => {
    switch (currentPhase) {
      case 'DRAW':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              Draw: {prompt || 'Loading prompt...'}
            </Typography>
            <DrawingCanvas
              isDrawer={true}
              onDrawingUpdate={(drawingData) => {
                if (!player) return;
                
                // Debounce drawing updates
                if (debounceTimeoutRef.current) {
                  clearTimeout(debounceTimeoutRef.current);
                }
                
                debounceTimeoutRef.current = setTimeout(() => {
                  submitDrawing({
                    playerId: player.id,
                    drawing: drawingData,
                    prompt: prompt,
                    guesses: []
                  });
                }, 300);
              }}
            />
          </Box>
        );
      
      case 'GUESS':
        const drawingsArray = Array.from(drawings.values());
        const currentDrawing = drawingsArray[currentDrawingIndex];
        
        if (!currentDrawing) {
          return <Typography>No drawings available</Typography>;
        }
        
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              Guess the drawing! ({currentDrawingIndex + 1}/{drawingsArray.length})
            </Typography>
            <Typography variant="subtitle1">
              Artist: {players.find(p => p.id === currentDrawing.playerId)?.name}
            </Typography>
            
            <DrawingCanvas
              isDrawer={false}
              currentDrawing={currentDrawing.drawing}
            />
            
            {player && currentDrawing.playerId !== player.id && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Your guess"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleGuessSubmit();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleGuessSubmit}
                  disabled={!guess.trim()}
                >
                  Submit
                </Button>
              </Box>
            )}
          </Box>
        );
      
      case 'REVEAL':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              Round Results
            </Typography>
            {Array.from(drawings.values()).map((drawing, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">
                  Word: {drawing.prompt}
                </Typography>
                <Typography variant="subtitle1">
                  Drawn by: {players.find(p => p.id === drawing.playerId)?.name}
                </Typography>
                <DrawingCanvas
                  isDrawer={false}
                  currentDrawing={drawing.drawing}
                />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Guesses:
                </Typography>
                {drawing.guesses.map((guess, i) => (
                  <Typography key={i}>
                    {players.find(p => p.id === guess.playerId)?.name}: {guess.guess}
                  </Typography>
                ))}
              </Paper>
            ))}
            {player?.isHost && (
              <Button
                variant="contained"
                onClick={() => gameEngine?.startNewRound()}
                sx={{ mt: 2 }}
              >
                Next Round
              </Button>
            )}
          </Box>
        );
    }
  };

  // Update drawing submission to use GraphQL mutation
  const submitDrawing = async (drawingData: PlayerDrawing) => {
    if (!player) return;

    try {
      // Get current settings
      const currentSettings = JSON.parse(game.settings || '{}');
      const currentDrawings = currentSettings.drawings || [];
      
      // Find player's drawing in the array or add a new one
      let updatedDrawings = [...currentDrawings];
      const existingIndex = updatedDrawings.findIndex(d => d.playerId === player.id);
      
      if (existingIndex >= 0) {
        updatedDrawings[existingIndex] = drawingData;
      } else {
        updatedDrawings.push(drawingData);
      }
      
      // Update game settings with the new drawing
      await updateGameState({
        settings: JSON.stringify({
          ...currentSettings,
          drawings: updatedDrawings
        })
      });
    } catch (error) {
      console.error('Error sending drawing update:', error);
      setError('Failed to send drawing');
    }
  };

  return (
    <Box>
      <GameHeader game={game} />
      <Box sx={{ mb: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={(timeLeft / (gameEngine?.settings.timePerRound || 60)) * 100} 
        />
        <Typography variant="body2" align="center">
          Time remaining: {timeLeft}s
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {renderPhase()}
    </Box>
  );
} 