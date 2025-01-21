'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { updateGame } from '@/graphql/mutations';
import { validateGameStart, validateGameSettings } from '@/utils/gameValidation';
import GameSettings from './GameSettings';
import PlayerList from './PlayerList';
import { getDefaultSettings } from '@/constants/gameSettings';

const client = generateClient();

interface LobbyProps {
  game: any;
  player: any;
  players: any[];
  onStartGame: () => void;
  settings: LetterGameSettings;
}

interface GameTypeInfo {
  id: string;
  title: string;
  description: string;
  tutorial: string;
  icon: React.ReactNode;
  maxRounds: number;
  defaultSettings: {
    maxRounds: number;
    timePerRound: number;
    minPlayers: number;
    maxPlayers: number;
    [key: string]: any;
  };
}

const gameTypes: GameTypeInfo[] = [
  {
    id: 'LETTER_PAIR',
    title: 'Letter Pairs',
    description: 'Find words containing specific letter pairs in order',
    tutorial: 'You will be given two letters. Find words that contain these letters in order. For example, if the letters are "ST", valid words include "STOP", "FAST", and "MASTER".',
    icon: null,
    maxRounds: 3,
    defaultSettings: {
      maxRounds: 3,
      timePerRound: 60,
      minPlayers: 2,
      maxPlayers: 8,
      minWordLength: 4,
      lettersPerRound: 2
    },
  },
  {
    id: 'SPEED_WORDS',
    title: 'Speed Words',
    description: 'Race to type words matching specific criteria',
    tutorial: 'Type words as quickly as possible that match the given criteria. The faster you type correct words, the more points you earn!',
    icon: null,
    maxRounds: 3,
    defaultSettings: {
      maxRounds: 3,
      timePerRound: 30,
      minPlayers: 2,
      maxPlayers: 4,
    },
  },
];

export default function Lobby({ game, player, players, onStartGame, settings }: LobbyProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(() => {
    if (game.settings) {
      try {
        return JSON.parse(game.settings);
      } catch (e) {
        console.error('Error parsing game settings:', e);
        return getDefaultSettings(game.gameType);
      }
    }
    return getDefaultSettings(game.gameType);
  });

  // Find the selected game type info
  const selectedGameType = gameTypes.find(type => type.id === game.gameType);

  const handleUpdateSettings = async (newSettings: any) => {
    setLocalSettings(newSettings);
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
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleStartGame = async () => {
    if (!localSettings) {
      setError('Game settings not found');
      return;
    }

    setLoading(true);
    try {
      const settingsValidation = validateGameSettings(localSettings, game.gameType);
      if (!settingsValidation.isValid) {
        setError(settingsValidation.errors[0]);
        setLoading(false);
        return;
      }

      const playerValidation = validateGameStart(players, localSettings);
      if (!playerValidation.isValid) {
        setError(playerValidation.errors[0]);
        setLoading(false);
        return;
      }

      const settingsResult = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: game.id,
            settings: JSON.stringify(localSettings),
            maxRounds: localSettings.maxRounds,
            timeRemaining: localSettings.timePerRound
          }
        }
      });

      if (settingsResult.data.updateGame) {
        setError(null);
        onStartGame();
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: 3 }}>
      <PlayerList 
        gameId={game.id} 
        currentPlayer={player}
      />
      
      {player?.isHost && (
        <GameSettings
          gameType={game.gameType}
          settings={localSettings}
          onUpdateSettings={handleUpdateSettings}
          isHost={player?.isHost}
        />
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            bgcolor: 'error.dark',
            color: 'error.contrastText',
            p: 2,
            '& .MuiAlert-icon': {
              color: 'error.contrastText'
            }
          }}
        >
          {error}
        </Alert>
      )}

      {player?.isHost && (
        <Button
          variant="contained"
          onClick={handleStartGame}
          size="large"
          sx={{ 
            py: 2,
            px: 4,
            fontSize: '1.2rem',
            fontWeight: 600
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress
                size={24}
                sx={{ 
                  mr: 2,
                  color: 'inherit'
                }}
              />
              Starting...
            </>
          ) : (
            'Start Game'
          )}
        </Button>
      )}
    </Box>
  );
}