import { useGameState } from './useGameState';
import { useEffect } from 'react';

export function useCurrentPlayer() {
  const { game, players } = useGameState();
  
  // If there's no game or no players, return null
  if (!game || !players.length) {
    return null;
  }

  // Find player based on stored ID in localStorage
  const storageKey = `player_${game.id}`;
  const storedPlayerId = localStorage.getItem(storageKey);
  
  // Debug logging
  console.debug(`[useCurrentPlayer] Game ID: ${game.id}, Storage key: ${storageKey}`);
  console.debug(`[useCurrentPlayer] Stored player ID: ${storedPlayerId}`);
  console.debug(`[useCurrentPlayer] Available players:`, players);
  
  // If we have a stored player ID, try to find the player
  if (storedPlayerId) {
    const player = players.find(player => player.id === storedPlayerId);
    console.debug(`[useCurrentPlayer] Found player:`, player);
    return player || null;
  }
  
  // If no stored player ID but we have a host, check if it's in our players list
  if (game.hostId) {
    const hostPlayer = players.find(player => player.isHost);
    if (hostPlayer) {
      // Save this player ID for future reference
      localStorage.setItem(storageKey, hostPlayer.id);
      console.debug(`[useCurrentPlayer] Saved host player ID to localStorage:`, hostPlayer.id);
      return hostPlayer;
    }
  }
  
  // If we have only one player, assume that's the current player
  if (players.length === 1) {
    const singlePlayer = players[0];
    // Save this player ID for future reference
    localStorage.setItem(storageKey, singlePlayer.id);
    console.debug(`[useCurrentPlayer] Saved single player ID to localStorage:`, singlePlayer.id);
    return singlePlayer;
  }

  return null;
} 