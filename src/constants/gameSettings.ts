import { GameType, GameTypeConfig } from '@/types/game';
import { GameSettings, LetterRaceSettings, PictureGameSettings } from '@/types/settings';
import { TextFields as LetterIcon } from '@mui/icons-material';

/**
 * Game settings and configuration constants
 * - Defines default settings for different game types (currently Letter Race)
 * - Provides helper function to get default settings by game type
 * - Contains game type definitions with titles, descriptions and tutorials
 * - Configures game parameters like rounds, timing, player counts and word rules
 */


export const letterRaceDefaults: LetterRaceSettings = {
  maxRounds: 5,
  timePerRound: 60,
  minPlayers: 2,
  maxPlayers: 8,
  minWordLength: 4,
  lettersPerRound: 2
};

export const pictureGameDefaults: PictureGameSettings = {
  maxRounds: 5,
  timePerRound: 60,
  minPlayers: 2,
  maxPlayers: 8,
  wordList: [
    'HOUSE',
    'CAT',
    'DOG',
    'TREE',
    'SUN',
    'FLOWER',
    'CAR',
    'BOAT',
    'BIRD',
    'FISH',
    // Add more simple words as needed
  ],
  drawingColors: ['#000000', '#FF0000', '#00FF00', '#0000FF'],
  brushSizes: [2, 4, 6, 8, 10]
};

// Remove speedWordsDefaults until implemented
// export const speedWordsDefaults = { ... };

export const getDefaultSettings = (gameType: GameType) => {
  switch (gameType) {
    case GameType.LETTER_RACE:
      return letterRaceDefaults;
    case GameType.PICTURE_GAME:
      return pictureGameDefaults;
    default:
      return letterRaceDefaults;
  }
};

export const GAME_CONFIGS: Record<GameType, GameTypeConfig> = {
  [GameType.LETTER_RACE]: {
    id: GameType.LETTER_RACE,
    title: 'Letter Race',
    description: 'Find words containing specific letter pairs in order',
    tutorial: 'You will be given two letters. Find words that contain these letters in order.',
    icon: LetterIcon,
    defaultSettings: letterRaceDefaults
  }
};