import { useState, KeyboardEvent } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { updatePlayer } from '@/graphql/mutations';
import { Player } from '@/types/game';
import { paperStyles, buttonStyles, textGradientStyles } from '@/constants/styles';
import { Edit as EditIcon } from '@mui/icons-material';

interface PlayerNameInputProps {
  player: Player;
  onNameUpdate?: (newName: string) => void;
}

export default function PlayerNameInput({ player, onNameUpdate }: PlayerNameInputProps) {
  const [playerName, setPlayerName] = useState(player?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateName = async () => {
    console.log('PlayerNameInput handleUpdateName called');
    console.log('PlayerNameInput player:', player);
    console.log('PlayerNameInput playerName:', playerName);
    if (!player || !playerName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            name: playerName.trim(),
            isConfirmed: true
          }
        }
      });

      console.log('PlayerNameInput result:', result);
      
      if (onNameUpdate) {
        onNameUpdate(result.data.updatePlayer.name);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error updating player name:', error);
      setError('Failed to update name');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && playerName.trim() && playerName !== player?.name) {
      handleUpdateName();
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      background: 'linear-gradient(135deg, #FF5252 0%, #FF9800 20%, #FFEB3B 40%, #4CAF50 60%, #2196F3 80%, #9C27B0 100%)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <Box sx={{ 
        p: 3, 
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(5px)'
      }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            background: 'linear-gradient(90deg, #FF5252, #FF9800, #FFEB3B, #4CAF50, #2196F3, #9C27B0)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            fontWeight: 600 
          }}
        >
          Choose Your Name
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          alignItems: 'flex-start'
        }}>
          <TextField
            fullWidth
            label="Your Name"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            variant="outlined"
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#4CAF50', // Green from our ROYGBV palette
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2196F3', // Blue from our ROYGBV palette
                }
              },
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleUpdateName}
            disabled={!playerName.trim() || playerName === player?.name || isSubmitting}
            startIcon={<EditIcon />}
            sx={{
              background: 'linear-gradient(90deg, #FF5252, #FF9800)',
              '&:hover': {
                background: 'linear-gradient(90deg, #FF9800, #FF5252)',
              },
              height: 56, // Match TextField height
              whiteSpace: 'nowrap'
            }}
          >
            {isSubmitting ? 'Updating...' : 'Update Name'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 