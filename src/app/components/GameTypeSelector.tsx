'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Fade
} from '@mui/material';
import {
  Create as DrawIcon,
  TextFields as LetterIcon
} from '@mui/icons-material';
import { GameType } from '@/types/game';
import { paperStyles, textGradientStyles } from '@/constants/styles';

interface GameTypeOption {
  type: GameType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const gameTypes: GameTypeOption[] = [
  {
    type: GameType.LETTER_RACE,
    title: 'Letter Race',
    description: 'Find words containing specific letters in order',
    icon: <LetterIcon sx={{ fontSize: 40 }} />
  },
  {
    type: GameType.PICTURE_GAME,
    title: 'Picture Game',
    description: 'Draw and guess pictures with your friends',
    icon: <DrawIcon sx={{ fontSize: 40 }} />
  }
];

interface GameTypeSelectorProps {
  onSelectGameType: (type: GameType) => void;
}

export default function GameTypeSelector({ onSelectGameType }: GameTypeSelectorProps) {
  const [selected, setSelected] = useState<GameType | null>(null);

  const handleSelect = (type: GameType) => {
    setSelected(type);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelectGameType(selected);
    }
  };

  return (
    <Paper sx={{ ...paperStyles.gradient, p: 4 }}>
      <Typography 
        variant="h3" 
        align="center" 
        sx={{ 
          ...textGradientStyles,
          mb: 4,
          fontWeight: 700 
        }}
      >
        Choose Game Type
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {gameTypes.map((gameType) => (
          <Grid item xs={12} sm={6} key={gameType.type}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: selected === gameType.type ? 'scale(1.02)' : 'none',
                border: '2px solid',
                borderColor: selected === gameType.type ? 'primary.main' : 'transparent',
                '&:hover': {
                  transform: 'scale(1.02)',
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleSelect(gameType.type)}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  p: 4
                }}>
                  <Box sx={{ 
                    color: 'primary.main',
                    mb: 2
                  }}>
                    {gameType.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    align="center"
                    sx={{ 
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    {gameType.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    align="center"
                  >
                    {gameType.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Fade in={selected !== null}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleConfirm}
            disabled={!selected}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Open Lobby
          </Button>
        </Box>
      </Fade>
    </Paper>
  );
} 