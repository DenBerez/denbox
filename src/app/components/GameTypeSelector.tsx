import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
} from '@mui/material';
import { TextFields as LetterGameIcon, Timer as SpeedGameIcon } from '@mui/icons-material';
import { letterPairDefaults, speedWordsDefaults } from '@/constants/gameSettings';

interface GameType {
    id: string;
    title: string;
    description: string;
    tutorial: string;
    icon: React.ReactNode;
    defaultSettings: GameSettings;
  }

  interface GameSettings {
    maxRounds: number;
    timePerRound: number;
    minPlayers: number;
    maxPlayers: number;
    minWordLength: number;
    lettersPerRound: number;
    // Add other common settings
  }
  
  interface BaseGame {
    id: string;
    type: GameType;
    name: string;
    description: string;
    tutorial: string;
    icon: React.ReactNode;
    defaultSettings: GameSettings;
    component: React.ComponentType<GameProps>;
  }
  
  interface GameProps {
    game: any;
    player: any;
    onGameUpdate: (updatedGame: any) => void;
    settings: GameSettings;
  }

const gameTypes: GameType[] = [
  {
    id: 'LETTER_RACE',
    title: 'Letter Race',
    description: 'Find words containing specific letters in order',
    tutorial: 'You will be given letters. Find words that contain these letters in order. For example, if the letters are "STR", valid words include "STAR", "SISTER", and "MASTER".',
    icon: <LetterGameIcon sx={{ fontSize: 60 }} />,
    defaultSettings: letterPairDefaults,
  },
  {
    id: 'SPEED_WORDS',
    title: 'Speed Words',
    description: 'Coming soon - Race to type words matching specific criteria',
    icon: <SpeedGameIcon sx={{ fontSize: 60 }} />,
    defaultSettings: speedWordsDefaults,
    tutorial: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  // Add more game types here
];

interface GameTypeSelectorProps {
  onSelectGameType: (gameType: GameType) => void;
}

export default function GameTypeSelector({ onSelectGameType }: GameTypeSelectorProps) {
  const handleSelect = (gameType: GameType) => {
    onSelectGameType(gameType);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom align="center">
        Select Game Type
      </Typography>
      <Grid container spacing={3}>
        {gameTypes.map((gameType) => (
          <Grid item xs={12} sm={6} key={gameType.id}>
            <Card 
              sx={{ 
                height: '100%',
                opacity: gameType.id === 'SPEED_WORDS' ? 0.7 : 1,
              }}
            >
              <CardActionArea 
                onClick={() => gameType.id !== 'SPEED_WORDS' && handleSelect(gameType)}
                sx={{ height: '100%' }}
                disabled={gameType.id === 'SPEED_WORDS'}
              >
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 2,
                  }}>
                    {gameType.icon}
                    <Typography variant="h5" component="div">
                      {gameType.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {gameType.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 