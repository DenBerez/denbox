import { useState } from 'react';
import { Box, TextField, Button, Paper } from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { updatePlayer } from '@/graphql/mutations';

const client = generateClient();

interface PlayerNameInputProps {
  player: any;
  onNameUpdate?: (newName: string) => void;
}

export default function PlayerNameInput({ player, onNameUpdate }: PlayerNameInputProps) {
  const [playerName, setPlayerName] = useState(player?.name || '');

  const handleUpdateName = async () => {
    if (!player || !playerName.trim()) return;
    
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
    } catch (error) {
      console.error('Error updating player name:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          variant="outlined"
        />
        <Button 
          variant="contained" 
          onClick={handleUpdateName}
          disabled={!playerName.trim() || playerName === player?.name}
        >
          Update Name
        </Button>
      </Box>
    </Paper>
  );
} 