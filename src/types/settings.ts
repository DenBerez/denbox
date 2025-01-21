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
  
  export interface SpeedWordsSettings extends BaseGameSettings {
    // Add any specific settings for SpeedWords game type
  }
  
  export type GameSettings = LetterRaceSettings | SpeedWordsSettings;