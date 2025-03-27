import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Paper,
  Chip,
  Tabs,
  Tab,
  Divider,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { GameType } from '@/types/game';
import { GameSettings, LetterRaceSettings, PictureGameSettings } from '@/types/settings';
import { validateGameSettings } from '@/utils/gameValidation';
import { getDefaultSettings } from '@/constants/gameSettings';
import {
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Restore as ResetIcon
} from '@mui/icons-material';

interface GameSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  gameType: GameType;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
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
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    const validation = validateGameSettings(localSettings, gameType);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear errors when user makes changes
    setErrors([]);
  };

  const handleReset = () => {
    const defaultSettings = getDefaultSettings(gameType);
    setLocalSettings(defaultSettings);
    setErrors([]);
  };

  const settingSection = {
    mb: 3,
    p: 3,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: 'primary.main',
      boxShadow: '0 4px 12px rgba(0, 229, 255, 0.1)'
    }
  };

  const sliderStyles = {
    color: isHost ? 'primary.main' : 'text.disabled',
    '& .MuiSlider-thumb': {
      width: 20,
      height: 20,
    },
    '& .MuiSlider-rail': {
      opacity: 0.3,
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #121212 0%, #1a1a1a 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <SettingsIcon color="primary" />
        <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
          Game Settings
        </Typography>
        {!isHost && (
          <Chip
            label="View Only"
            size="small"
            color="warning"
            sx={{ ml: 'auto' }}
          />
        )}
        {isHost && (
          <Tooltip title="Reset to defaults">
            <IconButton
              onClick={handleReset}
              sx={{ ml: 'auto' }}
              color="primary"
            >
              <ResetIcon />
            </IconButton>
          </Tooltip>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {errors.length > 0 && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            icon={<WarningIcon />}
          >
            <Box>
              {errors.map((error, index) => (
                <Typography key={index} variant="body2" sx={{ mb: index < errors.length - 1 ? 1 : 0 }}>
                  {error}
                </Typography>
              ))}
            </Box>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            mb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
          centered
        >
          <Tab label="Basic Settings" />
          <Tab label={gameType === GameType.LETTER_RACE ? "Letter Race" : "Picture Game"} />
        </Tabs>

        {/* Basic Game Settings Tab */}
        {activeTab === 0 && (
          <Box sx={settingSection}>
            <Typography variant="subtitle1" sx={{
              mb: 3,
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '1px solid',
              borderColor: 'primary.main',
              pb: 1,
              display: 'inline-block'
            }}>
              Basic Game Settings
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Rounds</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}>
                    {localSettings.maxRounds}
                  </Typography>
                </Box>
                <Slider
                  min={1}
                  max={10}
                  value={localSettings.maxRounds}
                  onChange={(_, value) => handleSettingChange('maxRounds', value as number)}
                  disabled={!isHost}
                  marks
                  valueLabelDisplay="auto"
                  sx={sliderStyles}
                />
                <Typography variant="caption" color="text.secondary">
                  Choose between 1 and 10 rounds
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Time per Round</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}>
                    {localSettings.timePerRound} seconds
                  </Typography>
                </Box>
                <Slider
                  min={30}
                  max={300}
                  step={10}
                  value={localSettings.timePerRound}
                  onChange={(_, value) => handleSettingChange('timePerRound', value as number)}
                  disabled={!isHost}
                  marks={[
                    { value: 30, label: '30s' },
                    { value: 60, label: '1m' },
                    { value: 120, label: '2m' },
                    { value: 180, label: '3m' },
                    { value: 300, label: '5m' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}s`}
                  sx={sliderStyles}
                />
                <Typography variant="caption" color="text.secondary">
                  Set time limit for each round (30-300 seconds)
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Game-specific settings Tab */}
        {activeTab === 1 && gameType === GameType.LETTER_RACE && (
          <Box sx={settingSection}>
            <Typography variant="subtitle1" sx={{
              mb: 3,
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '1px solid',
              borderColor: 'primary.main',
              pb: 1,
              display: 'inline-block'
            }}>
              Letter Race Settings
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Minimum Word Length</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}>
                    {(localSettings as LetterRaceSettings).minWordLength} letters
                  </Typography>
                </Box>
                <Slider
                  min={3}
                  max={8}
                  value={(localSettings as LetterRaceSettings).minWordLength}
                  onChange={(_, value) => handleSettingChange('minWordLength', value as number)}
                  disabled={!isHost}
                  marks
                  valueLabelDisplay="auto"
                  sx={sliderStyles}
                />
                <Typography variant="caption" color="text.secondary">
                  Words must be at least this many letters long
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Letters per Round</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}>
                    {(localSettings as LetterRaceSettings).lettersPerRound} letters
                  </Typography>
                </Box>
                <Slider
                  min={2}
                  max={3}
                  value={(localSettings as LetterRaceSettings).lettersPerRound}
                  onChange={(_, value) => handleSettingChange('lettersPerRound', value as number)}
                  disabled={!isHost}
                  marks
                  valueLabelDisplay="auto"
                  sx={sliderStyles}
                />
                <Typography variant="caption" color="text.secondary">
                  Number of letters provided each round
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 1 && gameType === GameType.PICTURE_GAME && (
          <Box sx={settingSection}>
            <Typography variant="subtitle1" sx={{
              mb: 3,
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '1px solid',
              borderColor: 'primary.main',
              pb: 1,
              display: 'inline-block'
            }}>
              Picture Game Settings
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Drawing Time</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}>
                    {(localSettings as PictureGameSettings).drawTime || 60} seconds
                  </Typography>
                </Box>
                <Slider
                  min={30}
                  max={180}
                  step={10}
                  value={(localSettings as PictureGameSettings).drawTime || 60}
                  onChange={(_, value) => handleSettingChange('drawTime', value as number)}
                  disabled={!isHost}
                  marks={[
                    { value: 30, label: '30s' },
                    { value: 60, label: '1m' },
                    { value: 120, label: '2m' },
                    { value: 180, label: '3m' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}s`}
                  sx={sliderStyles}
                />
                <Typography variant="caption" color="text.secondary">
                  Time allowed for drawing (30-180 seconds)
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Guess Time</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}>
                    {(localSettings as PictureGameSettings).guessTime || 30} seconds
                  </Typography>
                </Box>
                <Slider
                  min={15}
                  max={60}
                  step={5}
                  value={(localSettings as PictureGameSettings).guessTime || 30}
                  onChange={(_, value) => handleSettingChange('guessTime', value as number)}
                  disabled={!isHost}
                  marks={[
                    { value: 15, label: '15s' },
                    { value: 30, label: '30s' },
                    { value: 45, label: '45s' },
                    { value: 60, label: '60s' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}s`}
                  sx={sliderStyles}
                />
                <Typography variant="caption" color="text.secondary">
                  Time allowed for guessing (15-60 seconds)
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={(localSettings as PictureGameSettings).useCustomPrompts || false}
                    onChange={(e) => handleSettingChange('useCustomPrompts', e.target.checked)}
                    disabled={!isHost}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Allow players to create custom prompts
                    </Typography>
                    <Tooltip title="Players can suggest their own words to draw">
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Box>
                }
                sx={{
                  opacity: isHost ? 1 : 0.6,
                  mt: 1
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        justifyContent: 'space-between'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isHost}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            px: 4,
            opacity: isHost ? 1 : 0.6,
            '&.Mui-disabled': {
              bgcolor: 'primary.main',
              color: 'white',
            }
          }}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
} 