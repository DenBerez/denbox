import { useState } from 'react';
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

  const handleUpdateName = async () => {
    if (!player || !playerName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
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
      
      if (onNameUpdate) {
        onNameUpdate(result.data.updatePlayer.name);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error updating player name:', error);
      setError('Failed to update name');
    }
  };

  return (
    <Paper elevation={3} sx={{ ...paperStyles.gradient }}>
      <Box sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            ...textGradientStyles,
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
            variant="outlined"
            error={!!error}
            helperText={error}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleUpdateName}
            disabled={!playerName.trim() || playerName === player?.name}
            startIcon={<EditIcon />}
            sx={{
              ...buttonStyles.primary,
              height: 56, // Match TextField height
              whiteSpace: 'nowrap'
            }}
          >
            Update Name
          </Button>
        </Box>
      </Box>
    </Paper>
  );
} 