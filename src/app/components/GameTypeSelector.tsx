import {
  Box,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import { TextFields as LetterGameIcon } from '@mui/icons-material';
import { GAME_CONFIGS } from '@/constants/gameSettings';
import { GameType, GameTypeConfig } from '@/types/game';
import React from 'react';
import { paperStyles, textGradientStyles } from '@/constants/styles';

interface GameTypeSelectorProps {
  onSelectGameType: (gameType: GameTypeConfig) => void;
}

export default function GameTypeSelector({ onSelectGameType }: GameTypeSelectorProps) {
  const gameTypes = Object.values(GAME_CONFIGS);

  return (
    <Box>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 4,
          ...textGradientStyles,
          fontWeight: 700
        }}
      >
        Select Game Type
      </Typography>
      
      <Grid container spacing={3}>
        {gameTypes.map((gameType) => (
          <Grid item xs={12} md={6} key={gameType.id}>
            <Paper 
              elevation={3}
              sx={{ 
                ...paperStyles.default,
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(33, 150, 243, 0.1)'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: 2
                }
              }}
              onClick={() => onSelectGameType(gameType)}
            >
              {gameType.icon && (
                <Box sx={{ 
                  mb: 2,
                  color: 'primary.main',
                  '& > svg': {
                    fontSize: 40
                  }
                }}>
                  {React.createElement(gameType.icon)}
                </Box>
              )}
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                {gameType.title}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  lineHeight: 1.6
                }}
              >
                {gameType.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 