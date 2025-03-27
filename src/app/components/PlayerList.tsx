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
import { Player } from '@/types/game';
import { paperStyles, scrollbarStyles, textGradientStyles, buttonStyles } from '@/constants/styles';
import { useGameState } from '@/providers/GameStateProvider';
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer';
import { updatePlayer } from '@/graphql/mutations';
import { amplifyClient as client } from '@/utils/amplifyClient';

// Add colorful avatar backgrounds in rainbow order
const avatarColors = [
  // Reds to Oranges (warm colors)
  '#FF3B30', // Bright red
  '#FF9500', // Orange
  '#FF7A5A', // Coral
  '#FFCC00', // Amber

  // Yellows to Greens (transition colors)
  '#FFEB3B', // Yellow
  '#CDDC39', // Lime
  '#8BC34A', // Light green
  '#4CAF50', // Green

  // Teals to Blues (cool colors)
  '#009688', // Teal
  '#00BCD4', // Cyan
  '#03A9F4', // Light blue
  '#2196F3', // Blue

  // Indigos to Purples (deep cool colors)
  '#3F51B5', // Indigo
  '#673AB7', // Deep purple
  '#9C27B0', // Purple
  '#E040FB', // Magenta

  // Pinks to Magentas (circling back to warm)
  '#F06292', // Pink
  '#E91E63', // Bright pink
  '#D81B60', // Dark pink
  '#C2185B'  // Deep magenta
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
  currentPlayer?: Player; // Make this optional
  onPlayersUpdate?: (players: Player[]) => void;
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  onSave: (newName: string, avatarColor: string) => Promise<void>;
}

function EditNameDialog({ open, onClose, player, onSave }: EditDialogProps) {
  const [name, setName] = useState(player?.name || '');
  const [selectedColor, setSelectedColor] = useState(player?.avatarColor || avatarColors[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(player?.name || '');
    setSelectedColor(player?.avatarColor || avatarColors[0]);
    setError(null);
  }, [player]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    await onSave(name.trim(), selectedColor);
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
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          error={!!error}
          helperText={error}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Avatar Color
        </Typography>

        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center'
        }}>
          {avatarColors.map((color) => (
            <Box
              key={color}
              onClick={() => setSelectedColor(color)}
              sx={{
                width: 40,
                height: 40,
                bgcolor: color,
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                border: '3px solid',
                borderColor: selectedColor === color ? 'primary.main' : 'transparent',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            />
          ))}
        </Box>

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2
        }}>
          <Avatar
            sx={{
              bgcolor: selectedColor,
              width: 60,
              height: 60,
              fontSize: '1.5rem',

            }}
          >{""}</Avatar>
        </Box>
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

const PlayerList = ({ gameId, currentPlayer: propCurrentPlayer, onPlayersUpdate }: PlayerListProps) => {
  const { players } = useGameState();
  const hookCurrentPlayer = useCurrentPlayer(); // Get current player from hook
  const currentPlayer = propCurrentPlayer || hookCurrentPlayer; // Use prop if available, otherwise use hook

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playersRef = useRef<Player[]>([]);

  // Add effect to propagate player updates to parent, but only when they actually change
  useEffect(() => {
    // Only update if the players array has actually changed in a meaningful way
    if (players.length > 0 &&
      (playersRef.current.length !== players.length ||
        !playersRef.current.every(p =>
          players.some(newP => newP.id === p.id && newP.name === p.name && newP.isHost === p.isHost)))) {

      console.log('PlayerList propagating players update:', players);
      playersRef.current = [...players];
      onPlayersUpdate?.(players);
    }
  }, [players, onPlayersUpdate]);

  useEffect(() => {
    console.log('PlayerList state:', {
      currentPlayer: currentPlayer?.id,
      hookCurrentPlayer: hookCurrentPlayer?.id,
      propCurrentPlayer: propCurrentPlayer?.id,
      playersCount: players.length,
      players: players.map(p => ({ id: p.id, name: p.name }))
    });
  }, [currentPlayer, hookCurrentPlayer, propCurrentPlayer, players]);

  const handleUpdateName = async (newName: string, avatarColor: string) => {
    console.log('PlayerList handleUpdateName called');
    console.log('PlayerList editingPlayer:', editingPlayer);
    console.log('PlayerList newName:', newName);
    console.log('PlayerList avatarColor:', avatarColor);

    if (!editingPlayer) return;

    try {
      // Update player via GraphQL mutations
      const result = await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: editingPlayer.id,
            name: newName,
            avatarColor: avatarColor,
            isConfirmed: true
          }
        }
      });

      console.log('PlayerList handleUpdateName result:', result);
    } catch (error) {
      console.error('Error updating player name:', error);
      setError('Failed to update profile');
    }
  };

  return (
    <Paper elevation={3} sx={{
      ...paperStyles.gradient,
      width: '100%',
      minHeight: '200px', // Ensure minimum height
    }}>
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
        width: '100%', // Ensure full width
        ...scrollbarStyles
      }}>
        {players.map((player, index) => (
          <ListItem
            key={player.id}
            secondaryAction={
              currentPlayer?.id === player.id && (
                <Tooltip title="Edit Profile">
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
              width: '100%', // Ensure full width
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
                bgcolor: player.avatarColor || avatarColors[index % avatarColors.length],
                mr: 2,
                transition: 'transform 0.2s ease'
              }}
            >{""}</Avatar>
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