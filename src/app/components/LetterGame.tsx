'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { updateGame, updatePlayer } from '@/graphql/mutations';
import { getPlayer, getGame, playersByGameId } from '@/graphql/queries';
import { GameStatus, GameType } from '@/types/game';
import { validateGameStart, validateGameSettings } from '@/utils/gameValidation';
import PlayerList from './PlayerList';
import GameHeader from './GameHeader';
import GameSettings from './GameSettings';
import Lobby from './Lobby';
import PostRoundScreen from './PostRoundScreen';
import PlayerNameInput from './PlayerNameInput';
import GameTypeSelector from '@/app/components/GameTypeSelector';
import { letterPairDefaults } from '@/constants/gameSettings';
import { darkTheme } from '@/theme';
import { LetterPairSettings } from '@/types/settings';

const client = generateClient();

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface GameSettings {
  maxRounds: number;
  timePerRound: number;
  minPlayers: number;
  maxPlayers: number;
}

interface LetterGameSettings extends GameSettings {
  minWordLength: number;
  lettersPerRound: number;
}

interface LetterGameProps {
  game: any;
  onGameUpdate: (game: any) => void;
}

const defaultSettings: LetterGameSettings = {
  maxRounds: 3,
  timePerRound: 60,
  minPlayers: 2,
  maxPlayers: 8,
  minWordLength: 4,
  lettersPerRound: 2
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function LetterGame({ game, onGameUpdate }: LetterGameProps) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [words, setWords] = useState<string[]>([]);
  const [word, setWord] = useState('');
  const [letters, setLetters] = useState(game.currentLetters || '');
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (game.timeRemaining) return game.timeRemaining;
    if (game.settings) {
      try {
        const parsedSettings = JSON.parse(game.settings);
        return parsedSettings.timePerRound;
      } catch (e) {
        console.error('Error parsing settings for time:', e);
      }
    }
    return defaultSettings.timePerRound;
  });
  const [isPlaying, setIsPlaying] = useState(game.status === 'PLAYING');
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState<LetterPairSettings>(() => {
    if (game.settings) {
      try {
        return JSON.parse(game.settings) as LetterPairSettings;
      } catch (e) {
        console.error('Error parsing game settings:', e);
        return letterPairDefaults;
      }
    }
    return letterPairDefaults;
  });
  const [players, setPlayers] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const endRound = async () => {
    try {
      const nextRound = game.currentRound + 1;
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: nextRound >= settings.maxRounds ? 'FINISHED' : 'ROUND_END',
            currentRound: game.currentRound,
            timeRemaining: 0
          }
        }
      });
      onGameUpdate(result.data.updateGame);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error ending round:', error);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          // Update server with remaining time
          if (isHost) {
            client.graphql({
              query: updateGame,
              variables: {
                input: {
                  id: game.id,
                  timeRemaining: newTime,
                  settings: JSON.stringify(settings)
                }
              }
            });
          }
          if (newTime <= 0 && isHost) {
            endRound();
            clearInterval(timer);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeLeft, isHost, settings]);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedPlayerId) {
      fetchPlayer(storedPlayerId);
      fetchPlayers();
    }
  }, [game.id]);

  useEffect(() => {
    // Update local state when game updates
    if (game.status === 'PLAYING') {
      setIsPlaying(true);
      setLetters(game.currentLetters || '');  // Make sure to use the letters from the game state
      setTimeLeft(game.timeRemaining || settings.timePerRound);
    } else if (game.status === 'ROUND_END' && isPlaying) {
      setIsPlaying(false);
    }
  }, [game]);

  const fetchPlayer = async (id: string) => {
    try {
      const result = await client.graphql({
        query: getPlayer,
        variables: { id }
      });
      
      if (result.data.getPlayer) {
        setPlayer(result.data.getPlayer);
        setWords(result.data.getPlayer.currentWords || []);
      }
    } catch (error) {
      console.error('Error fetching player:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const result = await client.graphql({
        query: playersByGameId,
        variables: { gameId: game.id }
      });
      
      if (result.data.playersByGameId.items) {
        setPlayers(result.data.playersByGameId.items);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!player || !playerName.trim()) return;
    
    try {
      const result = await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            name: playerName.trim(),
            isConfirmed: true
          }
        }
      });
      setPlayer(result.data.updatePlayer);
    } catch (error) {
      console.error('Error updating player name:', error);
    }
  };

  const generateLetters = () => {
    // Ensure we're using the current settings for lettersPerRound
    const currentSettings = game.settings ? JSON.parse(game.settings) : settings;
    let result = '';
    for (let i = 0; i < currentSettings.lettersPerRound; i++) {
      result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    }
    console.log('Generating letters with settings:', currentSettings);
    return result;
  };

  const startRound = async () => {
    const newLetters = generateLetters();
    
    try {
      // Ensure we have the latest settings
      const currentSettings = game.settings ? JSON.parse(game.settings) : settings;
      
      console.log('Starting round with settings:', currentSettings);
      
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            currentLetters: newLetters,
            timeRemaining: currentSettings.timePerRound,
            status: 'PLAYING',
            roundStartTime: new Date().toISOString(),
            settings: JSON.stringify(currentSettings),
            maxRounds: currentSettings.maxRounds
          }
        }
      });
      
      // Update local state with the new settings
      setSettings(currentSettings);
      onGameUpdate(result.data.updateGame);
      setLetters(newLetters);
      setTimeLeft(currentSettings.timePerRound);
      setIsPlaying(true);
      setWords([]);
      
      // Reset player words
      if (player) {
        await client.graphql({
          query: updatePlayer,
          variables: {
            input: {
              id: player.id,
              currentWords: []
            }
          }
        });
      }
    } catch (error) {
      console.error('Error starting round:', error);
    }
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !player) return;

    // Add minimum word length check
    if (word.length < settings.minWordLength) {
      setError(`Word must be at least ${settings.minWordLength} letters long`);
      return;
    }

    // Check if the letters appear in the correct order
    const lettersArray = letters.split('');
    let currentIndex = 0;
    let isValid = true;
    let lastFoundIndex = -1;

    // Check each letter in sequence
    for (const letter of lettersArray) {
      const foundIndex = word.indexOf(letter, lastFoundIndex + 1);
      if (foundIndex === -1 || foundIndex < lastFoundIndex) {
        isValid = false;
        break;
      }
      lastFoundIndex = foundIndex;
    }

    if (!isValid) {
      // Word doesn't contain the letters in the correct order
      setError('Word must contain the letters in the correct order');
      return;
    }

    const newWords = [...words, word.trim()];
    setWords(newWords);
    setWord('');

    try {
      await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            currentWords: newWords
          }
        }
      });
    } catch (error) {
      console.error('Error updating player words:', error);
    }
  };

  const handleSettingsUpdate = async (newSettings: LetterPairSettings) => {
    try {
      // Validate settings before updating
      const validation = validateGameSettings(newSettings, GameType.LETTER_PAIR);
      if (!validation.isValid) {
        console.error('Invalid settings:', validation.errors);
        return;
      }

      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            settings: JSON.stringify(newSettings),
            maxRounds: newSettings.maxRounds,
            timeRemaining: newSettings.timePerRound
          }
        }
      });
      
      setSettings(newSettings);
      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleNextRound = async () => {
    try {
      const nextRound = game.currentRound + 1;
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: 'PLAYING',
            currentRound: nextRound,
            timeRemaining: settings.timePerRound
          }
        }
      });
      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error starting next round:', error);
    }
  };

  // Parse settings from game
  const isLastRound = game.currentRound >= settings.maxRounds;

  if (!game.gameType) return null;

  return (
    <Container maxWidth="lg">
      <GameHeader 
        game={game} 
        showRoundInfo={game.status !== 'LOBBY'} 
      />

      {game.status === 'LOBBY' && (
        <>
          <GameSettings
            gameType={game.gameType}
            settings={settings}
            onUpdateSettings={handleSettingsUpdate}
            isHost={isHost}
          />
          <Lobby
            game={game}
            player={player}
            players={players}
            onStartGame={startRound}
            settings={settings}
          />
        </>
      )}

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
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 1,
                      fontWeight: 600 
                    }}
                  >
                    Words Found
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 700
                    }}
                  >
                    {words.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <form onSubmit={handleWordSubmit}>
            <TextField
              fullWidth
              label={`Enter word (min ${settings.minWordLength} letters)`}
              value={word}
              onChange={(e) => {
                setWord(e.target.value.toUpperCase());
                setError(null);
              }}
              variant="outlined"
              autoComplete="off"
              disabled={!isPlaying}
              error={!!error}
              helperText={error}
              sx={{ mb: 3 }}
            />
          </form>

          <Paper 
            elevation={3} 
            sx={{ 
              p: 4,
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                fontWeight: 600 
              }}
            >
              Your Words
            </Typography>
            <List>
              {words.map((word, index) => (
                <ListItem 
                  key={index}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: 'background.default'
                    }
                  }}
                >
                  <ListItemText 
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {word}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </>
      )}

      {game.status === 'ROUND_END' && (
        <PostRoundScreen 
          game={game}
          player={player}
          onNextRound={handleNextRound}
          settings={settings}
          isLastRound={isLastRound}
        />
      )}

      {game.status === 'FINISHED' && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom align="center">
            Game Over!
          </Typography>
          <Typography variant="h6" align="center">
            Final Round: {settings.maxRounds}
          </Typography>
          {/* Add final scores display here */}
        </Paper>
      )}
    </Container>
  );
}