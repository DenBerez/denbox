import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import { TextFields as LetterGameIcon } from '@mui/icons-material';
import { GAME_CONFIGS } from '@/constants/gameSettings';
import { GameType, GameTypeConfig } from '@/types/game';
import React, { useState } from 'react';
import { paperStyles, textGradientStyles } from '@/constants/styles';

interface GameTypeSelectorProps {
  onSelectGameType: (gameType: GameTypeConfig) => void;
  loading?: boolean;
}

export default function GameTypeSelector({ onSelectGameType, loading = false }: GameTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const gameTypes = Object.values(GAME_CONFIGS);

  const handleGameTypeClick = (gameType: GameTypeConfig) => {
    setSelectedType(gameType.id);
    onSelectGameType(gameType);
  };

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
                cursor: loading ? 'default' : 'pointer',
                opacity: loading && selectedType !== gameType.id ? 0.5 : 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: loading ? 'none' : 'translateY(-4px)',
                  boxShadow: loading ? 2 : 6,
                  borderColor: loading ? 'divider' : 'primary.main',
                  bgcolor: loading ? 'transparent' : 'rgba(33, 150, 243, 0.1)'
                },
                '&:active': {
                  transform: loading ? 'none' : 'translateY(0)',
                  boxShadow: 2
                },
                position: 'relative'
              }}
              onClick={() => !loading && handleGameTypeClick(gameType)}
            >
              {loading && selectedType === gameType.id && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 'inherit',
                    zIndex: 1
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
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