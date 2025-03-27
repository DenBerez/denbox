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
  drawingColors: string[];
  brushSizes: number[];
  drawTime: number;
  guessTime: number;
  useCustomPrompts: boolean;
}

export interface DrawingData {
  lines: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    width: number;
  }>;
}

export interface PlayerDrawing {
  playerId: string;
  drawing: DrawingData | null;
  prompt: string;
  guesses: Array<{
    playerId: string;
    guess: string;
  }>;
}

export interface GuessScore {
  playerId: string;
  points: number;
  reason: string;
}

export class PictureGame extends BaseGame {
  private wordList: string[];
  private drawings: Map<string, PlayerDrawing> = new Map();
  private settings: PictureGameSettings;
  private phase: 'PROMPT' | 'DRAW' | 'GUESS' | 'REVEAL' = 'DRAW';
  private currentDrawingIndex: number = 0;

  constructor(initialState: GameState) {
    super(initialState);
    const settings = this.settings as PictureGameSettings;
    this.wordList = settings.wordList || [
      'HOUSE', 'CAT', 'DOG', 'TREE', 'SUN', 'FLOWER',
      'CAR', 'BOAT', 'BIRD', 'FISH'
    ];
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

  getRandomPrompt(): string {
    return this.wordList[Math.floor(Math.random() * this.wordList.length)];
  }

  async startNewRound(): Promise<void> {
    const currentRound = this.state.currentRound || 0;
    
    await this.updateGameState({
      currentRound: currentRound + 1,
      timeRemaining: this.settings.drawTime || 60,
      status: GameStatus.PLAYING,
      settings: JSON.stringify({
        ...this.settings,
        phase: 'DRAW'
      })
    });
  }

  async submitPrompt(playerId: string, prompt: string): Promise<void> {
    // Implementation for custom prompts
    const settings = JSON.parse(this.state.settings || '{}');
    const drawings = settings.drawings || [];
    
    const updatedDrawings = drawings.map((drawing: PlayerDrawing) => {
      if (drawing.playerId === playerId) {
        return { ...drawing, prompt };
      }
      return drawing;
    });
    
    await this.updateGameState({
      settings: JSON.stringify({
        ...settings,
        drawings: updatedDrawings
      })
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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

  calculateScores(): Map<string, GuessScore[]> {
    const scores = new Map<string, GuessScore[]>();
    const settings = JSON.parse(this.state.settings || '{}');
    const drawings = settings.drawings || [];
    
    // Initialize scores for all players
    this.state.players.forEach(player => {
      scores.set(player.id, []);
    });
    
    // Calculate scores based on drawings and guesses
    drawings.forEach((drawing: PlayerDrawing) => {
      // Points for the drawer
      const drawerScores = scores.get(drawing.playerId) || [];
      
      // 5 points for each correct guess of your drawing
      const correctGuesses = drawing.guesses.filter(g => 
        g.guess.toLowerCase() === drawing.prompt.toLowerCase()
      );
      
      if (correctGuesses.length > 0) {
        drawerScores.push({
          points: correctGuesses.length * 5,
          reason: `${correctGuesses.length} player(s) guessed your drawing correctly`
        });
      }
      
      scores.set(drawing.playerId, drawerScores);
      
      // Points for guessers
      drawing.guesses.forEach(guess => {
        const guesserScores = scores.get(guess.playerId) || [];
        
        if (guess.guess.toLowerCase() === drawing.prompt.toLowerCase()) {
          guesserScores.push({
            points: 10,
            reason: `Correctly guessed "${drawing.prompt}"`
          });
          
          scores.set(guess.playerId, guesserScores);
        }
      });
    });
    
    return scores;
  }

  async updateSettings(newSettings: PictureGameSettings): Promise<void> {
    this.settings = newSettings;
    await this.updateGameState({
      settings: JSON.stringify(newSettings)
    });
  }
}