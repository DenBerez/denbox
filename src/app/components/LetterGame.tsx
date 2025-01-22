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
import { darkTheme } from '@/theme';
import { LetterGame } from '@/lib/games/LetterGame';
import { LetterRaceSettings } from '@/types/settings';
import { letterRaceDefaults } from '@/constants/gameSettings';
import { 
  EmojiEvents as TrophyIcon,
  Home as HomeIcon 
} from '@mui/icons-material';

const client = generateClient();

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface LetterGameProps {
  game: any;
  onGameUpdate: (game: any) => void;
}

export default function LetterGameComponent({ game, onGameUpdate }: LetterGameProps) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
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
  const [players, setPlayers] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gameEngine, setGameEngine] = useState<LetterGame | null>(null);

  // Update ref whenever words state changes
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      // Clear any existing timer first
      if (timer) clearInterval(timer);
      
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            // Remove isHost check so any player can trigger round end when their timer expires
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

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedPlayerId) {
      fetchPlayer(storedPlayerId);
      fetchPlayers();
    }
  }, [game.id]);

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

  const fetchPlayer = async (id: string) => {
    try {
      const result = await client.graphql({
        query: getPlayer,
        variables: { id }
      });
      
      if (result.data.getPlayer) {
        console.log('Fetched player data:', result.data.getPlayer);
        const playerData = result.data.getPlayer;
        setPlayer(playerData);
        
        // Ensure we're properly loading saved words
        if (Array.isArray(playerData.currentWords)) {
          console.log('Loading saved words:', playerData.currentWords);
          setWords(playerData.currentWords);
        } else {
          console.log('No saved words found, initializing empty array');
          setWords([]);
        }
        
        setIsHost(playerData.isHost);
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

  const startRound = async () => {
    try {
      // Ensure we're using the current settings from the game state
      const currentSettings = JSON.parse(game.settings);
      
      const newLetters = Array(currentSettings.lettersPerRound)
        .fill('')
        .map(() => LETTERS.charAt(Math.floor(Math.random() * LETTERS.length)))
        .join('');

      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            status: GameStatus.PLAYING,
            currentRound: game.currentRound + 1,
            timeRemaining: currentSettings.timePerRound,
            currentLetters: newLetters,
            settings: game.settings // Preserve the current settings
          }
        }
      });

      setWords([]);
      setWord('');
      setLetters(newLetters);
      setIsPlaying(true);
      setTimeLeft(currentSettings.timePerRound);
      setSettings(currentSettings); // Update local settings state

      onGameUpdate(result.data.updateGame);
    } catch (error) {
      console.error('Error starting round:', error);
    }
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !gameEngine) return;
  
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
      // First validate the move locally
      if (!gameEngine.validateMove({ playerId: player.id, value: cleanWord })) {
        setError(`Invalid word. Must contain letters "${letters}" in order`);
        return;
      }
  
      // Validate against dictionary API
      const response = await fetch('/api/validate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [cleanWord] }),
      });
  
      const [isValid] = await response.json();
      
      if (isValid) {
        const updatedWords = [...words, cleanWord];
        
        // Calculate score
        const moves = updatedWords.map(w => ({
          playerId: player.id,
          value: w,
          timestamp: Date.now()
        }));
        const newScore = gameEngine.calculateScore(moves);
        
        // Update player in database
        const updateResult = await client.graphql({
          query: updatePlayer,
          variables: {
            input: {
              id: player.id,
              currentWords: updatedWords,
              score: newScore
            }
          }
        });
        
        console.log('Word submission update:', {
          word: cleanWord,
          updatedWords,
          newScore,
          updateResult
        });
  
        // Update local state
        setWords(updatedWords);
        setWord('');
        setError(null);
      } else {
        setError('Word not found in dictionary');
      }
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
      if (!player) {
        console.error('Player not initialized');
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
      const roundScore = gameEngine?.calculateScore(moves) || 0;
      console.log('Final round score:', roundScore);

      // Update player's final state for the round
      const updateResult = await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            currentWords: currentWords,
            score: roundScore
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

  if (!game.gameType) return null;

  return (
    <Container maxWidth="lg">
      <GameHeader 
        game={game} 
        showRoundInfo={game.status !== 'LOBBY'} 
      />

      {game.status === 'LOBBY' && (
        <>
     
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
              label={`Enter word using letters: ${letters}`}
              value={word}
              onChange={(e) => {
                // Only allow letters
                const input = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                setWord(input);
                setError(null);
              }}
              variant="outlined"
              autoComplete="off"
              disabled={!isPlaying}
              error={!!error}
              helperText={error || `Word must be at least ${settings.minWordLength} letters and contain the letters in order`}
              sx={{ mb: 3 }}
              InputProps={{
                onKeyDown: (e) => {
                  // Prevent spaces in the input
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
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
            >
              Submit Word
            </Button>
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

          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = '/'}
            fullWidth
            size="large"
            startIcon={<HomeIcon />}
            sx={{ 
              mt: 2,
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
        </Paper>
      )}
    </Container>
  );
}