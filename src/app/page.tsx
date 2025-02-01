'use client';

import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { createGame, createPlayer } from '@/graphql/mutations';
import { getGame } from '@/graphql/queries';
import { GameStatus, GameType, GameTypeConfig } from '@/types/game';
import { getDefaultSettings } from '@/constants/gameSettings';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import GameTypeSelector from './components/GameTypeSelector';
import { paperStyles, buttonStyles, textGradientStyles } from '@/constants/styles';
import { amplifyClient as client } from '@/utils/amplifyClient';



export default function Home() {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGameTypeSelector, setShowGameTypeSelector] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: getGame,
        variables: { id: gameCode.toUpperCase() }
      });

      const game = result.data.getGame;
      if (!game) {
        setError('Game not found');
        return;
      }

      if (game.status === GameStatus.ENDED) {
        setError('This game has ended');
        return;
      }

      router.push(`/game/${gameCode.toUpperCase()}`);
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    setShowGameTypeSelector(true);
  };

  const handleSelectGameType = async (gameType: GameTypeConfig) => {
    setLoading(true);
    setError(null);

    try {
      // Generate a 4-character code using uppercase letters and numbers
      const gameCode = Array(4)
        .fill(0)
        .map(() => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)])
        .join('');
        
      const defaultSettings = getDefaultSettings(gameType.id);

      const input = {
        id: gameCode,
        code: gameCode,
        gameType: gameType.id,
        status: GameStatus.LOBBY,
        settings: JSON.stringify(defaultSettings),
        maxRounds: defaultSettings.maxRounds,
        currentRound: 1,
        timeRemaining: defaultSettings.timePerRound,
        hostId: gameCode
      }

      const result = await client.graphql({
        query: createGame,
        variables: {
          input: input
        },
      });

      if (result.data.createGame) {
        router.push(`/game/${gameCode}`);
      } else {
        throw new Error('Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game');
    }
  };

  if (!mounted) return null;

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          mb: 2,
          justifyContent: 'center', 
          alignItems: 'center', 
          flexDirection: 'column'
        }}>
          <img
            src="/simpleBox.png"
            alt="Denbox Logo"
            style={{
              width: '120px',
              height: 'auto',
              marginBottom: '1rem'
            }}
          />
          <Typography 
            variant="h1" 
            align="center"
            sx={{
              ...textGradientStyles,
              fontSize: { xs: '2.5rem', sm: '3.5rem' },
              fontWeight: 700,
              mb: 2
            }}
          >
            Denbox
          </Typography>
          <Typography 
            variant="h2" 
            align="center" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 500,
              maxWidth: '600px'
            }}
          >
            A collection of fun party games to play with friends
          </Typography>
        </Box>

        {showGameTypeSelector ? (
          <GameTypeSelector 
            onSelectGameType={handleSelectGameType} 
            loading={loading}
          />
        ) : (
          <>
            <Paper sx={{ ...paperStyles.gradient }}>
              <Box sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    ...textGradientStyles,
                    mb: 3,
                    fontWeight: 600
                  }}
                >
                  Join Existing Game
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  alignItems: 'flex-start'
                }}>
                  <TextField
                    fullWidth
                    label="Game Code"
                    value={gameCode}
                    onChange={(e) => {
                      setGameCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    disabled={loading}
                    error={!!error}
                    helperText={error}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleJoinGame}
                    disabled={loading || !gameCode.trim()}
                    sx={{
                      ...buttonStyles.primary,
                      height: 56, // Match TextField height
                      minWidth: 120
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Join'}
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Divider sx={{ 
              my: 2,
              '&::before, &::after': {
                borderColor: 'divider',
              }
            }}>
              <Typography 
                color="text.secondary"
                sx={{ px: 2 }}
              >
                or
              </Typography>
            </Divider>

            <Button
              variant="contained"
              size="large"
              onClick={handleCreateGame}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
              sx={buttonStyles.primary}
            >
              Create New Game
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
}
