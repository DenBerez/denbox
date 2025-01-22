import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  Stars as StarsIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { generateClient } from 'aws-amplify/api';
import { playersByGameId } from '@/graphql/queries';
import { Game, Player } from '@/types/game';
import { GameSettings } from '@/types/settings';
import { LetterGame } from '@/lib/games/LetterGame';
import { wordCache } from '@/lib/wordCache';

const client = generateClient();

// Add rate limiting configuration
const BATCH_SIZE = 5; // Number of words to validate at once
const BATCH_DELAY = 1000; // Delay between batches in ms

interface PostRoundScreenProps {
  game: any;
  player: any;
  onNextRound: () => void;
  settings: any;
  isLastRound: boolean;
}

interface WordValidation {
  word: string;
  isValid: boolean;
  isValidDictionary: boolean;
  score: number;
}

interface PlayerScore {
  id: string;
  name: string;
  words: WordValidation[];
  score: number;
}

export default function PostRoundScreen({ 
  game, 
  player, 
  onNextRound, 
  settings, 
  isLastRound 
}: PostRoundScreenProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gameEngine = useMemo(() => new LetterGame(game), [game]);

  const fetchAndValidateWords = async () => {
    try {
      console.log('Starting fetchAndValidateWords');
      
      // Fetch all players for this game
      const result = await client.graphql({
        query: playersByGameId,
        variables: { gameId: game.id }
      });

      console.log('Raw player data from query:', result.data.playersByGameId.items);

      // Process each player's words and calculate scores
      const processedPlayers = await Promise.all(
        result.data.playersByGameId.items.map(async (player: any) => {
          console.log('Processing player', player.name + ':', {
            id: player.id,
            currentWords: player.currentWords,
            score: player.score
          });

          // Create moves array for score calculation
          const moves = (player.currentWords || []).map((word: string) => ({
            playerId: player.id,
            value: word,
            timestamp: Date.now()
          }));

          // Calculate score using game engine
          const score = gameEngine.calculateScore(moves);

          return {
            ...player,
            calculatedScore: score
          };
        })
      );

      setPlayers(processedPlayers);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchAndValidateWords:', error);
      setError('Failed to load round results');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndValidateWords();
  }, [game.id]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        p: 4,
        gap: 2 
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Calculating scores...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'error.dark' }}>
        <Typography color="error.contrastText" align="center">
          {error}
        </Typography>
      </Paper>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.calculatedScore - a.calculatedScore);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4,
        mb: 3,
        background: 'linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            color: 'primary.main',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <StarsIcon fontSize="large" />
          Round {game.currentRound} Results
          <StarsIcon fontSize="large" />
        </Typography>
      </Box>

      <List sx={{ mb: 4 }}>
        {sortedPlayers.map((player, index) => (
          <ListItem 
            key={player.id}
            sx={{
              mb: 2,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateX(8px)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                mr: 2,
                bgcolor: index === 0 ? 'warning.main' : 'primary.main',
                width: 40,
                height: 40
              }}
            >
              {index === 0 ? <TrophyIcon /> : (index + 1)}
            </Avatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                    {player.name}
                  </Typography>
                  <Chip 
                    label={`Score: ${player.calculatedScore}`}
                    color={index === 0 ? "warning" : "primary"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              }
              secondary={
                <Typography 
                  variant="body2" 
                  component="div"
                  color="text.secondary"
                >
                  Words: {player.currentWords?.join(', ') || 'No words submitted'}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>

      {player?.isHost && !isLastRound && (
        <Button
          variant="contained"
          color="primary"
          onClick={onNextRound}
          fullWidth
          size="large"
          startIcon={<CelebrationIcon />}
          sx={{ 
            mt: 2,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.02)'
            }
          }}
        >
          Start Next Round
        </Button>
      )}

      {isLastRound && (
        <Box sx={{ 
          textAlign: 'center', 
          mt: 4,
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'warning.main'
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: 'warning.main',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 4
            }}
          >
            <TrophyIcon fontSize="large" />
            Game Over!
            <TrophyIcon fontSize="large" />
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
              Final Rankings
            </Typography>
            
            {sortedPlayers.map((player, index) => (
              <Paper
                key={player.id}
                elevation={3}
                sx={{
                  p: 2,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: index === 0 
                    ? 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)'
                    : index === 1
                    ? 'linear-gradient(45deg, #C0C0C0 30%, #A9A9A9 90%)'
                    : index === 2
                    ? 'linear-gradient(45deg, #CD7F32 30%, #8B4513 90%)'
                    : 'background.paper',
                  color: index <= 2 ? 'black' : 'inherit'
                }}
              >
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: index === 0 
                      ? 'warning.main'
                      : index === 1
                      ? 'grey.400'
                      : index === 2
                      ? '#CD7F32'
                      : 'primary.main',
                    border: '2px solid',
                    borderColor: 'background.paper'
                  }}
                >
                  {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {player.name}
                  </Typography>
                  <Typography variant="body2">
                    Total Score: {player.calculatedScore}
                  </Typography>
                </Box>
                {index === 0 && (
                  <Chip
                    icon={<StarsIcon />}
                    label="Winner!"
                    color="warning"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Paper>
            ))}
          </Box>

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            mt: 4 
          }}>
            {player?.isHost && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CelebrationIcon />}
                onClick={() => {
                  window.location.href = '/';
                }}
                sx={{ 
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
              >
                Start New Game
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => {
                window.location.href = '/';
              }}
              sx={{ 
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              Back to Home
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
} 