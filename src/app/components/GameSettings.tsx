import { Box, Typography, TextField, Paper, Grid } from '@mui/material';
import { GameType } from '@/types/game';
import { LetterRaceSettings } from '@/types/settings';
import { getDefaultSettings, letterRaceDefaults } from '@/constants/gameSettings';

interface GameSettingsProps {
  gameType: GameType;
  settings: LetterRaceSettings;
  onUpdateSettings: (settings: LetterRaceSettings) => void;
  isHost: boolean;
}

export default function GameSettings({ 
  gameType, 
  settings, 
  onUpdateSettings, 
  isHost 
}: GameSettingsProps) {  
  if (!isHost || !settings) return null;

  const handleSettingChange = (key: keyof LetterRaceSettings, value: number) => {
    const newSettings = { ...settings };
    newSettings[key] = value;
    onUpdateSettings(newSettings);
  };

  console.log('settings', settings);
  console.log('gameType', gameType);

  return (
    <Paper elevation={3} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h2" sx={{ mb: 3 }}>Game Settings</Typography>
      
      <Grid container spacing={3}>
        {/* Basic Game Settings */}
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, height: '100%', bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Basic Game Settings</Typography>
            
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
          <Box sx={{ p: 2, height: '100%', bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Player Settings</Typography>

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
            <Box sx={{ p: 2, height: '100%', bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Letter Race Settings</Typography>
              
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
    </Paper>
  );
}


