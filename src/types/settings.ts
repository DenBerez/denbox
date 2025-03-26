export enum GameType {
  LETTER_RACE = 'LETTER_RACE'
}

export interface GameSettings {
  maxRounds: number;
  timePerRound: number;
  minPlayers: number;
  maxPlayers: number;
}

export interface LetterRaceSettings extends GameSettings {
  minWordLength: number;
  lettersPerRound: number;
}

export interface PictureGameSettings extends GameSettings {
  wordList: string[];
  drawingColors: string[];
  brushSizes: number[];
  drawTime: number;
  guessTime: number;
  useCustomPrompts: boolean;
}

// Remove until implemented
// export interface SpeedWordsSettings extends BaseGameSettings { ... }

export type GameSettings = LetterRaceSettings;