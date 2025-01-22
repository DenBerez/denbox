import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import GameSettings from './GameSettings';
import { GameType } from '@/types/game';
import { LetterRaceSettings } from '@/types/settings';
import { paperStyles, scrollbarStyles, buttonStyles } from '@/constants/styles';

interface GameSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  gameType: GameType;
  settings: LetterRaceSettings;
  onUpdateSettings: (settings: LetterRaceSettings) => void;
  isHost: boolean;
}

export default function GameSettingsDialog({
  open,
  onClose,
  gameType,
  settings,
  onUpdateSettings,
  isHost
}: GameSettingsDialogProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...paperStyles.default,
          maxHeight: '90vh',
          ...scrollbarStyles
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        Game Settings
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <GameSettings
          gameType={gameType}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          isHost={isHost}
          showTitle={false}
        />
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid',
        borderColor: 'divider',
        p: 2,
        gap: 1
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: 100
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            ...buttonStyles.primary,
            minWidth: 100
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
} 