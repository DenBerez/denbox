'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
  Chip,
  Fade,
  Alert,
} from '@mui/material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import {
  updateGame as updateGameMutation,
  updatePlayer
} from '@/graphql/mutations';
import { getGame } from '@/graphql/queries';
import { Game, GameStatus, GameType, Player } from '@/types/game';
import { validateGameStart, validateGameSettings } from '@/utils/gameValidation';
import PlayerList from './PlayerList';
import GameHeader from './GameHeader';
import GameSettings from './GameSettings';
import Lobby from './Lobby';
import PostRoundScreen from './PostRoundScreen';
import PlayerNameInput from './PlayerNameInput';
import GameTypeSelector from '@/app/components/GameTypeSelector';
import { LetterGame } from '@/lib/games/LetterGame';
import { LetterRaceSettings } from '@/types/settings';
import { letterRaceDefaults } from '@/constants/gameSettings';
import {
  EmojiEvents as TrophyIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { playSound, Sounds } from '@/utils/soundEffects';
import { usePlayerManagement } from '@/hooks/usePlayerManagement';
import { useGameState } from '@/providers/GameStateProvider';
import GameSettingsDialog from './GameSettingsDialog';
import { GraphQLResult } from '@aws-amplify/api';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface LetterGameProps {
  game: any;
  onGameUpdate: (game: any) => void;
}

export default function LetterGameComponent({ game: initialGame }) {
  const {
    game,
    players,
    isConnected,
    updateGame,
    currentPlayer: player,
    isLoading
  } = useGameState();

  // Add a loading check at the beginning
  if (isLoading || !game) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading game...</Typography>
      </Box>
    );
  }

  const { loading: playerLoading, error: playerError } = usePlayerManagement({ gameId: game.id });
  const [error, setError] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(game?.timeRemaining || 60);
  const [currentWord, setCurrentWord] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const wordsRef = useRef<string[]>([]);
  const [word, setWord] = useState('');
  const [letters, setLetters] = useState(game?.currentLetters || '');
  const [isPlaying, setIsPlaying] = useState(game?.status === 'PLAYING');
  const [settings, setSettings] = useState<LetterRaceSettings>(() => {
    try {
      return JSON.parse(game.settings) || letterRaceDefaults;
    } catch (e) {
      console.error('Error parsing settings:', e);
      return letterRaceDefaults;
    }
  });
  const [playerName, setPlayerName] = useState('');
  const [gameEngine, setGameEngine] = useState<LetterGame | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initialize game engine
  useEffect(() => {
    if (game) {
      const engine = new LetterGame(game);
      setGameEngine(engine);

      if (game.currentLetters) {
        setLetters(game.currentLetters);
      }

      if (game.status === GameStatus.PLAYING) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [game]);

  // Update player words when player changes
  useEffect(() => {
    if (player?.currentWords) {
      setWords(player.currentWords);
      wordsRef.current = player.currentWords;
    }
  }, [player]);

  // Update settings when game settings change
  useEffect(() => {
    if (game.settings) {
      try {
        const parsedSettings = JSON.parse(game.settings);
        setSettings(parsedSettings);
      } catch (e) {
        console.error('Error parsing game settings:', e);
      }
    }
  }, [game.settings]);

  // Start a new round
  const startRound = async () => {
    if (!player?.isHost) return;

    try {
      // Generate random letters for the round
      const newLetters = Array(settings.lettersPerRound)
        .fill('')
        .map(() => LETTERS.charAt(Math.floor(Math.random() * LETTERS.length)))
        .join('');

      const roundStartTime = new Date().toISOString();

      // Update game state via GraphQL mutation
      await updateGame({
        status: GameStatus.PLAYING,
        currentRound: 1,
        timeRemaining: settings.timePerRound,
        currentLetters: newLetters,
        roundStartTime: roundStartTime
      });

      // Update local state
      setIsPlaying(true);
      setTimeLeft(settings.timePerRound);
      setLetters(newLetters);
      setWords([]);
      setWord('');

      // Play sound effect
      playSound(Sounds.START);
    } catch (error) {
      console.error('Error starting round:', error);
      setError('Failed to start round. Please try again.');
    }
  };

  // Handle word submission
  const handleSubmitWord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!player || !gameEngine) {
      setError('Player not initialized');
      return;
    }

    if (!word.trim()) {
      setFormError('Please enter a word');
      return;
    }

    const trimmedWord = word.trim().toUpperCase();

    // Check if word already submitted
    if (words.includes(trimmedWord)) {
      setFormError('Word already submitted');
      playSound(Sounds.ERROR);
      return;
    }

    try {
      // Validate word contains required letters in sequence
      const isValid = await gameEngine.handleMove(player.id, trimmedWord);

      if (isValid) {
        // Word is valid, update local state
        const updatedWords = [...words, trimmedWord];

        // Update player in database with new word
        await client.graphql({
          query: updatePlayer,
          variables: {
            input: {
              id: player.id,
              currentWords: updatedWords
            }
          }
        }) as GraphQLResult<{
          updatePlayer: Player;
        }>;

        // Update local state
        setWords(updatedWords);
        setWord('');
        setError(null);

        // Play success sound
        playSound(Sounds.SUCCESS);
      } else {
        setFormError('Invalid word');
        playSound(Sounds.ERROR);
      }
    } catch (error) {
      console.error('Error submitting word:', error);
      setError('Failed to submit word. Please try again.');
    }
  };

  const handleSettingsUpdate = async (newSettings: LetterRaceSettings) => {
    try {
      await updateGame({
        settings: JSON.stringify(newSettings),
        maxRounds: newSettings.maxRounds,
        timeRemaining: newSettings.timePerRound
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleNextRound = async () => {
    try {
      const nextRound = game.currentRound + 1;

      // Generate new letters for the next round
      const newLetters = Array(settings.lettersPerRound)
        .fill('')
        .map(() => LETTERS.charAt(Math.floor(Math.random() * LETTERS.length)))
        .join('');

      const roundStartTime = new Date().toISOString();

      // Update game status and round via GraphQL mutation
      await updateGame({
        status: GameStatus.PLAYING,
        currentRound: nextRound,
        timeRemaining: settings.timePerRound,
        currentLetters: newLetters,
        settings: JSON.stringify(settings),
        roundStartTime: roundStartTime
      });

      // Update local state
      setIsPlaying(true);
      setTimeLeft(settings.timePerRound);
      setLetters(newLetters);
      setWords([]);
      setWord('');
    } catch (error) {
      console.error('Error starting next round:', error);
    }
  };

  const endRound = async () => {
    try {
      if (!player || !gameEngine) {
        console.error('Player or game engine not initialized');
        return;
      }

      if (isLastRound) {
        playSound(Sounds.END);
      }

      // Use the ref instead of the state
      const currentWords = [...wordsRef.current];
      console.log('Current words before ending round:', currentWords);

      // Format moves properly for score calculation
      const moves = currentWords.map(word => ({
        playerId: player.id,
        value: word,
        timestamp: Date.now()
      }));

      // Calculate final score for the round using current words
      const roundScore = gameEngine.calculateScore(moves);
      console.log('Final round score:', roundScore);

      // Update player's final state for the round
      await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            currentWords: currentWords,
            score: player.score + roundScore
          }
        }
      }) as GraphQLResult<{
        updatePlayer: Player;
      }>;

      // Update game state via GraphQL mutation
      await updateGame({
        status: isLastRound ? GameStatus.FINISHED : GameStatus.ROUND_END,
        timeRemaining: 0
      });
    } catch (error) {
      console.error('Error ending round:', error);
    }
  };

  // Parse settings from game
  const isLastRound = game.currentRound >= settings.maxRounds;

  const returnToLobby = async () => {
    try {
      // Update game status to LOBBY via GraphQL mutation
      await updateGame({
        status: GameStatus.LOBBY,
        currentRound: 0,
        timeRemaining: settings.timePerRound,
        settings: JSON.stringify(settings)
      });

      // Reset local game state
      setIsPlaying(false);
      setTimeLeft(settings.timePerRound);
      setWords([]);
      setWord('');
    } catch (error) {
      console.error('Error returning to lobby:', error);
    }
  };

  useEffect(() => {
    if (game) {
      document.title = `${game.code} | ${game.status === 'PLAYING' ? 'Playing' : 'Lobby'} | Denbox`;
    }
  }, [game?.code, game?.status]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timeLeft > 0 && game.status === GameStatus.PLAYING) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - end the round
            endRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup function to clear the interval when component unmounts
    return () => clearInterval(timer);
  }, [timeLeft, game.status, game.currentRound]);

  if (playerLoading || !isConnected) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        {(wsError || playerError) && (
          <Typography color="error" sx={{ ml: 2 }}>
            {wsError || playerError}
          </Typography>
        )}
      </Box>
    );
  }

  if (!game.gameType) return null;

  return (
    <Container maxWidth="lg">
      <GameHeader
        game={game}
        showRoundInfo={game.status !== 'LOBBY'}
      />

      {/* {game.status === 'LOBBY' && player && (
        <Lobby
          game={game}
          player={player}
          players={players}
          onStartGame={startRound}
          settings={settings}
        />
      )}

      {game.status === 'LOBBY' && !player && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}>
          <CircularProgress />
        </Box>
      )} */}

      {game.status === 'PLAYING' && (
        <>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1,
                      fontWeight: 600
                    }}
                  >
                    Letters
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700
                    }}
                  >
                    {letters}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Time Remaining
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={(timeLeft / settings.timePerRound) * 100}
                      size={80}
                      thickness={4}
                      sx={{ color: 'primary.main' }}
                    />
                    <Box sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary'
                        }}
                      >
                        {timeLeft}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Round
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: 'secondary.main',
                      fontWeight: 700
                    }}
                  >
                    {game.currentRound} / {settings.maxRounds}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  height: '100%'
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Find Words
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  Find words that contain the letters <strong>{letters}</strong> in that order.
                </Typography>

                <form onSubmit={handleSubmitWord}>
                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 2
                  }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Enter a word"
                      value={word}
                      onChange={(e) => {
                        setWord(e.target.value);
                        setFormError(null);
                      }}
                      error={!!formError}
                      helperText={formError}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      sx={{
                        px: 3,
                        borderRadius: 2
                      }}
                    >
                      Submit
                    </Button>
                  </Box>
                </form>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                  Your Words ({words.length})
                </Typography>

                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}>
                  {words.map((w, index) => (
                    <Chip
                      key={index}
                      label={w}
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        animation: 'fadeIn 0.3s ease-in',
                        animationFillMode: 'backwards',
                        animationDelay: `${index * 0.05}s`
                      }}
                    />
                  ))}

                  {words.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No words found yet. Start typing!
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <PlayerList
                gameId={game.id}
                currentPlayer={player}
              />
            </Grid>
          </Grid>
        </>
      )}

      {(game.status === 'ROUND_END' || game.status === 'FINISHED') && (
        <PostRoundScreen
          game={game}
          player={player}
          players={players}
          onNextRound={handleNextRound}
          onReturnToLobby={returnToLobby}
          isLastRound={isLastRound}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Container>
  );
}