import { useGameState } from './useGameState';

export function useCurrentPlayer() {
  const { game, players } = useGameState();
  
  // If there's no game or no players, return null
  if (!game || !players.length) {
    return null;
  }

  // Find player based on stored ID in localStorage
  const storedPlayerId = localStorage.getItem(`player_${game.id}`);
  if (storedPlayerId) {
    return players.find(player => player.id === storedPlayerId) || null;
  }

  return null;
} 