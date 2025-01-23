'use client';

import { useState, useEffect } from 'react';
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
import GameSettingsDialog from './GameSettingsDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { paperStyles, buttonStyles, textGradientStyles } from '@/constants/styles';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);

  useEffect(() => {
    if (!player) {
      console.error('No player data found');
      setError('Player data not found. Please try rejoining the game.');
    }
  }, [player]);

  const handleUpdateSettings = async (newSettings: LetterRaceSettings) => {
    setError(null);
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
      setError('Failed to update game settings');
    }
  };

  const handlePlayersUpdate = (updatedPlayers: Player[]) => {
    setLocalPlayers(updatedPlayers);
  };

  const handleStartGame = async (players: Player[]) => {
    if (!localSettings) {
      setError('Game settings not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validationResult = validateGameStart(players, localSettings);
      if (!validationResult.isValid) {
        setError(validationResult.errors[0]);
        setLoading(false);
        return;
      }

      onStartGame();
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PlayerList 
        gameId={game.id} 
        currentPlayer={player}
        onPlayersUpdate={handlePlayersUpdate}
      />
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="outlined"
          onClick={() => setSettingsOpen(true)}
          startIcon={<SettingsIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'rgba(33, 150, 243, 0.1)'
            }
          }}
        >
          Game Settings
        </Button>
        
        {player?.isHost && (
          <Button
            variant="contained"
            onClick={() => handleStartGame(localPlayers)}
            size="large"
            startIcon={loading ? <CircularProgress size={24} /> : <PlayArrowIcon />}
            disabled={loading}
            sx={{ 
              ...buttonStyles.primary,
              minWidth: 180
            }}
          >
            {loading ? 'Starting...' : 'Start Game'}
          </Button>
        )}
      </Box>

      <GameSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        gameType={game.gameType}
        settings={localSettings}
        onUpdateSettings={handleUpdateSettings}
        isHost={player?.isHost}
      />

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
    </Box>
  );
}