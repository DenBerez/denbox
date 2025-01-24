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
} from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { updateGame, updatePlayer, createPlayer } from '@/graphql/mutations';
import { getPlayer, getGame, playersByGameId } from '@/graphql/queries';
import { onCreatePlayerByGameId, onUpdatePlayerByGameId } from '@/graphql/subscriptions';
import { GameStatus, GameType, Player } from '@/types/game';
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
import { GraphQLResult } from '@aws-amplify/api';

const client = generateClient();

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface LetterGameProps {
  game: any;
  onGameUpdate: (game: any) => void;
}

export default function LetterGameComponent({ game, onGameUpdate }: LetterGameProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const wordsRef = useRef<string[]>([]);
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
        return letterRaceDefaults.timePerRound;
      }
    }
    return letterRaceDefaults.timePerRound;
  });
  const [isPlaying, setIsPlaying] = useState(game.status === 'PLAYING');
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState<LetterRaceSettings>(() => {
    if (game.settings) {
      try {
        return JSON.parse(game.settings) as LetterRaceSettings;
      } catch (e) {
        console.error('Error parsing game settings:', e);
        return letterRaceDefaults;
      }
    }
    return letterRaceDefaults;
  });
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gameEngine, setGameEngine] = useState<LetterGame | null>(null);
  const playerCreationAttempted = useRef(false);

  // Update ref whenever words state changes
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (isPlaying && timeLeft > 0) {
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
  }, [isPlaying]);

  // Add debug logging
  useEffect(() => {
    console.log('Current player:', player);
    console.log('All players:', players);
  }, [player, players]);

  useEffect(() => {
    if (game.status === GameStatus.ROUND_END) {
      setIsPlaying(false);
      setTimeLeft(0);
      fetchPlayers();
    } else if (game.status === GameStatus.PLAYING) {
      setIsPlaying(true);
      setTimeLeft(game.timeRemaining || settings.timePerRound);
      setLetters(game.currentLetters || '');
      
      // Only reset words if this is a new round starting
      // Check if the letters have changed, indicating a new round
      if (letters !== game.currentLetters) {
        setWords([]);
      }
    }
  }, [game.status, game.currentLetters]);

  useEffect(() => {
    setGameEngine(new LetterGame(game));
  }, [game]);

  useEffect(() => {
    if (player?.currentWords) {
      setWords(player.currentWords);
    }
  }, [player?.currentWords]);

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

  useEffect(() => {
    const playerManager = async () => {
      if (!game?.id) return;
      
      try {
        // 1. Get all current players
        const existingPlayersResult = await client.graphql({
          query: playersByGameId,
          variables: { gameId: game.id }
        }) as GraphQLResult<{
          playersByGameId: {
            items: Player[];
          };
        }>;
        
        const existingPlayers = existingPlayersResult.data?.playersByGameId.items || [];
        setPlayers(existingPlayers);

        // 2. Check for stored player ID
        const storedPlayerId = localStorage.getItem(`player_${game.id}`);
        const existingPlayer = existingPlayers.find(p => p.id === storedPlayerId);

        if (existingPlayer) {
          setPlayer(existingPlayer);
          setIsHost(existingPlayer.isHost);
          return;
        }

        // 3. Only create new player if we haven't found an existing one
        if (!existingPlayer && !playerCreationAttempted.current) {
          playerCreationAttempted.current = true;
          
          const isHost = existingPlayers.length === 0;
          const playerName = `Player ${Math.floor(Math.random() * 1000)}`;
          
          const newPlayer = await client.graphql({
            query: createPlayer,
            variables: {
              input: {
                gameId: game.id,
                name: playerName,
                score: 0,
                isHost,
                isConfirmed: false,
                currentWords: [],
                gamePlayersId: game.id
              }
            }
          }) as GraphQLResult<{
            createPlayer: Player;
          }>;

          if (newPlayer.data?.createPlayer) {
            localStorage.setItem(`player_${game.id}`, newPlayer.data.createPlayer.id);
            setPlayer(newPlayer.data.createPlayer);
            setIsHost(isHost);
          }
        }
      } catch (error) {
        console.error('Error in player management:', error);
      }
    };

    playerManager();

    // Cleanup
    return () => {
      playerCreationAttempted.current = false;
    };
  }, [game?.id]);

  const fetchPlayers = async () => {
    try {
      const result = await client.graphql({
        query: playersByGameId,
        variables: { gameId: game.id }
      }) as GraphQLResult<{
        playersByGameId: {
          items: Player[];
        };
      }>;
      
      if (result.data?.playersByGameId.items) {
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
      }) as GraphQLResult<{
        updatePlayer: Player;
      }>;

      setPlayer(result.data?.updatePlayer);
    } catch (error) {
      console.error('Error updating player name:', error);
    }
  };

  const startRound = async () => {
    try {
      // Ensure we're using the current settings from the game state
      const currentSettings = game.settings ? JSON.parse(game.settings) : settings;
      
      // Generate new letters for the round
      const newLetters = Array(currentSettings.lettersPerRound)
        .fill('')
        .map(() => LETTERS.charAt(Math.floor(Math.random() * LETTERS.length)))
        .join('');

      // If we're in LOBBY, start at round 1, otherwise increment
      const nextRound = game.status === GameStatus.LOBBY ? 1 : game.currentRound + 1;

      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: GameStatus.PLAYING,
            currentRound: nextRound,
            timeRemaining: currentSettings.timePerRound,
            currentLetters: newLetters,
            roundStartTime: new Date().toISOString()
          }
        }
      });

      // Reset local state
      setWords([]);
      setWord('');
      setLetters(newLetters);
      setIsPlaying(true);
      setTimeLeft(currentSettings.timePerRound);
      setSettings(currentSettings);

      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error starting round:', error);
      throw error;
    }
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !gameEngine || !player) {
      return;
    }

    const cleanWord = word.trim().toUpperCase();

    // Basic validation before sending to server
    if (cleanWord.length < settings.minWordLength) {
      setError(`Word must be at least ${settings.minWordLength} letters long`);
      return;
    }

    // Check if word was already submitted
    if (words.includes(cleanWord)) {
      setError('You already found this word!');
      return;
    }

    try {
      // Only validate the move locally
      if (!gameEngine.validateMove({ playerId: player.id, value: cleanWord })) {
        setError(`Invalid word. Must contain letters "${letters}" in order`);
        return;
      }

      const updatedWords = [...words, cleanWord];
      
      // Update player in database with new word
      const updateResult = await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            currentWords: updatedWords
          }
        }
      });
      
      // Update local state
      setWords(updatedWords);
      setWord('');
      setError(null);
      
    } catch (error) {
      console.error('Error submitting word:', error);
      setError('Failed to submit word. Please try again.');
    }
  };

  const handleSettingsUpdate = async (newSettings: LetterRaceSettings) => {
    try {
      await client.graphql({
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
      
      // Update game status and round
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: GameStatus.PLAYING,
            currentRound: nextRound,
            timeRemaining: settings.timePerRound,
            currentLetters: newLetters,
            settings: JSON.stringify(settings)
          }
        }
      });
      
      // Update local state AFTER game update is successful
      onGameUpdate(result.data.updateGame);
      setIsPlaying(true);
      setTimeLeft(settings.timePerRound);
      setLetters(newLetters);
      
      // Reset words LAST, after all other state updates
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
      const updateResult = await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            currentWords: currentWords,
            score: player.score + roundScore
          }
        }
      });

      console.log('Player update result:', updateResult);
      
      // Update game state
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: isLastRound ? GameStatus.FINISHED : GameStatus.ROUND_END,
            timeRemaining: 0
          }
        }
      });

      console.log('Game update result:', result);
      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error ending round:', error);
    }
  };

  // Parse settings from game
  const isLastRound = game.currentRound >= settings.maxRounds;

  const returnToLobby = async () => {
    try {
      // Update game status to LOBBY while preserving settings and players
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: GameStatus.LOBBY,
            currentRound: 0,
            timeRemaining: settings.timePerRound,
            settings: JSON.stringify(settings)
          }
        }
      });
      
      // Reset local game state
      setIsPlaying(false);
      setTimeLeft(settings.timePerRound);
      setWords([]);
      setWord('');
      
      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error returning to lobby:', error);
    }
  };

  if (!game.gameType) return null;

  return (
    <Container maxWidth="lg">
      <GameHeader 
        game={game} 
        showRoundInfo={game.status !== 'LOBBY'} 
      />

      {game.status === 'LOBBY' && player && (
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
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label={`Letters: ${letters}`}
                value={word}
                onChange={(e) => {
                  const input = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                  setWord(input);
                  setError(null);
                }}
                variant="outlined"
                autoComplete="off"
                disabled={!isPlaying}
                error={!!error}
                helperText={error || `Word must be at least ${settings.minWordLength} letters and contain the letters in order`}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.2rem',
                    letterSpacing: '0.05em',
                    '& fieldset': {
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem',
                  }
                }}
                InputProps={{
                  onKeyDown: (e) => {
                    if (e.key === ' ') e.preventDefault();
                  },
                  sx: { 
                    bgcolor: 'background.paper',
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!isPlaying || !word || word.length < settings.minWordLength}
                onClick={handleWordSubmit}
                fullWidth
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(45deg, #9e9e9e 30%, #bdbdbd 90%)',
                  }
                }}
              >
                Submit Word
              </Button>
            </Box>
          </form>

          <Paper 
            elevation={3} 
            sx={{ 
              p: 4,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 3 
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  flex: 1
                }}
              >
                Your Words
              </Typography>
              <Chip 
                label={`${words.length} words`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
            
            <List sx={{ 
              maxHeight: 300, 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'background.paper',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'primary.main',
                borderRadius: '4px',
              }
            }}>
              {words.map((word, index) => (
                <ListItem 
                  key={index}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <ListItemText 
                    primary={word}
                    primaryTypographyProps={{
                      sx: { 
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                      }
                    }}
                  />
                </ListItem>
              ))}
              {words.length === 0 && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    textAlign: 'center',
                    py: 4,
                    fontStyle: 'italic'
                  }}
                >
                  No words submitted yet
                </Typography>
              )}
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
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            mb: 3,
            background: 'linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                color: 'primary.main',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
              }}
            >
              <TrophyIcon fontSize="large" />
              Game Over!
              <TrophyIcon fontSize="large" />
            </Typography>
          </Box>

          {/* Podium for top 3 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 2,
            mb: 6,
            mt: 4,
            height: 200
          }}>
            {/* Second Place */}
            {players[1] && (
              <Box sx={{ 
                width: 200,
                height: '70%',
                bgcolor: 'grey.300',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 2
              }}>
                <Box sx={{
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  mb: 1
                }}>
                  <Typography variant="h4">🥈</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {players[1].name}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {players[1].score} pts
                </Typography>
              </Box>
            )}

            {/* First Place */}
            {players[0] && (
              <Box sx={{ 
                width: 200,
                height: '100%',
                bgcolor: 'warning.light',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 2
              }}>
                <Box sx={{
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  width: 70,
                  height: 70,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                  mb: 1
                }}>
                  <Typography variant="h3">👑</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {players[0].name}
                </Typography>
                <Typography variant="h6" sx={{ color: 'warning.dark' }}>
                  {players[0].score} pts
                </Typography>
              </Box>
            )}

            {/* Third Place */}
            {players[2] && (
              <Box sx={{ 
                width: 200,
                height: '50%',
                bgcolor: '#CD7F32',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 2
              }}>
                <Box sx={{
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  mb: 1
                }}>
                  <Typography variant="h4">🥉</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {players[2].name}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {players[2].score} pts
                </Typography>
              </Box>
            )}
          </Box>

          {/* Remaining Players */}
          {players.length > 3 && (
            <List sx={{ mb: 4 }}>
              {players.slice(3).map((player, index) => (
                <ListItem 
                  key={player.id}
                  sx={{
                    mb: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateX(8px)'
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      mr: 2,
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40
                    }}
                  >
                    {index + 4}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                          {player.name}
                        </Typography>
                        <Chip 
                          label={`${player.score} pts`}
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={returnToLobby}
              fullWidth
              size="large"
              sx={{ 
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #9c27b0 30%, #d500f9 90%)',
                boxShadow: '0 3px 5px 2px rgba(156, 39, 176, .3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              Return to Lobby
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.href = '/'}
              fullWidth
              size="large"
              startIcon={<HomeIcon />}
              sx={{ 
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              Back to Home
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
}