export enum GameType {
  LETTER_RACE = 'LETTER_RACE'
}

export interface BaseGameSettings {
    maxRounds: number;
    timePerRound: number;
    minPlayers: number;
    maxPlayers: number;
  }
  
  export interface LetterRaceSettings extends BaseGameSettings {
    minWordLength: number;
    lettersPerRound: number;
  }
  
  // Remove until implemented
  // export interface SpeedWordsSettings extends BaseGameSettings { ... }
  
  export type GameSettings = LetterRaceSettings;