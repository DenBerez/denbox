'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { updateGame } from '@/graphql/mutations';
import { validateGameStart } from '@/utils/gameValidation';
import GameSettings from './GameSettings';
import PlayerList from './PlayerList';
import { getDefaultSettings } from '@/constants/gameSettings';
import { Game, GameType, Player, GameStatus } from '@/types/game';
import { LetterRaceSettings } from '@/types/settings';
import { useGameState } from '@/hooks/useGameState';
import PlayerNameInput from './PlayerNameInput';
import GameHeader from './GameHeader';
import GameSettingsDialog from './GameSettingsDialog';

interface LobbyProps {
  game: Game;
  onStartGame: () => void;
}

export default function Lobby({ game, onStartGame }: LobbyProps) {
  const {
    players,
    isConnected,
    isLoading,
    error: gameStateError,
    updateGame: updateGameState,
    currentPlayer
  } = useGameState();

  const [localError, setLocalError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [settings, setSettings] = useState<LetterRaceSettings | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Parse settings from game object
  useEffect(() => {
    if (game && game.settings) {
      try {
        const parsedSettings = JSON.parse(game.settings);
        setSettings(parsedSettings);
      } catch (e) {
        console.error('Failed to parse game settings:', e);
        setLocalError('Invalid game settings');
      }
    } else {
      // Use default settings if none are provided
      setSettings(getDefaultSettings(game.gameType) as LetterRaceSettings);
    }
  }, [game]);

  const handleUpdateSettings = async (newSettings: LetterRaceSettings) => {
    setLocalError(null);
    setSettings(newSettings);
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
      setLocalError('Failed to update game settings');
    }
  };

  const handleStartGame = async () => {
    if (!currentPlayer?.id) {
      setLocalError('Player information is missing. Please refresh the page.');
      return;
    }

    if (!settings) {
      setLocalError('Game settings not found');
      return;
    }

    setIsStarting(true);
    setLocalError(null);

    try {
      const validationResult = validateGameStart(players, settings);
      if (!validationResult.isValid) {
        setLocalError(validationResult.errors[0]);
        setIsStarting(false);
        return;
      }

      // Update game status using GraphQL mutation
      await updateGameState({
        status: GameStatus.PLAYING,
        timeRemaining: settings.timePerRound,
        currentRound: 1
      });

      onStartGame();
    } catch (error) {
      console.error('Error starting game:', error);
      setLocalError('Failed to start game');
    } finally {
      setIsStarting(false);
    }
  };

  // Show loading state
  if (isLoading || isStarting) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {isStarting ? 'Starting game...' : 'Loading lobby...'}
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (gameStateError || localError) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {gameStateError || localError}
      </Alert>
    );
  }

  // Show waiting state if we don't have settings yet
  if (!settings) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading game settings...
        </Typography>
      </Box>
    );
  }

  const canStart = players && players.length >= (settings?.minPlayers || 2);

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container >
        <Grid item xs={12} md={12}>
          <GameHeader game={game} />
        </Grid>
        <Grid item xs={12} md={12}>
          <Box sx={{
            width: '100%',
            // minHeight: '300px', // Set a minimum height for the player list area
          }}>
            <PlayerList
              players={players || []}
              currentPlayerId={currentPlayer?.id}
              showScores={false}
            />
          </Box>

          {currentPlayer?.isHost && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => setSettingsDialogOpen(true)}
              >
                Game Settings
              </Button>

              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleStartGame}
                disabled={!canStart || !isConnected || isStarting}
              >
                {canStart ? 'Start Game' : `Need at least ${settings?.minPlayers || 2} players`}
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Game Settings Dialog */}
      {settings && (
        <GameSettingsDialog
          open={settingsDialogOpen}
          onClose={() => setSettingsDialogOpen(false)}
          gameType={game.gameType}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          isHost={currentPlayer?.isHost || false}
        />
      )}
    </Box>
  );
}