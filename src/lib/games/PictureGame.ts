import { BaseGame, GameMove, GameState } from '../BaseGame';
import { GameSettings } from '@/types/settings';
import { GameStatus } from '@/types/game';
import { generateClient } from 'aws-amplify/api';
import { pictureGameDefaults } from '@/constants/gameSettings';
import { playersByGameId } from '@/graphql/queries';
import { updateGame } from '@/graphql/mutations';

const client = generateClient();

export interface PictureGameSettings extends GameSettings {
  timePerRound: number;
  maxRounds: number;
  maxPlayers: number;
  wordList: string[];  // List of words to draw
}

export interface DrawingData {
  lines: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    width: number;
  }>;
}

export class PictureGame extends BaseGame {
  private currentWord: string = '';
  private currentDrawing: DrawingData | null = null;
  private currentDrawer: string | null = null;
  private settings: PictureGameSettings;

  constructor(initialState: GameState) {
    super(initialState);
    this.settings = initialState.settings ? 
      JSON.parse(initialState.settings) : 
      pictureGameDefaults;
    
    // Initialize current word and drawer from settings
    if (initialState.settings) {
      const parsedSettings = JSON.parse(initialState.settings);
      this.currentWord = parsedSettings.currentWord || '';
      this.currentDrawer = parsedSettings.currentDrawer || null;
    }
  }

  validateMove(move: GameMove): boolean {
    // For guessing the word
    const guess = move.value.trim().toLowerCase();
    return guess === this.currentWord.toLowerCase();
  }

  calculateScore(moves: GameMove[]): number {
    // Basic scoring: 
    // - First correct guess: 3 points
    // - Subsequent correct guesses: 1 point
    // - Drawer gets 1 point per correct guess
    let score = 0;
    const correctGuesses = moves.filter(move => this.validateMove(move));
    
    if (correctGuesses.length > 0) {
      score += 3; // First correct guess
      score += (correctGuesses.length - 1); // Additional guesses
    }

    return score;
  }

  async startNewRound(): Promise<void> {
    // Ensure we have a word list
    const wordList = this.settings.wordList || pictureGameDefaults.wordList;
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    
    try {
      // Get latest players from the game
      const playersResult = await client.graphql({
        query: playersByGameId,
        variables: { gameId: this.state.id }
      });
      
      const players = playersResult.data.playersByGameId.items || [];
      
      // Select next drawer
      let nextDrawer;
      if (!this.currentDrawer) {
        // If no current drawer, pick the first player
        nextDrawer = players[0]?.id;
      } else {
        // Find current drawer's index and rotate to next
        const currentIndex = players.findIndex(p => p.id === this.currentDrawer);
        const nextIndex = (currentIndex + 1) % players.length;
        nextDrawer = players[nextIndex]?.id;
      }

      this.currentWord = randomWord;
      this.currentDrawer = nextDrawer;
      this.currentDrawing = null;

      // Store game-specific data in settings JSON
      const updatedSettings = {
        ...this.settings,
        currentWord: randomWord,
        currentDrawer: nextDrawer
      };

      // Update game state with mutation using only schema-defined fields
      const updateResult = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: this.state.id,
            status: GameStatus.PLAYING,
            timeRemaining: this.settings.timePerRound,
            currentRound: this.state.currentRound,
            settings: JSON.stringify(updatedSettings)
          }
        }
      });

      if (!updateResult.data?.updateGame) {
        throw new Error('Failed to update game state');
      }

      // Update local state
      this.state = {
        ...this.state,
        ...updateResult.data.updateGame
      };

      return;
    } catch (error) {
      console.error('Error starting new round:', error);
      throw error;
    }
  }

  async updateDrawing(drawingData: DrawingData, playerId: string): Promise<boolean> {
    if (playerId !== this.currentDrawer) return false;
    
    this.currentDrawing = drawingData;
    return true;
  }

  getCurrentWord(): string | null {
    return this.currentWord;
  }

  getCurrentDrawer(): string | null {
    return this.currentDrawer;
  }

  getDrawing(): DrawingData | null {
    return this.currentDrawing;
  }

  async endRound(): Promise<void> {
    try {
      // Reset the current drawing and word
      this.currentDrawing = null;
      this.currentWord = '';
      
      // Update game state
      const result = await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: this.state.id,
            status: GameStatus.ROUND_END,
            timeRemaining: 0,
            currentDrawing: null,
            settings: JSON.stringify({
              ...this.settings,
              currentWord: null,
              currentDrawer: null
            })
          }
        }
      });

      if (!result.data?.updateGame) {
        throw new Error('Failed to update game state');
      }

      // Update local state
      this.state = {
        ...this.state,
        ...result.data.updateGame
      };
    } catch (error) {
      console.error('Error ending round:', error);
      throw error;
    }
  }
} 