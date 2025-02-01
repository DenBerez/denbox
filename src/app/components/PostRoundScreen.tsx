import { useState, useEffect } from 'react';
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
  Home as HomeIcon 
} from '@mui/icons-material';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { playersByGameId } from '@/graphql/queries';
import { updatePlayer } from '@/graphql/mutations';
import { Game, Player } from '@/types/game';
import { paperStyles, textGradientStyles, buttonStyles, gradients } from '@/constants/styles';
import { LetterGame } from '@/lib/games/LetterGame';

interface PostRoundScreenProps {
  game: Game;
  player: Player;
  onNextRound: () => void;
  settings: any;
  isLastRound: boolean;
}

interface ValidatedPlayerData extends Player {
  validWords: string[];
  invalidWords: string[];
  calculatedScore: number;
}

export default function PostRoundScreen({ 
  game, 
  player, 
  onNextRound, 
  settings, 
  isLastRound 
}: PostRoundScreenProps) {
  const [players, setPlayers] = useState<ValidatedPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndValidateWords = async () => {
    try {
      const result = await client.graphql({
        query: playersByGameId,
        variables: { gameId: game.id }
      });

      // Collect all unique words from all players
      const allWords = new Set<string>();
      result.data.playersByGameId.items.forEach((player: any) => {
        (player.currentWords || []).forEach((word: string) => allWords.add(word.toUpperCase()));
      });

      // Validate all unique words at once
      const response = await fetch('/api/validate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: Array.from(allWords) }),
      });

      const validWords = new Map<string, boolean>();
      const validationResults = await response.json();
      Array.from(allWords).forEach((word, index) => {
        validWords.set(word, validationResults[index]);
      });

      // Process players with validated words
      const processedPlayers = result.data.playersByGameId.items.map((player: any) => {
        const currentWords = (player.currentWords || []).map(w => w.toUpperCase());
        const validatedWords = currentWords.filter(word => validWords.get(word));
        const invalidatedWords = currentWords.filter(word => !validWords.get(word));

        // Calculate score based on validated words
        const moves = validatedWords.map((word: string) => ({
          playerId: player.id,
          value: word,
          timestamp: Date.now()
        }));

        const gameEngine = new LetterGame(game);
        const calculatedScore = gameEngine.calculateScore(moves);

        // Update player's score in database
        client.graphql({
          query: updatePlayer,
          variables: {
            input: {
              id: player.id,
              score: calculatedScore,
              currentWords: validatedWords
            }
          }
        });

        return {
          ...player,
          validWords: validatedWords,
          invalidWords: invalidatedWords,
          calculatedScore
        };
      });

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
      <Paper sx={{ ...paperStyles.default, p: 4 }}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Paper>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.calculatedScore - a.calculatedScore);

  // Modify the player list item to show valid and invalid words
  const PlayerWordList = ({ player }: { player: ValidatedPlayerData }) => (
    <Box sx={{ mt: 2 }}>
      {player.validWords.length > 0 && (
        <>
          <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
            Valid Words:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {player.validWords.map((word) => (
              <Chip
                key={word}
                label={word}
                color="success"
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </>
      )}
      
      {player.invalidWords.length > 0 && (
        <>
          <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
            Invalid Words:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {player.invalidWords.map((word) => (
              <Chip
                key={word}
                label={word}
                color="error"
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Paper elevation={3} sx={{ ...paperStyles.gradient }}>
      <Box sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              ...textGradientStyles,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            {isLastRound ? (
              <>
                <TrophyIcon fontSize="large" />
                Final Results
                <TrophyIcon fontSize="large" />
              </>
            ) : (
              <>
                <StarsIcon fontSize="large" />
                Round {game.currentRound} Results
                <StarsIcon fontSize="large" />
              </>
            )}
          </Typography>
        </Box>

        {isLastRound ? (
          <Box sx={{ mb: 4 }}>
            {/* Winner Podium */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 4,
              mb: 6,
              mt: 4
            }}>
              {/* Second Place */}
              {players[1] && (
                <Box sx={{ 
                  width: 180,
                  height: '70%',
                  bgcolor: '#C0C0C0',
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pt: 2
                }}>
                  <Box sx={{
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                    mb: 1
                  }}>
                    <Typography variant="h4">🥈</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {players[1].name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {players[1].calculatedScore} pts
                  </Typography>
                </Box>
              )}

              {/* First Place */}
              {players[0] && (
                <Box sx={{ 
                  width: 220,
                  height: '85%',
                  background: gradients.primary,
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pt: 3,
                  boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)'
                }}>
                  <Box sx={{
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    width: 70,
                    height: 70,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                    mb: 1
                  }}>
                    <Typography variant="h3">👑</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {players[0].name}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'warning.dark' }}>
                    {players[0].calculatedScore} pts
                  </Typography>
                </Box>
              )}

              {/* Third Place */}
              {players[2] && (
                <Box sx={{ 
                  width: 180,
                  height: '60%',
                  bgcolor: '#CD7F32',
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pt: 2
                }}>
                  <Box sx={{
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    width: 50,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    mb: 1
                  }}>
                    <Typography variant="h4">🥉</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {players[2].name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {players[2].calculatedScore} pts
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Remaining Players */}
            {players.length > 3 && (
              <List sx={{ mb: 4 }}>
                {players.slice(3).map((player, index) => (
                  <ListItem 
                    key={player.id}
                    sx={{
                      mb: 2,
                      ...paperStyles.default,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateX(8px)'
                      }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        mr: 2,
                        bgcolor: 'primary.main',
                        width: 40,
                        height: 40
                      }}
                    >
                      {index + 4}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                            {player.name}
                          </Typography>
                          <Chip 
                            label={`${player.calculatedScore} pts`}
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center',
              mt: 4 
            }}>
              {player?.isHost && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CelebrationIcon />}
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  sx={buttonStyles.primary}
                >
                  Start New Game
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => {
                  window.location.href = '/';
                }}
                sx={{ 
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Back to Home
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <List sx={{ mb: 4 }}>
              {sortedPlayers.map((player, index) => (
                <ListItem 
                  key={player.id}
                  sx={{
                    mb: 2,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    ...paperStyles.default
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        mr: 2,
                        bgcolor: index === 0 ? 'warning.main' : 'primary.main'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                      {player.name}
                    </Typography>
                    <Chip 
                      label={`${player.calculatedScore} pts`}
                      color={index === 0 ? "warning" : "primary"}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <PlayerWordList player={player} />
                </ListItem>
              ))}
            </List>

            {player?.isHost && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={onNextRound}
                  sx={buttonStyles.primary}
                >
                  Next Round
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
} 