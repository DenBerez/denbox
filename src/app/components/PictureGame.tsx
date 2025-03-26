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
import { WebSocketService } from '@/services/WebSocketService';
import { pictureGameDefaults } from '@/constants/gameSettings';

interface PictureGameProps {
  game: any;
  onGameUpdate: (game: any) => void;
}

export default function PictureGameComponent({ game, onGameUpdate }: PictureGameProps) {
  const { player, players, loading } = usePlayerManagement({ gameId: game.id });
  const [timeLeft, setTimeLeft] = useState(game.timeRemaining || 60);
  const [guess, setGuess] = useState('');
  const [gameEngine, setGameEngine] = useState<PictureGame | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'PROMPT' | 'DRAW' | 'GUESS' | 'REVEAL'>('DRAW');
  const [prompt, setPrompt] = useState('');
  const [drawings, setDrawings] = useState<Map<string, PlayerDrawing>>(new Map());
  const [currentDrawingIndex, setCurrentDrawingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const wsRef = useRef<WebSocketService | null>(null);
  const mountedRef = useRef(true);

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0 && game.status === GameStatus.PLAYING) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (currentPhase === 'DRAW') {
              setCurrentPhase('GUESS');
              return gameEngine?.settings.guessTime || 30;
            } else if (currentPhase === 'GUESS') {
              moveToNextDrawing();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, game.status, currentPhase, moveToNextDrawing, gameEngine?.settings.guessTime]);

  useEffect(() => {
    mountedRef.current = true;
    let wsInstance: WebSocketService | null = null;

    const initializeWebSocket = async () => {
      if (!game.id || !player?.id) return;
      
      try {
        wsInstance = new WebSocketService(game.id, player.id);
        wsRef.current = wsInstance;
        
        await wsInstance.connect();
        
        if (!mountedRef.current) {
          wsInstance.disconnect();
          return;
        }

        // Handle state recovery
        wsInstance.on('STATE_RECOVERY', (data) => {
          if (!mountedRef.current) return;
          if (data.currentDrawing) {
            setDrawings(new Map(Object.entries(data.currentDrawing)));
          }
          onGameUpdate(data);
        });
        
        wsInstance.on('DRAWING_UPDATE', (data) => {
          if (!mountedRef.current) return;
          const { playerId, drawing } = data;
          setDrawings(prev => {
            const newDrawings = new Map(prev);
            newDrawings.set(playerId, drawing);
            return newDrawings;
          });
        });
        
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        if (mountedRef.current) {
          setError('Failed to connect to game server. Please try refreshing the page.');
        }
      }
    };

    if (player?.id) {
      initializeWebSocket();
    }

    return () => {
      mountedRef.current = false;
      if (wsInstance) {
        wsInstance.disconnect();
        wsRef.current = null;
      }
    };
  }, [game.id, player?.id, onGameUpdate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show lobby if game status is LOBBY
  if (game.status === GameStatus.LOBBY) {
    return (
      <Box>
        <GameHeader game={game} />
        <Lobby
          game={game}
          player={player}
          players={players}
          onStartGame={async () => {
            try {
              if (!gameEngine) return;
              
              // Initialize drawings for each player before starting the round
              const initialDrawings = new Map();
              players.forEach(p => {
                initialDrawings.set(p.id, {
                  playerId: p.id,
                  drawing: null,
                  prompt: gameEngine.getRandomPrompt(), // This should be implemented in PictureGame class
                  guesses: []
                });
              });
              
              // Update local state
              setDrawings(initialDrawings);

              console.log('Initial drawings:', initialDrawings);
              console.log('Game settings:', game.settings);
              console.log('Game engine:', gameEngine);
              console.log('Current phase:', currentPhase);
              console.log('Drawings:', drawings);
              console.log('Current drawing index:', currentDrawingIndex);

              
              // Update game settings with initial drawings and phase
              await gameEngine.updateGameState({
                settings: JSON.stringify({
                  ...JSON.parse(game.settings || '{}'),
                  phase: 'DRAW',
                  drawings: Array.from(initialDrawings.values()),
                  status: GameStatus.PLAYING
                })
              });
              
              // Start new round in game engine
              await gameEngine.startNewRound();
              
              // Play start sound
              playSound(Sounds.START);
              
              // Reset local state
              setGuess('');
              setPrompt('');
              setError(null);
              setCurrentDrawingIndex(0);
              
              // Game update will be handled by the useEffect watching game.settings
            } catch (error) {
              console.error('Error starting game:', error);
              setError('Failed to start game');
            }
          }}
          settings={gameEngine?.settings}
        />
        <GameSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          gameType={GameType.PICTURE_GAME}
          settings={gameEngine?.settings || pictureGameDefaults}
          onUpdateSettings={(newSettings) => {
            if (gameEngine) {
              gameEngine.updateSettings(newSettings);
            }
          }}
          isHost={player?.isHost || false}
        />
      </Box>
    );
  }

  // Show post-round screen if game status is ROUND_END
  if (game.status === GameStatus.ROUND_END) {
    return (
      <Box>
        <GameHeader game={game} />
        <PostRoundScreen
          game={game}
          player={player}
          onNextRound={async () => {
            try {
              if (!gameEngine) return;
              await gameEngine.startNewRound();
            } catch (error) {
              console.error('Error starting next round:', error);
              setError('Failed to start next round');
            }
          }}
          settings={gameEngine?.settings}
          isLastRound={game.currentRound >= (gameEngine?.settings.maxRounds || 5)}
        />
      </Box>
    );
  }

  const handlePromptSubmit = async () => {
    if (!gameEngine || !player) return;
    try {
      await gameEngine.submitPrompt(player.id, prompt);
      setPrompt('');
    } catch (error) {
      console.error('Error submitting prompt:', error);
      setError('Failed to submit prompt');
    }
  };

  const handleGuessSubmit = async () => {
    if (!gameEngine || !player) return;
    const currentDrawing = Array.from(drawings.values())[currentDrawingIndex];
    if (!currentDrawing) return;

    try {
      const updatedDrawing = {
        ...currentDrawing,
        guesses: [...currentDrawing.guesses, { playerId: player.id, guess }]
      };
      drawings.set(currentDrawing.playerId, updatedDrawing);

      await gameEngine.updateGameState({
        settings: JSON.stringify({
          ...JSON.parse(game.settings),
          drawings: Array.from(drawings.values())
        })
      });

      setGuess('');
    } catch (error) {
      console.error('Error submitting guess:', error);
      setError('Failed to submit guess');
    }
  };

  const renderPhase = () => {
    switch (currentPhase) {
      case 'PROMPT':
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Enter your prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!player}
            />
            <Button
              variant="contained"
              onClick={handlePromptSubmit}
              disabled={!prompt}
              sx={{ mt: 2 }}
            >
              Submit Prompt
            </Button>
          </Box>
        );

      case 'DRAW':
        const myDrawing = player ? drawings.get(player.id) : null;
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Draw: {myDrawing?.prompt || '...'}
            </Typography>
            <DrawingCanvas
              isDrawer={true}
              onDrawingUpdate={(drawing) => {
                if (player) {
                  const updatedDrawing = {
                    ...myDrawing!,
                    drawing
                  };
                  drawings.set(player.id, updatedDrawing);
                  
                  // Use the submitDrawing function instead of direct WebSocket call
                  submitDrawing(updatedDrawing);
                }
              }}
            />
          </Box>
        );

      case 'GUESS':
        const currentDrawing = Array.from(drawings.values())[currentDrawingIndex];
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Guess the drawing! ({currentDrawingIndex + 1}/{drawings.size})
            </Typography>
            <DrawingCanvas
              isDrawer={false}
              currentDrawing={currentDrawing?.drawing || null}
            />
            <TextField
              fullWidth
              label="Your guess"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={!player || currentDrawing?.playerId === player.id}
            />
            <Button
              variant="contained"
              onClick={handleGuessSubmit}
              disabled={!guess}
              sx={{ mt: 2 }}
            >
              Submit Guess
            </Button>
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

  // Update drawing submission to use acknowledgment
  const submitDrawing = async (drawingData: PlayerDrawing) => {
    if (!wsRef.current || !player) return;

    try {
      // Send real-time update via WebSocket
      await wsRef.current.send({
        type: 'DRAWING_UPDATE',
        gameId: game.id,
        data: {
          playerId: player.id,
          drawing: drawingData
        }
      });
      
      // Also update persistent state
      await gameEngine?.updateGameState({
        settings: JSON.stringify({
          ...JSON.parse(game.settings),
          drawings: Array.from(drawings.values())
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