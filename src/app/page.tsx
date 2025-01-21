'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Divider,
  CircularProgress,
  CssBaseline,
} from '@mui/material';
import { Add as AddIcon, Login as LoginIcon } from '@mui/icons-material';
import { generateClient } from 'aws-amplify/api';
import { createGame, createPlayer, updateGame } from '../graphql/mutations';
import { gameByCode } from '../graphql/queries';
import { useRouter } from 'next/navigation';
import { Amplify } from 'aws-amplify';
import config from '../amplifyconfiguration.json';
import { letterPairDefaults } from '@/constants/gameSettings';

Amplify.configure(config);
const client = generateClient();

interface GameSettings {
  maxRounds: number;
  timePerRound: number;
  minPlayers: number;
  maxPlayers: number;
  // Add other common settings
}

interface BaseGame {
  id: string;
  type: GameType;
  name: string;
  description: string;
  tutorial: string; 
  icon: React.ReactNode;
  defaultSettings: GameSettings;
  component: React.ComponentType<GameProps>;
}

interface GameType {
  id: string;
  title: string;
  description: string;
  tutorial: string;
  icon: React.ReactNode;
  maxRounds: number;
  defaultSettings: GameSettings;
}

interface GameProps {
  game: any;
  player: any;
  onGameUpdate: (updatedGame: any) => void;
  settings: GameSettings;
}

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateGameCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const generatePlayerId = () => {
    // Implement your logic to generate a unique player ID
    return 'generatedPlayerId';
  };

  const handleCreateGame = async () => {
    try {
      setLoading(true);
      const code = generateGameCode();
      const tempHostId = 'temp-' + Date.now();
      
      // Use letterPairDefaults as the initial game settings
      const initialSettings = letterPairDefaults;
      
      const result = await client.graphql({
        query: createGame,
        variables: {
          input: {
            code: code,
            status: 'SETUP',
            hostId: tempHostId,
            currentRound: 0,
            maxRounds: initialSettings.maxRounds,
            currentLetters: '',
            settings: JSON.stringify(initialSettings),
            timeRemaining: initialSettings.timePerRound
          }
        }
      });

      // Create the host player
      const playerResult = await client.graphql({
        query: createPlayer,
        variables: {
          input: {
            gameId: result.data.createGame.id,
            name: 'Host',
            score: 0,
            isHost: true,
            isConfirmed: true,
            currentWords: []
          }
        }
      });

      // Update game with the real hostId
      await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: result.data.createGame.id,
            hostId: playerResult.data.createPlayer.id
          }
        }
      });

      localStorage.setItem('playerId', playerResult.data.createPlayer.id);
      router.push(`/game/${result.data.createGame.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Error creating game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (gameCode.length !== 4) return;

    try {
      setLoading(true);
      const result = await client.graphql({
        query: gameByCode,
        variables: {
          code: gameCode.toUpperCase()
        }
      });

      const games = result.data.gameByCode.items;
      if (games.length > 0) {
        const game = games[0];
        
        // Check game status
        if (game.status !== 'SETUP' && game.status !== 'LOBBY') {
          setError('Game has already started');
          return;
        }

        // Parse settings to check player limits
        const settings = JSON.parse(game.settings);
        
        // Get current player count
        const currentPlayers = game.players?.items?.length || 0;
        if (currentPlayers >= settings.maxPlayers) {
          setError('Game is full');
          return;
        }

        // Create player with isConfirmed set to true
        const playerResult = await client.graphql({
          query: createPlayer,
          variables: {
            input: {
              gameId: game.id,
              name: 'Player',
              score: 0,
              isHost: false,
              isConfirmed: true,  // Set this to true by default
              currentWords: []
            }
          }
        });

        localStorage.setItem('playerId', playerResult.data.createPlayer.id);
        router.push(`/game/${game.id}`);
      } else {
        setError('Game not found');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Error joining game');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Typography variant="h1" component="h1" align="center">
          Denbox
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h2" sx={{ mb: 3 }}>
            Join Game
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Game Code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              error={!!error}
              helperText={error}
            />
            <Button
              variant="contained"
              onClick={handleJoinGame}
              disabled={loading || !gameCode}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
            >
              Join
            </Button>
          </Box>
        </Paper>

        <Divider>or</Divider>

        <Button
          variant="contained"
          size="large"
          onClick={handleCreateGame}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          Create New Game
        </Button>
      </Box>
    </Container>
  );
}
