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
  private drawings: Map<string, PlayerDrawing> = new Map();
  private settings: PictureGameSettings;
  private phase: 'PROMPT' | 'DRAW' | 'GUESS' | 'REVEAL' = 'DRAW';
  private currentDrawingIndex: number = 0;

  constructor(initialState: GameState) {
    super(initialState);
    this.settings = initialState.settings ? 
      JSON.parse(initialState.settings) : 
      pictureGameDefaults;
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
    if (!this.settings.wordList || this.settings.wordList.length === 0) {
      return "House"; // Default fallback
    }
    return this.settings.wordList[Math.floor(Math.random() * this.settings.wordList.length)];
  }

  async startNewRound(): Promise<void> {
    const playersResult = await client.graphql({
      query: playersByGameId,
      variables: { gameId: this.state.id }
    });
    
    const players = playersResult.data.playersByGameId.items;
    
    // Initialize settings with defaults if needed
    this.settings = {
      ...pictureGameDefaults,
      ...this.settings
    };

    // If using custom prompts, initialize empty prompts
    if (this.settings.useCustomPrompts) {
      this.phase = 'PROMPT';
    } else {
      this.phase = 'DRAW';
    }

    // Reset drawings map
    this.drawings = new Map();

    // Initialize drawings for each player
    players.forEach(player => {
      const word = this.settings.useCustomPrompts ? '' : 
        this.settings.wordList[Math.floor(Math.random() * this.settings.wordList.length)];
      
      this.drawings.set(player.id, {
        playerId: player.id,
        drawing: null,
        prompt: word,
        guesses: []
      });
    });

    // Update game state with proper time based on phase
    const timeRemaining = this.phase === 'PROMPT' ? 30 : this.settings.drawTime;
    const nextRound = this.state.status === GameStatus.LOBBY ? 1 : this.state.currentRound + 1;

    await this.updateGameState({
      status: GameStatus.PLAYING,
      currentRound: nextRound,
      timeRemaining,
      settings: JSON.stringify({
        ...this.settings,
        phase: this.phase,
        drawings: Array.from(this.drawings.values())
      })
    });
  }

  async submitPrompt(playerId: string, prompt: string): Promise<void> {
    if (this.phase !== 'PROMPT') return;
    
    const drawing = this.drawings.get(playerId);
    if (drawing) {
      drawing.prompt = prompt;
    }

    // Check if all prompts are submitted
    const allPromptsSubmitted = Array.from(this.drawings.values())
      .every(d => d.prompt);

    if (allPromptsSubmitted) {
      // Randomly assign prompts to different players
      const prompts = Array.from(this.drawings.values())
        .map(d => d.prompt);
      const shuffledPrompts = this.shuffleArray(prompts);
      
      let i = 0;
      this.drawings.forEach(drawing => {
        drawing.prompt = shuffledPrompts[i++];
      });

      this.phase = 'DRAW';
      await this.updateGameState({
        timeRemaining: this.settings.drawTime,
        settings: JSON.stringify({
          ...this.settings,
          phase: this.phase,
          drawings: Array.from(this.drawings.values())
        })
      });
    }
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
    
    // Initialize scores for all players
    this.drawings.forEach(drawing => {
      scores.set(drawing.playerId, []);
    });

    // Calculate scores for each drawing
    this.drawings.forEach(drawing => {
      // Points for the artist based on correct guesses
      const correctGuesses = drawing.guesses.filter(g => 
        g.guess.toLowerCase().trim() === drawing.prompt.toLowerCase().trim()
      );
      
      const artistScore = {
        playerId: drawing.playerId,
        points: correctGuesses.length * 2, // 2 points per correct guess
        reason: `${correctGuesses.length} players guessed correctly`
      };
      
      scores.get(drawing.playerId)?.push(artistScore);

      // Points for guessers
      drawing.guesses.forEach(guess => {
        if (guess.playerId === drawing.playerId) return; // Skip artist's own guess
        
        const isCorrect = guess.guess.toLowerCase().trim() === drawing.prompt.toLowerCase().trim();
        const guesserScore = {
          playerId: guess.playerId,
          points: isCorrect ? 3 : 0, // 3 points for correct guess
          reason: isCorrect ? `Correctly guessed "${drawing.prompt}"` : `Incorrect guess for "${drawing.prompt}"`
        };
        
        scores.get(guess.playerId)?.push(guesserScore);
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