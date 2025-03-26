import { GameSettings } from "./settings";

export enum GameStatus {
  SETUP = 'SETUP',
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  ROUND_END = 'ROUND_END',
  FINISHED = 'FINISHED'
}

export enum GameType {
  LETTER_RACE = 'LETTER_RACE',
  PICTURE_GAME = 'PICTURE_GAME'
}

export interface Game {
  id: string;
  code: string;
  status: GameStatus;
  hostId: string;
  currentRound: number;
  maxRounds: number;
  gameType: GameType;
  settings?: string;
  timeRemaining?: number;
  roundStartTime?: string;
  currentLetters?: string;
  currentWord?: string;
  currentDrawer?: string;
  currentDrawing?: string; // JSON stringified DrawingData
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  gameId: string;
  currentWords?: string[];
  score?: number;
}

export interface GameTypeConfig {
  id: GameType;
  title: string;
  description: string;
  tutorial: string;
  icon: any;
  defaultSettings: GameSettings;
}

export type WebSocketMessageType = 
  | 'GAME_UPDATE'
  | 'PLAYER_UPDATE' 
  | 'PLAYER_JOIN'
  | 'PLAYER_LEAVE'
  | 'ROUND_START'
  | 'ROUND_END';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  gameId: string;
  data: any;
}

interface GameStateContextType {
  game: Game | null;
  players: Player[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: any) => Promise<void>;
  updateGame: (updates: Partial<Game>) => Promise<void>;
  serverTimeOffset: number;
} 