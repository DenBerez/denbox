import { Box, Typography, TextField, Grid } from '@mui/material';
import { GameType } from '@/types/game';
import { LetterRaceSettings } from '@/types/settings';
import { getDefaultSettings, letterRaceDefaults } from '@/constants/gameSettings';
import { paperStyles, textGradientStyles } from '@/constants/styles';

interface GameSettingsProps {
  gameType: GameType;
  settings: LetterRaceSettings;
  onUpdateSettings: (settings: LetterRaceSettings) => void;
  isHost: boolean;
  showTitle?: boolean;
}

export default function GameSettings({ 
  gameType, 
  settings, 
  onUpdateSettings, 
  isHost,
  showTitle = true
}: GameSettingsProps) {  
  if (!isHost || !settings) return null;

  const handleSettingChange = (key: keyof LetterRaceSettings, value: number) => {
    const newSettings = { ...settings };
    newSettings[key] = value;
    onUpdateSettings(newSettings);
  };

  const settingBox = {
    p: 2,
    height: '100%',
    bgcolor: 'background.paper',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    transition: 'border-color 0.2s ease',
    '&:hover': {
      borderColor: 'primary.main',
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {showTitle && (
        <Typography variant="h2" sx={{ 
          mb: 3,
          ...textGradientStyles
        }}>
          Game Settings
        </Typography>
      )}
      
      <Grid container spacing={3}>
        {/* Basic Game Settings */}
        <Grid item xs={12} md={6}>
          <Box sx={settingBox}>
            <Typography variant="subtitle1" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main'
            }}>
              Basic Game Settings
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rounds"
                  type="number"
                  value={settings.maxRounds}
                  onChange={(e) => handleSettingChange('maxRounds', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Choose between 1 and 10 rounds"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Time per Round"
                  type="number"
                  value={settings.timePerRound}
                  onChange={(e) => handleSettingChange('timePerRound', parseInt(e.target.value))}
                  inputProps={{ min: 10, max: 300 }}
                  helperText="Time in seconds (10-300)"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Player Settings */}
        <Grid item xs={12} md={6}>
          <Box sx={settingBox}>
            <Typography variant="subtitle1" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main'
            }}>
              Player Settings
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Min Players"
                  type="number"
                  value={settings.minPlayers}
                  onChange={(e) => handleSettingChange('minPlayers', parseInt(e.target.value))}
                  inputProps={{ min: 2, max: 8 }}
                  helperText="Minimum number of players (2-8)"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Max Players"
                  type="number"
                  value={settings.maxPlayers}
                  onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                  inputProps={{ min: 2, max: 8 }}
                  helperText="Maximum number of players (2-8)"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Game-specific settings */}
        {gameType === GameType.LETTER_RACE && (
          <Grid item xs={12} md={6}>
            <Box sx={settingBox}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                color: 'primary.main'
              }}>
                Letter Race Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Minimum Word Length"
                    type="number"
                    value={settings.minWordLength}
                    onChange={(e) => handleSettingChange('minWordLength', parseInt(e.target.value))}
                    inputProps={{ min: 3, max: 8 }}
                    helperText="Words must be 3-8 letters long"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Letters per Round"
                    type="number"
                    value={settings.lettersPerRound}
                    onChange={(e) => handleSettingChange('lettersPerRound', parseInt(e.target.value))}
                    inputProps={{ min: 2, max: 3 }}
                    helperText="Number of letters provided (2-3)"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}


