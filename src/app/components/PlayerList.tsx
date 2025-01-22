import { Box, List, ListItem, ListItemText, Typography, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Fade } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { playersByGameId } from '@/graphql/queries';
import { updatePlayer } from '@/graphql/mutations';
import { onCreatePlayerByGameId, onUpdatePlayerByGameId } from '@/graphql/subscriptions';
import { Player } from '@/types/game';

const client = generateClient();

interface PlayerListProps {
  gameId: string;
  currentPlayer: Player;
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  player: Player;
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
      TransitionProps={{
        timeout: 300
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        },
        '& .MuiDialog-paper': {
          position: 'fixed',
          margin: 0,
          maxWidth: '500px',
          width: '90%'
        }
      }}
      keepMounted
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
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PlayerList({ gameId, currentPlayer }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    fetchPlayers();
    
    const createSub = client.graphql({
      query: onCreatePlayerByGameId,
      variables: { gameId }
    }).subscribe({
      next: ({ data }) => {
        if (data?.onCreatePlayerByGameId) {
          setPlayers(prev => [...prev, data.onCreatePlayerByGameId]);
        }
      },
      error: (error) => console.error('Subscription error:', error),
    });

    const updateSub = client.graphql({
      query: onUpdatePlayerByGameId,
      variables: { gameId }
    }).subscribe({
      next: ({ data }) => {
        if (data?.onUpdatePlayerByGameId) {
          setPlayers(prev => 
            prev.map(p => p.id === data.onUpdatePlayerByGameId.id ? data.onUpdatePlayerByGameId : p)
          );
        }
      },
      error: (error) => console.error('Subscription error:', error),
    });

    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
    };
  }, [gameId]);

  const fetchPlayers = async () => {
    try {
      const result = await client.graphql({
        query: playersByGameId,
        variables: { gameId }
      });
      
      if (result.data?.playersByGameId?.items) {
        setPlayers(result.data.playersByGameId.items);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleUpdateName = async (newName: string) => {
    if (!editingPlayer) return;

    try {
      await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: editingPlayer.id,
            name: newName,
            isConfirmed: true
          }
        }
      });
    } catch (error) {
      console.error('Error updating player name:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 3,
      bgcolor: 'background.paper',
      borderRadius: 2
    }}>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Players ({players.length})
      </Typography>
      
      <List>
        {players.map((player) => (
          <ListItem
            key={player.id}
            secondaryAction={
              currentPlayer?.id === player.id && (
                <IconButton 
                  edge="end" 
                  onClick={() => setEditingPlayer(player)}
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon />
                </IconButton>
              )
            }
            sx={{
              borderRadius: 1,
              minHeight: '60px',
              '&:hover': {
                bgcolor: 'background.default'
              }
            }}
          >
            <ListItemText 
              primary={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {player.name}
                </Typography>
              }
              secondary={player.isHost ? '(Host)' : ''}
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
    </Paper>
  );
}
