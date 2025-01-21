import { LetterPairSettings, SpeedWordsSettings } from '@/types/settings';

export const letterRaceDefaults: LetterRaceSettings = {
  maxRounds: 3,
  timePerRound: 60,
  minPlayers: 2,
  maxPlayers: 8,
  minWordLength: 4,
  lettersPerRound: 2
};

export const speedWordsDefaults: SpeedWordsSettings = {
  maxRounds: 3,
  timePerRound: 30,
  minPlayers: 2,
  maxPlayers: 4
};

export const getDefaultSettings = (gameType: string) => {
  switch (gameType) {
    case 'LETTER_PAIR':
      return letterPairDefaults;
    case 'SPEED_WORDS':
      return speedWordsDefaults;
    default:
      return letterPairDefaults;
  }
};