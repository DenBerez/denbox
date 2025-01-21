import { Paper, Typography, Box } from '@mui/material';
import { Game, GameType } from '@/types/game';

interface GameHeaderProps {
  game: Game;
  showRoundInfo?: boolean;
}

const gameTypeInfo = {
  [GameType.LETTER_RACE]: {
    title: 'Letter Race',
    description: 'Find words containing specific letters in order'
  },
  [GameType.SPEED_WORDS]: {
    title: 'Speed Words',
    description: 'Race to type words matching specific criteria'
  }
};

export default function GameHeader({ game, showRoundInfo = false }: GameHeaderProps) {
  return (
    <>
      <Paper elevation={3} sx={{ 
        p: 3, 
        mb: 3,
        bgcolor: 'background.paper',
        borderRadius: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="h2">
            Game Code: {game.code}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 500
            }}
          >
            {game.status}
          </Typography>
        </Box>
        
        {showRoundInfo && game.gameType && (
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Round: {game.currentRound} / {game.maxRounds}
          </Typography>
        )}
      </Paper>

      {game.gameType && (
        <Box sx={{ 
          textAlign: 'center',
          p: 4,
          mb: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 1
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              mb: 3
            }}
          >
            {gameTypeInfo[game.gameType]?.title}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            {gameTypeInfo[game.gameType]?.description}
          </Typography>
        </Box>
      )}
    </>
  );
} 