'use client';

import { Box, Typography, Paper } from '@mui/material';
import { useGameState } from '@/providers/GameStateProvider';
import { paperStyles } from '@/constants/styles';

export default function DebugInfo() {
  const { 
    game, 
    players, 
    isConnected, 
    isLoading, 
    error, 
    currentPlayer 
  } = useGameState();

  return (
    <Paper sx={{ ...paperStyles.standard, p: 2, mb: 2, opacity: 0.9 }}>
      <Typography variant="h6" gutterBottom>Debug Information</Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1 }}>
        <Typography variant="body2" fontWeight="bold">Game:</Typography>
        <Typography variant="body2">{game ? `${game.id} (${game.status})` : 'null'}</Typography>
        
        <Typography variant="body2" fontWeight="bold">Players:</Typography>
        <Typography variant="body2">{players.length} players</Typography>
        
        <Typography variant="body2" fontWeight="bold">Current Player:</Typography>
        <Typography variant="body2">
          {currentPlayer ? `${currentPlayer.id} (${currentPlayer.name})` : 'null'}
        </Typography>
        
        <Typography variant="body2" fontWeight="bold">Connected:</Typography>
        <Typography variant="body2">{isConnected ? 'Yes' : 'No'}</Typography>
        
        <Typography variant="body2" fontWeight="bold">Loading:</Typography>
        <Typography variant="body2">{isLoading ? 'Yes' : 'No'}</Typography>
        
        <Typography variant="body2" fontWeight="bold">Error:</Typography>
        <Typography variant="body2" color="error">{error || 'None'}</Typography>
      </Box>
    </Paper>
  );
} 