export enum GameStatus {
  SETUP = 'SETUP',
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  ROUND_END = 'ROUND_END',
  FINISHED = 'FINISHED'
}

export enum GameType {
  LETTER_RACE = 'LETTER_RACE',
  SPEED_WORDS = 'SPEED_WORDS'
}

export interface GameSettings {
  maxRounds: number;
  timePerRound: number;
  minPlayers: number;
  maxPlayers: number;
  [key: string]: any; // Allow for game-specific settings
}

export interface Game {
  id: string;
  code: string;
  status: GameStatus;
  hostId: string;
  currentRound: number;
  maxRounds: number;
  gameType?: GameType;
  settings?: string; // JSON string of GameSettings
  timeRemaining?: number;
  roundStartTime?: string;
} 