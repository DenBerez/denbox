import { Paper, Typography, Box } from '@mui/material';
import { Game, GameType } from '@/types/game';
import Link from 'next/link';
import { paperStyles, textGradientStyles, gradients } from '@/constants/styles';

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
    <Paper elevation={3} sx={{ 
      ...paperStyles.gradient,
      mb: 3,
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: { xs: 2, sm: 3 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: 'row',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 2, sm: 3 }
          }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Box 
                component="img"
                src="/simpleBox.png"
                alt="Denbox Logo"
                sx={{ 
                  width: { xs: 40, sm: 60 },
                  height: 'auto',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)'
                  }
                }}
              />
            </Link>
            <Typography variant="h2" sx={{ 
              fontSize: { xs: '1.75rem', sm: '3rem' },
              ...textGradientStyles
            }}>
              {game.code}
            </Typography>
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 500,
              px: 2,
              py: 1,
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
              bgcolor: 'rgba(0, 229, 255, 0.1)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.dark',
              whiteSpace: 'nowrap'
            }}
          >
            {game.status}
          </Typography>
        </Box>

        {game.gameType && (
          <Box sx={{ 
            textAlign: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: { xs: 2, sm: 3 },
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.5rem', sm: '2rem' },
                ...textGradientStyles,
                mb: 1
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
                lineHeight: 1.6,
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}
            >
              {gameTypeInfo[game.gameType]?.description}
            </Typography>
          </Box>
        )}
        
        {showRoundInfo && game.gameType && (
          <Typography 
            sx={{ 
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 3,
            }}
          >
            <Box component="span" sx={{ 
              color: 'primary.main',
              fontWeight: 600 
            }}>
              Round {game.currentRound}
            </Box>
            of
            <Box component="span" sx={{ 
              color: 'primary.main',
              fontWeight: 600 
            }}>
              {game.maxRounds}
            </Box>
          </Typography>
        )}
      </Box>
    </Paper>
  );
} 