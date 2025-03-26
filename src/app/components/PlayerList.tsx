'use client';

import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Paper, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Fade, 
  Avatar, 
  Tooltip 
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useEffect, useState, useRef } from 'react';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { playersByGameId } from '@/graphql/queries';
import { updatePlayer } from '@/graphql/mutations';
import { Player } from '@/types/game';
import { paperStyles, scrollbarStyles, textGradientStyles, buttonStyles } from '@/constants/styles';
import { graphqlWithRetry } from '@/utils/apiClient';
import { WebSocketService } from '@/services/WebSocketService';
import { getCurrentUser } from 'aws-amplify/auth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGameState } from '@/providers/GameStateProvider';
// Add colorful avatar backgrounds
const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#F1C40F', '#2ECC71'
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface PlayerListProps {
  gameId: string;
  currentPlayer: Player;
  onPlayersUpdate?: (players: Player[]) => void;
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  onSave: (newName: string) => Promise<void>;
}

function EditNameDialog({ open, onClose, player, onSave }: EditDialogProps) {
  const [name, setName] = useState(player?.name || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(player?.name || '');
    setError(null);
  }, [player]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    await onSave(name.trim());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
      PaperProps={{
        sx: {
          ...paperStyles.default,
          maxHeight: '90vh',
          ...scrollbarStyles
        }
      }}
    >
      <DialogTitle>Edit Player Name</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Your Name"
          fullWidth
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={buttonStyles.primary}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const PlayerList = ({ gameId, currentPlayer, onPlayersUpdate }: PlayerListProps) => {
  const { players, isConnected, sendMessage } = useGameState();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add effect to propagate player updates to parent
  useEffect(() => {
    console.log('PlayerList received players update:', players);
    if (players.length > 0) {
      onPlayersUpdate?.(players);
    }
  }, [players, onPlayersUpdate]);

  useEffect(() => {
    console.log('PlayerList state:', {
      currentPlayer: currentPlayer?.id,
      playersCount: players.length,
      players: players.map(p => ({ id: p.id, name: p.name }))
    });
  }, [currentPlayer, players]);

  const handleUpdateName = async (newName: string) => {
    if (!editingPlayer || !isConnected) return;

    try {
      // First update in database
      const result = await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: editingPlayer.id,
            name: newName,
            isConfirmed: true
          }
        }
      });

      // Then broadcast via WebSocket
      await sendMessage({
        type: 'PLAYER_UPDATE',
        gameId,
        data: result.data.updatePlayer
      });
    } catch (error) {
      console.error('Error updating player name:', error);
      setError('Failed to update name');
    }
  };

  const handleHostStatus = (players: Player[]) => {
    const firstPlayer = players[0];
    if (!firstPlayer || !currentPlayer) return;
    
    if (currentPlayer.id === firstPlayer.id && !currentPlayer.isHost) {
      client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: currentPlayer.id,
            isHost: true
          }
        }
      });
    }
  };

  const processPayers = (players: Player[]) => {
    const sortedPlayers = players
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Ensure first player is host
    const processedPlayers = sortedPlayers.map((player, index) => ({
      ...player,
      isHost: index === 0 || player.isHost
    }));

    // Remove duplicates while preserving host status
    return Array.from(
      new Map(
        processedPlayers.map(player => [player.id, player])
      ).values()
    );
  };

  return (
    <Paper elevation={3} sx={{ ...paperStyles.gradient }}>
      <Typography variant="h2" sx={{ 
        mb: 3,
        ...textGradientStyles,
        fontWeight: 700
      }}>
        Players ({players.length})
      </Typography>
      
      <List sx={{ 
        maxHeight: '400px',
        overflowY: 'auto',
        ...scrollbarStyles
      }}>
        {players.map((player, index) => (
          <ListItem
            key={player.id}
            secondaryAction={
              currentPlayer?.id === player.id && (
                <Tooltip title="Edit Name">
                  <IconButton 
                    edge="end" 
                    onClick={() => setEditingPlayer(player)}
                    sx={{ 
                      color: 'primary.main',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#21CBF3'
                      }
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )
            }
            sx={{
              borderRadius: 2,
              mb: 1,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              transform: 'translateX(-20px)',
              opacity: 0,
              animation: 'slideIn 0.3s ease forwards',
              animationDelay: `${index * 0.1}s`,
              '&:hover': {
                transform: 'translateX(8px)',
                bgcolor: 'rgba(33, 150, 243, 0.1)',
                borderColor: 'primary.main',
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: avatarColors[index % avatarColors.length],
                mr: 2,
                transition: 'transform 0.2s ease'
              }}
            >
              {getInitials(player.name)}
            </Avatar>
            <ListItemText 
              primary={
                <Typography variant="body1" sx={{ 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  {player.name}
                  {player.isHost && (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      HOST
                    </Box>
                  )}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>

      <EditNameDialog
        open={!!editingPlayer}
        onClose={() => setEditingPlayer(null)}
        player={editingPlayer}
        onSave={handleUpdateName}
      />

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes slideIn {
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </Paper>
  );
};

export default PlayerList;