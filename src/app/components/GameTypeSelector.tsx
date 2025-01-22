import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
} from '@mui/material';
import { TextFields as LetterGameIcon } from '@mui/icons-material';
import { GAME_CONFIGS } from '@/constants/gameSettings';
import { GameType, GameTypeConfig } from '@/types/game';
import React from 'react';

interface GameTypeSelectorProps {
  onSelectGameType: (gameType: GameTypeConfig) => void;
}

export default function GameTypeSelector({ onSelectGameType }: GameTypeSelectorProps) {
  const gameTypes = Object.values(GAME_CONFIGS);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Select Game Type
      </Typography>
      
      <Grid container spacing={3}>
        {gameTypes.map((gameType) => (
          <Grid item xs={12} md={6} key={gameType.id}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  bgcolor: 'action.hover'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: 2
                }
              }}
              onClick={() => onSelectGameType(gameType)}
            >
              {gameType.icon && (
                <Box sx={{ mb: 2 }}>
                  {React.createElement(gameType.icon)}
                </Box>
              )}
              <Typography variant="h5" gutterBottom>
                {gameType.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {gameType.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 