import { BaseGame, GameMove, GameState } from '../BaseGame';
import { GameSettings, LetterRaceSettings } from '@/types/settings';
import { GameStatus } from '@/types/game';
import { generateClient } from 'aws-amplify/api';
import { updatePlayer } from '@/graphql/mutations';

const client = generateClient();

/**
 * LetterGame implements word-finding gameplay where players must find words containing
 * specific letters in sequence. Features include:
 * - Validates words contain required letters in correct order
 * - Configurable minimum word length and letters per round
 * - Basic scoring based on number of valid words found
 * - Generates random letter sequences for each round
 * - Extends BaseGame with letter-specific game logic
 */

export class LetterGame extends BaseGame {
  private letters: string[];
  private validWords: Set<string> = new Set();

  constructor(initialState: GameState) {
    super(initialState);
    this.letters = (initialState.currentLetters || '').split('');
  }

  validateMove(move: GameMove): boolean {
    const word = move.value.toUpperCase();
    const settings = this.settings as LetterRaceSettings;

    // Check minimum word length
    if (word.length < settings.minWordLength) {
      return false;
    }

    // Convert required letters to uppercase for comparison
    const requiredLetters = this.letters.map(l => l.toUpperCase());
    
    let currentIndex = -1;
    
    // Check each required letter in sequence
    for (const requiredLetter of requiredLetters) {
      // Find the next occurrence of the required letter after the current position
      const nextIndex = word.indexOf(requiredLetter, currentIndex + 1);
      
      // If letter not found after current position, validation fails
      if (nextIndex === -1) {
        return false;
      }
      
      // Update current position to this letter's position
      currentIndex = nextIndex;
    }

    return true;
  }

  calculateScore(moves: GameMove[]): number {
    if (!moves || !moves.length) return 0;
    
    return moves.reduce((score, move) => {
      const word = move.value;
      if (!word) return score;
      
      // Base score calculation
      let wordScore = 1; // Base score for any valid word
      
      // Bonus points for longer words
      if (word.length >= 6) wordScore += 2;
      if (word.length >= 8) wordScore += 2;
      
      return score + wordScore;
    }, 0);
  }

  getGameSpecificSettings(): Partial<GameSettings> {
    return {
      minWordLength: 4,
      lettersPerRound: 2
    };
  }

  generateLetters(): string {
    const settings = this.settings as LetterRaceSettings;
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    
    for (let i = 0; i < settings.lettersPerRound; i++) {
      result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    }
    
    return result;
  }

  async startNewRound(): Promise<void> {
    const newLetters = this.generateLetters();
    
    await this.updateGameState({
      currentLetters: newLetters,
      timeRemaining: this.settings.timePerRound,
      status: GameStatus.PLAYING,
      roundStartTime: new Date().toISOString()
    });
  }

  async endRound(): Promise<void> {
    await this.updateGameState({
      status: GameStatus.ROUND_END
    });
  }

  getValidWords(): string[] {
    return Array.from(this.validWords);
  }

  async submitMove(move: GameMove): Promise<boolean> {
    if (!this.validateMove(move)) {
      return false;
    }

    try {
      const player = this.state.players.find(p => p.id === move.playerId);
      if (!player) return false;

      const word = move.value.toUpperCase();
      this.validWords.add(word);
      
      // Calculate updated score
      const moves = Array.from(this.validWords).map(w => ({
        playerId: player.id,
        value: w,
        timestamp: Date.now()
      }));
      const newScore = this.calculateScore(moves);

      await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            currentWords: Array.from(this.validWords),
            score: newScore  // Update the score
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Error submitting move:', error);
      return false;
    }
  }

  async handleMove(playerId: string, word: string): Promise<boolean> {
    // First validate the move locally
    if (!this.validateMove({ playerId, value: word })) {
      return false;
    }

    // Check if word was already used
    if (this.validWords.has(word)) {
      return false;
    }

    try {
      // Validate word against dictionary API
      const response = await fetch('/api/validate-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words: [word] }),
      });

      const [isValid] = await response.json();
      
      if (isValid) {
        this.validWords.add(word);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error validating word:', error);
      return false;
    }
  }
} 