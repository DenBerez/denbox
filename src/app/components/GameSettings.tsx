import { Box, Typography, TextField, Paper, Grid } from '@mui/material';
import { GameType, GameSettings } from '@/types/game';
import { LetterPairSettings, SpeedWordsSettings } from '@/types/settings';
import { letterPairDefaults, speedWordsDefaults, getDefaultSettings } from '@/constants/gameSettings';

interface GameSettingsProps {
    gameType: GameType;
    settings: GameSettings;
    onUpdateSettings: (settings: GameSettings) => void;
    isHost: boolean;
  }

export default function GameSettings({ 
    gameType, 
    settings, 
    onUpdateSettings, 
    isHost 
  }: GameSettingsProps) {  
  if (!isHost || !settings) return null;

  return (
    <Paper elevation={3} sx={{ 
      p: 3,
      bgcolor: 'background.paper',
      borderRadius: 2
    }}>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Game Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Basic Game Settings */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: 2, 
            height: '100%',
            bgcolor: 'background.default', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Basic Settings
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rounds"
                  type="number"
                  value={settings.maxRounds}
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    maxRounds: Math.min(Math.max(parseInt(e.target.value) || 1, 1), 10)
                  })}
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
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    timePerRound: Math.min(Math.max(parseInt(e.target.value) || 10, 10), 300)
                  })}
                  inputProps={{ min: 10, max: 300 }}
                  helperText="Time in seconds (10-300)"
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>seconds</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Player Settings */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: 2, 
            height: '100%',
            bgcolor: 'background.default', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Player Limits
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Minimum Players"
                  type="number"
                  value={settings.minPlayers}
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    minPlayers: Math.min(Math.max(parseInt(e.target.value) || 1, 1), settings.maxPlayers)
                  })}
                  inputProps={{ min: 1, max: settings.maxPlayers }}
                  helperText="At least 1 player"
                  size="small"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Maximum Players"
                  type="number"
                  value={settings.maxPlayers}
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    maxPlayers: Math.min(Math.max(parseInt(e.target.value) || settings.minPlayers, settings.minPlayers), 15)
                  })}
                  inputProps={{ min: settings.minPlayers, max: 15 }}
                  helperText="Up to 15 players"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Game-specific settings */}
        {gameType === 'LETTER_PAIR' && (
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 2,
              height: '100%',
              bgcolor: 'background.default', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Letter Pair Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Minimum Word Length"
                    type="number"
                    value={(settings as any).minWordLength}
                    onChange={(e) => onUpdateSettings({
                      ...settings,
                      minWordLength: Math.min(Math.max(parseInt(e.target.value) || 3, 3), 8)
                    })}
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
                    value={(settings as any).lettersPerRound}
                    onChange={(e) => onUpdateSettings({
                      ...settings,
                      lettersPerRound: Math.min(Math.max(parseInt(e.target.value) || 2, 2), 3)
                    })}
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

export const letterPairDefaults: LetterPairSettings = {
  maxRounds: 3,
  timePerRound: 60,
  minPlayers: 2,
  maxPlayers: 8,
  minWordLength: 4,
  lettersPerRound: 2
};

export const speedWordsDefaults: SpeedWordsSettings = {
  maxRounds: 3,
  timePerRound: 30,
  minPlayers: 2,
  maxPlayers: 4
};

export const getDefaultSettings = (gameType: string) => {
  switch (gameType) {
    case 'LETTER_PAIR':
      return letterPairDefaults;
    case 'SPEED_WORDS':
      return speedWordsDefaults;
    default:
      return letterPairDefaults;
  }
};
