
import { GameSettings, GameType, GameStatus } from '@/types/game';
import { generateClient } from 'aws-amplify/api';
import { updateGame, updatePlayer } from '@/graphql/mutations';
import { letterRaceDefaults } from '@/constants/gameSettings';

/**
 * BaseGame provides core game functionality and structure for word-based games:
 * - Manages game state, settings, and player data
 * - Handles move validation and scoring through abstract methods
 * - Processes time-based game progression
 * - Manages player move submission and validation
 * - Updates game state via AWS Amplify API
 * - Provides base structure for specific game implementations
 */



const client = generateClient();

export interface GameMove {
  playerId: string;
  value: string;
  timestamp: number;
}

export interface GameState {
  id: string;
  status: GameStatus;
  currentRound: number;
  maxRounds: number;
  timeRemaining: number;
  settings: string;
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  currentMoves: GameMove[];
}

export abstract class BaseGame {
  protected state: GameState;
  protected settings: GameSettings;

  constructor(initialState: GameState) {
    this.state = initialState;
    try {
      const parsedSettings = JSON.parse(initialState.settings);
      this.settings = {
        ...letterRaceDefaults, // Import this from constants
        ...parsedSettings
      };
    } catch (error) {
      console.error('Error parsing settings:', error);
        this.settings = letterRaceDefaults;
    }
  }

  abstract validateMove(move: GameMove): boolean;
  abstract calculateScore(moves: GameMove[]): number;
  abstract getGameSpecificSettings(): Partial<GameSettings>;

  // Common game logic
  async handleTimeUp(): Promise<void> {
    const nextRound = this.state.currentRound + 1;
    const isLastRound = nextRound > this.settings.maxRounds;

    try {
      await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: this.state.id,
            status: isLastRound ? GameStatus.FINISHED : GameStatus.ROUND_END,
            currentRound: nextRound,
            timeRemaining: 0
          }
        }
      });
    } catch (error) {
      console.error('Error handling time up:', error);
      throw error;
    }
  }

  async submitMove(move: GameMove): Promise<boolean> {
    if (!this.validateMove(move)) {
      return false;
    }

    try {
      const player = this.state.players.find(p => p.id === move.playerId);
      if (!player) return false;

      const updatedMoves = [...player.currentMoves, move];
      await client.graphql({
        query: updatePlayer,
        variables: {
          input: {
            id: player.id,
            currentMoves: updatedMoves
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Error submitting move:', error);
      return false;
    }
  }

  protected async updateGameState(updates: Partial<GameState>): Promise<void> {
    try {
      await client.graphql({
        query: updateGame,
        variables: {
          input: {
            id: this.state.id,
            ...updates,
            currentRound: (updates.status === GameStatus.PLAYING) ? 
              this.state.currentRound + 1 : 
              this.state.currentRound
          }
        }
      });
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }
} 