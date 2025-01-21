import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Check as ValidIcon, Close as InvalidIcon } from '@mui/icons-material';
import { generateClient } from 'aws-amplify/api';
import { playersByGameId } from '@/graphql/queries';

const client = generateClient();

interface PostRoundScreenProps {
  game: any;
  player: any;
  onNextRound: () => void;
  settings: any;
  isLastRound: boolean;
}

interface ValidatedWord {
  word: string;
  isValid: boolean;
}

interface PlayerScore {
  id: string;
  name: string;
  words: ValidatedWord[];
  score: number;
}

export default function PostRoundScreen({ game, player, onNextRound, settings, isLastRound }: PostRoundScreenProps) {
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAndValidateWords();
  }, [game.id]);

  const fetchAndValidateWords = async () => {
    try {
      const result = await client.graphql({
        query: playersByGameId,
        variables: { gameId: game.id }
      });

      const playerData = result.data.playersByGameId.items;
      
      // Validate all words for all players
      const validatedPlayers = await Promise.all(
        playerData.map(async (p: any) => {
          const validatedWords = await validateWords(p.currentWords || []);
          const score = validatedWords.filter(w => w.isValid).length;
          
          return {
            id: p.id,
            name: p.name,
            words: validatedWords,
            score: score
          };
        })
      );

      // Sort players by score in descending order
      const sortedPlayers = validatedPlayers.sort((a, b) => b.score - a.score);
      setPlayers(sortedPlayers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
    }
  };

  const validateWords = async (words: string[]) => {
    try {
      const response = await fetch('/api/validate-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate words');
      }

      const validations = await response.json();
      return words.map((word, index) => ({
        word,
        isValid: validations[index]
      }));
    } catch (error) {
      console.error('Error validating words:', error);
      return words.map(word => ({
        word,
        isValid: false
      }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Round {game.currentRound} Results
      </Typography>

      {players.map((p, index) => (
        <Box key={p.id} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            #{index + 1} - {p.name} - Score: {p.score}
            {index === 0 && <span> 👑</span>}
          </Typography>
          <List dense>
            {p.words.map((word, wordIndex) => (
              <ListItem key={wordIndex}>
                <ListItemIcon>
                  {word.isValid ? 
                    <ValidIcon color="success" /> : 
                    <InvalidIcon color="error" />
                  }
                </ListItemIcon>
                <ListItemText primary={word.word} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
        </Box>
      ))}

      {player.isHost && !isLastRound && (
        <Button
          variant="contained"
          onClick={onNextRound}
          fullWidth
          sx={{ mt: 2 }}
        >
          Start Next Round
        </Button>
      )}
    </Paper>
  );
} 