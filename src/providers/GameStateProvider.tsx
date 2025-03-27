'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Game, Player, GameStatus } from '@/types/game';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { playersByGameId, getGame, getPlayer } from '@/graphql/queries';
import { updateGame as updateGameMutation, createPlayer, updatePlayer } from '@/graphql/mutations';
import { SubscriptionService } from '@/services/SubscriptionService';
import { debounce } from 'lodash';

export const GameStateContext = createContext<{
  game: Game | null;
  players: Player[];
  currentPlayer: Player | null;
  isLoading: boolean;
  error: string | null;
  updateGame: (updates: Partial<Game>) => Promise<void>;
  serverTimeOffset: number;
  setError?: (error: string | null) => void;
}>({
  game: null,
  players: [],
  currentPlayer: null,
  isLoading: true,
  error: null,
  updateGame: async () => {},
  serverTimeOffset: 0
});

interface GameStateProviderProps {
  children: ReactNode;
  gameId: string;
}

export function GameStateProvider({ children, gameId }: GameStateProviderProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);

  // Fetch game data
  useEffect(() => {
    async function fetchGameData() {
      try {
        console.log('Fetching game data for game:', gameId);
        const result = await client.graphql({
          query: getGame,
          variables: { id: gameId }
        });
        
        if (result.data.getGame) {
          setGame(result.data.getGame);
          console.log('Game data fetched:', result.data.getGame);
        } else {
          setError('Game not found');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game data');
      }
    }

    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  // Fetch players
  useEffect(() => {
    let isMounted = true;
    
    async function fetchPlayers() {
      if (!gameId) return;
      
      try {
        const result = await client.graphql({
          query: playersByGameId,
          variables: { gameId }
        });
        
        if (!isMounted) return;
        
        const fetchedPlayers = result.data.playersByGameId.items;
        setPlayers(fetchedPlayers);
        console.log(`Fetched ${fetchedPlayers.length} players for game:`, gameId);
        
        // Check for stored player ID
        const storedPlayerId = localStorage.getItem(`player_${gameId}`);
        if (storedPlayerId) {
          const player = fetchedPlayers.find(p => p.id === storedPlayerId);
          if (player) {
            setCurrentPlayer(player);
            setPlayerId(player.id);
            console.log('Found existing player:', player);
          } else {
            // Player ID in localStorage not found in fetched players
            console.log('Stored player ID not found, creating new player');
            if (!isCreatingPlayer) {
              createPlayerIfNeeded();
            }
          }
        } else {
          // No player ID in localStorage, create new player
          console.log('No stored player ID, creating new player');
          if (!isCreatingPlayer) {
            createPlayerIfNeeded();
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load players');
        setIsLoading(false);
      }
    }

    fetchPlayers();
    
    return () => {
      isMounted = false;
    };
  }, [gameId, game]);

  // Create a new player for the game
  const createPlayerIfNeeded = async () => {
    // Check if we're already creating a player
    if (isCreatingPlayer) {
      return;
    }
    
    setIsCreatingPlayer(true);
    
    try {
      // Get the latest game data to check the hostId
      const gameResult = await client.graphql({
        query: getGame,
        variables: { id: gameId }
      });
      
      const currentGame = gameResult.data.getGame;
      if (!currentGame) {
        setError('Game not found');
        return;
      }
      
      // Check for stored player ID
      const storedPlayerId = localStorage.getItem(`player_${gameId}`);
      
      // If we have a stored player ID, verify if it exists
      if (storedPlayerId) {
        const playerResult = await client.graphql({
          query: getPlayer,
          variables: { id: storedPlayerId }
        });
        
        const existingPlayer = playerResult.data.getPlayer;
        
        if (existingPlayer && existingPlayer.gameId === gameId) {
          console.log('Found existing player:', existingPlayer);
          setCurrentPlayer(existingPlayer);
          setPlayerId(existingPlayer.id);
          setIsCreatingPlayer(false);
          return;
        }
        
        // If player ID exists but doesn't match this game, clear it
        localStorage.removeItem(`player_${gameId}`);
      }
      
      // Fetch all players to determine if we need to create a host
      const playersResult = await client.graphql({
        query: playersByGameId,
        variables: { gameId }
      });
      
      const existingPlayers = playersResult.data.playersByGameId.items;
      
      // Check if there's already a host among existing players
      const existingHost = existingPlayers.find(p => p.isHost);
      
      // Determine if this player should be host
      // Modified condition: Make first player host if no valid host exists
      const needsHost = existingPlayers.length === 0 || !existingHost;
      
      console.log(`Creating new player (isHost: ${needsHost}, players: ${existingPlayers.length}, existingHost: ${!!existingHost})`);
      
      const newPlayer = await client.graphql({
        query: createPlayer,
        variables: {
          input: {
            gameId,
            name: `Player ${Math.floor(Math.random() * 1000)}`,
            score: 0,
            isHost: needsHost,
            isConfirmed: false
          }
        }
      });
      
      const createdPlayer = newPlayer.data.createPlayer;
      console.log('Created new player:', createdPlayer);
      
      // If this is the host, update the game's hostId
      if (needsHost) {
        console.log(`Setting game hostId to ${createdPlayer.id}`);
        await client.graphql({
          query: updateGameMutation,
          variables: {
            input: {
              id: gameId,
              hostId: createdPlayer.id
            }
          }
        });
      }
      
      // Store player ID in localStorage
      localStorage.setItem(`player_${gameId}`, createdPlayer.id);
      
      // Set the player ID state
      setPlayerId(createdPlayer.id);
      setCurrentPlayer(createdPlayer);
    } catch (error) {
      console.error('Error creating player:', error);
      setError('Failed to create player');
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  // Ensure there's always a host
  const ensureHostExists = async () => {
    if (!gameId || !players.length) return;
    
    try {
      // Get the latest game data
      const gameResult = await client.graphql({
        query: getGame,
        variables: { id: gameId }
      });
      
      const currentGame = gameResult.data.getGame;
      
      // Check if there's a valid host
      const hostPlayers = players.filter(p => p.isHost);
      
      // If multiple hosts found, keep only the first one as host
      if (hostPlayers.length > 1) {
        console.log(`Multiple hosts found (${hostPlayers.length}). Keeping only the first one.`);
        
        // Keep the first host, remove host status from others
        for (let i = 1; i < hostPlayers.length; i++) {
          await client.graphql({
            query: updatePlayer,
            variables: {
              input: {
                id: hostPlayers[i].id,
                isHost: false
              }
            }
          });
          
          // If this is the current player, update local state
          if (hostPlayers[i].id === playerId) {
            setCurrentPlayer({
              ...currentPlayer!,
              isHost: false
            });
          }
        }
        
        // Ensure game hostId matches the remaining host
        if (currentGame.hostId !== hostPlayers[0].id) {
          await client.graphql({
            query: updateGameMutation,
            variables: {
              input: {
                id: gameId,
                hostId: hostPlayers[0].id
              }
            }
          });
        }
      }
      // If no host is found, assign the first player as host
      else if (hostPlayers.length === 0 && players.length > 0) {
        const newHost = players[0];
        
        console.log(`No host found. Assigning player ${newHost.id} as host`);
        
        // Update player to be host
        await client.graphql({
          query: updatePlayer,
          variables: {
            input: {
              id: newHost.id,
              isHost: true
            }
          }
        });
        
        // Update game hostId
        await client.graphql({
          query: updateGameMutation,
          variables: {
            input: {
              id: gameId,
              hostId: newHost.id
            }
          }
        });
        
        // If this is the current player, update local state
        if (newHost.id === playerId) {
          setCurrentPlayer({
            ...currentPlayer!,
            isHost: true
          });
        }
      }
    } catch (error) {
      console.error('Error ensuring host exists:', error);
    }
  };

  // Subscribe to player updates
  useEffect(() => {
    if (!gameId) return;
    
    // Subscribe to player updates
    const subscriptionService = new SubscriptionService();
    
    // Handle player updates
    const playerUpdateHandler = (updatedPlayer: Player) => {
      setPlayers(prevPlayers => {
        const updated = prevPlayers.map(p => 
          p.id === updatedPlayer.id ? updatedPlayer : p
        );
        return updated;
      });
      
      // Update current player if it's the one that was updated
      if (playerId && updatedPlayer.id === playerId) {
        setCurrentPlayer(updatedPlayer);
      }
    };
    
    // Handle new players
    const newPlayerHandler = (newPlayer: Player) => {
      setPlayers(prevPlayers => {
        // Only add if not already in the list
        if (!prevPlayers.some(p => p.id === newPlayer.id)) {
          return [...prevPlayers, newPlayer];
        }
        return prevPlayers;
      });
    };
    
    const playerUpdateUnsubscribe = subscriptionService.subscribeToPlayerUpdates(
      gameId, 
      playerUpdateHandler
    );
    
    const newPlayerUnsubscribe = subscriptionService.subscribeToNewPlayers(
      gameId,
      newPlayerHandler
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      playerUpdateUnsubscribe();
      newPlayerUnsubscribe();
    };
  }, [gameId, playerId]);

  // Check for host when players change
  useEffect(() => {
    if (players.length > 0 && !players.some(p => p.isHost)) {
      ensureHostExists();
    }
  }, [players]);

  // Update game function
  const updateGame = async (updates: Partial<Game>) => {
    if (!game) {
      console.error('Cannot update game: No game data');
      return Promise.reject('No game data');
    }
    
    try {
      const result = await client.graphql({
        query: updateGameMutation,
        variables: {
          input: {
            id: game.id,
            ...updates
          }
        }
      });
      
      return result.data.updateGame;
    } catch (error) {
      console.error('Error updating game:', error);
      setError('Failed to update game');
      throw error;
    }
  };

  const debouncedCreatePlayer = useCallback(
    debounce(() => {
      if (!isCreatingPlayer) {
        createPlayerIfNeeded();
      }
    }, 300),
    [isCreatingPlayer]
  );

  const contextValue = {
    game,
    players,
    currentPlayer,
    isLoading,
    error,
    updateGame,
    serverTimeOffset,
    setError
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}

// Export a hook to use the game state
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
} 