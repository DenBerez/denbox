// src/utils/gameValidation.ts
import { GameSettings, GameType } from '@/types/game';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateGameSettings = (settings: GameSettings, gameType: GameType): ValidationResult => {
  const errors: string[] = [];

  // Ensure all required fields are present
  const requiredFields = ['maxRounds', 'timePerRound', 'minPlayers', 'maxPlayers'];
  for (const field of requiredFields) {
    if (settings[field] === undefined) {
      errors.push(`Missing required setting: ${field}`);
    }
  }

  // Validate common settings
  if (settings.maxRounds < 1 || settings.maxRounds > 10) {
    errors.push('Rounds must be between 1 and 10');
  }
  if (settings.timePerRound < 10 || settings.timePerRound > 300) {
    errors.push('Time per round must be between 10 and 300 seconds');
  }
  if (settings.minPlayers < 1) {
    errors.push('Minimum players must be at least 1');
  }
  if (settings.maxPlayers > 15) {
    errors.push('Maximum players cannot exceed 15');
  }
  if (settings.minPlayers > settings.maxPlayers) {
    errors.push('Minimum players cannot exceed maximum players');
  }

  // Game-specific validations
  if (gameType === GameType.LETTER_RACE) {
    const letterSettings = settings as LetterRaceSettings;
    if (!letterSettings.minWordLength || letterSettings.minWordLength < 3 || letterSettings.minWordLength > 8) {
      errors.push('Minimum word length must be between 3 and 8');
    }
    if (!letterSettings.lettersPerRound || letterSettings.lettersPerRound < 2 || letterSettings.lettersPerRound > 3) {
      errors.push('Letters per round must be between 2 and 3');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGameStart = (players: any[], settings: GameSettings): ValidationResult => {
  const errors: string[] = [];
  const confirmedPlayers = players.filter(p => p.isConfirmed);

  if (confirmedPlayers.length < settings.minPlayers) {
    errors.push(`Need at least ${settings.minPlayers} players to start (currently have ${confirmedPlayers.length})`);
  }

  if (confirmedPlayers.length > settings.maxPlayers) {
    errors.push(`Cannot start with more than ${settings.maxPlayers} players`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};