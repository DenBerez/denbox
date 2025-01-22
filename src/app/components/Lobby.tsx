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
import { validateGameStart } from '@/utils/gameValidation';
import GameSettings from './GameSettings';
import PlayerList from './PlayerList';
import { getDefaultSettings } from '@/constants/gameSettings';
import { Game, GameType, Player } from '@/types/game';
import { LetterRaceSettings } from '@/types/settings';
import { LetterGame } from '@/lib/games/LetterGame';

const client = generateClient();

interface LobbyProps {
  game: Game;
  player: Player;
  players: Player[];
  onStartGame: () => void;
  settings: LetterRaceSettings;
}

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

  const handleUpdateSettings = async (newSettings: LetterRaceSettings) => {
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
      const playerValidation = validateGameStart(players, localSettings);
      if (!playerValidation.isValid) {
        setError(playerValidation.error);
        return;
      }

      onStartGame();
      setError(null);
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, }}>
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