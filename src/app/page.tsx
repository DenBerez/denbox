'use client';

import { useState, useEffect, useCallback } from 'react';
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
import config from '../aws-exports';
import { JoinFull, Login } from '@mui/icons-material';
import ReactConfetti from 'react-confetti';

export default function Home() {
  const [gameCodeChars, setGameCodeChars] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGameTypeSelector, setShowGameTypeSelector] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const [logoRotation, setLogoRotation] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogoClick = useCallback(() => {
    // Play a fun sound
    // playSound('tada');
    
    // Show confetti
    setConfetti(true);
    
    // Animate the logo
    setLogoScale(1.3);
    setLogoRotation(360);
    
    // Reset logo animation after a delay
    setTimeout(() => {
      setLogoScale(1);
      setLogoRotation(0);
    }, 1000);
  }, []);

  const handleJoinGame = async () => {
    const fullGameCode = gameCodeChars.join('');
    if (!fullGameCode || fullGameCode.length !== 4) {
      setError('Please enter a complete game code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: getGame,
        authMode: 'apiKey',
        apiKey: config.aws_appsync_apiKey,
        variables: { id: fullGameCode }
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

      router.push(`/game/${fullGameCode}`);
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

  const handleCodeChange = (index: number, value: string) => {
    const newValue = value.toUpperCase();
    if (newValue.length <= 1 && /^[A-Z0-9]*$/.test(newValue)) {
      const newGameCodeChars = [...gameCodeChars];
      newGameCodeChars[index] = newValue;
      setGameCodeChars(newGameCodeChars);
      setError(null);

      // Auto-focus next input
      if (newValue.length === 1 && index < 3) {
        const nextInput = document.querySelector(`input[name="code-${index + 1}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          // For mobile: ensure virtual keyboard stays open
          nextInput.click();
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace/delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault(); // Prevent default behavior
      
      // If current field has content, clear it
      if (gameCodeChars[index]) {
        const newGameCodeChars = [...gameCodeChars];
        newGameCodeChars[index] = '';
        setGameCodeChars(newGameCodeChars);
      } 
      // Otherwise focus previous input if it exists
      else if (index > 0) {
        const prevInput = document.querySelector(`input[name="code-${index - 1}"]`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          // For mobile: ensure virtual keyboard stays open
          prevInput.click();
        }
      }
    }
    
    // Handle arrow keys for navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.querySelector(`input[name="code-${index - 1}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.click(); // For mobile
      }
    }
    
    if (e.key === 'ArrowRight' && index < 3) {
      const nextInput = document.querySelector(`input[name="code-${index + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.click(); // For mobile
      }
    }
  };

  const handleSelectGameType = async (gameType: GameTypeConfig) => {
    setLoading(true);
    setError(null);

    try {
      const gameCode = Array(4)
        .fill(0)
        .map(() => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)])
        .join('');
        
      const defaultSettings = getDefaultSettings(gameType.id);
      
      const input = {
        id: gameCode,
        code: gameCode,
        gameType: gameType,
        status: GameStatus.LOBBY,
        settings: JSON.stringify(defaultSettings),
        maxRounds: defaultSettings.maxRounds,
        currentRound: 1,
        timeRemaining: defaultSettings.timePerRound,
        hostId: gameCode
      };

      console.log('Creating game with input:', input);

      const result = await client.graphql({
        query: createGame,
        authMode: 'apiKey',
        apiKey: config.aws_appsync_apiKey,
        variables: { input }
      });

      if (result.data.createGame) {
        router.push(`/game/${gameCode}`);
      } else {
        throw new Error('Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Only trigger join if all code fields are filled
      if (!gameCodeChars.some(char => !char)) {
        handleJoinGame();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (pastedData) {
      // If we have exactly 4 characters, fill all fields
      if (pastedData.length === 4) {
        const newChars = pastedData.split('');
        setGameCodeChars(newChars);
        
        // Focus the last input
        setTimeout(() => {
          const lastInput = document.querySelector(`input[name="code-3"]`) as HTMLInputElement;
          if (lastInput) {
            lastInput.focus();
          }
        }, 0);
      } 
      // Otherwise just paste at current position and advance
      else {
        const newGameCodeChars = [...gameCodeChars];
        
        // Fill as many characters as we can from the current position
        for (let i = 0; i < pastedData.length && index + i < 4; i++) {
          newGameCodeChars[index + i] = pastedData[i];
        }
        
        setGameCodeChars(newGameCodeChars);
        
        // Focus the next empty input or the last one
        const nextEmptyIndex = newGameCodeChars.findIndex(char => !char);
        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 3;
        
        setTimeout(() => {
          const nextInput = document.querySelector(`input[name="code-${focusIndex}"]`) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
          }
        }, 0);
      }
    }
  };

  if (!mounted) return null;

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', py: 4 }}>
      {confetti && (
        <ReactConfetti
          width={typeof window !== 'undefined' ? window.innerWidth : 300}
          height={typeof window !== 'undefined' ? window.innerHeight : 200}
          recycle={false}
          numberOfPieces={100}
          gravity={0.2}
          colors={['#00e5ff', '#ff00e5', '#e5ff00', '#00ff00', '#ff0000', '#0000ff']}
          onConfettiComplete={(confetti) => {
            setConfetti(false);
            confetti?.reset();
          }}
        />
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          mb: 2,
          justifyContent: 'center', 
          alignItems: 'center', 
          flexDirection: 'column'
        }}>
          <Box 
            component="img"
            src="/dbicon.png"
            alt="Denbox Logo"
            onClick={handleLogoClick}
            sx={{
              width: '20%',
              height: 'auto',
              cursor: 'pointer',
              transition: 'transform 0.5s ease, filter 0.3s ease',
              transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
              '&:hover': {
                transform: 'scale(1.1)',
                filter: 'drop-shadow(0 0 8px #00e5ff)'
              }
            }}
          />
          <Typography 
            variant="h1" 
            align="center"
            sx={{
              ...textGradientStyles,
              fontSize: { xs: '2.5rem', sm: '3.5rem' },
              fontWeight: 700,
              my: 2
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
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateGame}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
              sx={buttonStyles.primary}
            >
              New Game
            </Button>

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

            <Box 
              component="form" 
              onSubmit={(e) => {
                e.preventDefault();
                if (!gameCodeChars.some(char => !char)) {
                  handleJoinGame();
                }
              }}
              sx={{ 
                display: 'flex', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
              }}>
                {gameCodeChars.map((char, index) => (
                  <TextField
                    key={index}
                    name={`code-${index}`}
                    value={char}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => handlePaste(e, index)}
                    disabled={loading}
                    inputProps={{
                      maxLength: 1,
                      inputMode: "text",
                      pattern: '[A-Za-z0-9]*',
                      autoComplete: 'off',
                      autoCorrect: 'off',
                      autoCapitalize: 'characters',
                      style: { 
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        padding: '0.5rem',
                        width: '3rem',
                        height: '3rem'
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                      '@media (max-width: 600px)': {
                        '& .MuiOutlinedInput-root': {
                          minWidth: '3.5rem',
                          height: '3.5rem',
                        }
                      }
                    }}
                  />
                ))}
              </Box>
              
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || gameCodeChars.some(char => !char)}
                startIcon={loading ? <CircularProgress size={20} /> : <Login />}
                sx={{
                  ...buttonStyles.primary,
                  height: 56,
                  width: { xs: '100%', sm: 'auto' },
                  opacity: (loading || gameCodeChars.some(char => !char)) ? 0.6 : 1,
                  '&.Mui-disabled': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                  }
                }}
              >
                {loading ? 'Joining...' : 'Join'}
              </Button>
            </Box>

            {error && (
              <Typography color="error" textAlign="center" mb={2}>
                {error}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Container>
  );
}
