import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { GameType } from '@/types/game';
import { LetterRaceSettings } from '@/types/settings';
import { validateGameSettings } from '@/utils/gameValidation';

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
  const [localSettings, setLocalSettings] = useState<LetterRaceSettings>(settings);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const validation = validateGameSettings(localSettings, gameType);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleChange = (field: keyof LetterRaceSettings, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Game Settings</DialogTitle>
      <DialogContent>
        {errors.map((error, index) => (
          <Typography key={index} color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        ))}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Max Rounds"
            type="number"
            value={localSettings.maxRounds}
            onChange={(e) => handleChange('maxRounds', parseInt(e.target.value))}
            disabled={!isHost}
          />
          <TextField
            label="Time per Round (seconds)"
            type="number"
            value={localSettings.timePerRound}
            onChange={(e) => handleChange('timePerRound', parseInt(e.target.value))}
            disabled={!isHost}
          />
          {gameType === GameType.LETTER_RACE && (
            <>
              <TextField
                label="Minimum Word Length"
                type="number"
                value={localSettings.minWordLength}
                onChange={(e) => handleChange('minWordLength', parseInt(e.target.value))}
                disabled={!isHost}
              />
              <TextField
                label="Letters per Round"
                type="number"
                value={localSettings.lettersPerRound}
                onChange={(e) => handleChange('lettersPerRound', parseInt(e.target.value))}
                disabled={!isHost}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!isHost}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
} 