import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketService } from '@/services/WebSocketService';
import { ConnectionStateManager } from '@/utils/connectionStateManager';
import { Game, Player, GameStatus, WebSocketMessage } from '@/types/game';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { playersByGameId, getPlayer, getGame } from '@/graphql/queries';
import { createPlayer, updatePlayer, updateGame as updateGameMutation } from '@/graphql/mutations';

interface GameStateContextType {
  game: Game;
  players: Player[];
  isConnected: boolean;
  sendMessage: (message: any) => Promise<void>;
  updateGame: (updates: Partial<Game>) => Promise<void>;
  serverTimeOffset: number;
  isLoading: boolean;
  currentPlayer: Player | null;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

// Create a global initialization tracker to prevent duplicate initializations
const initializedGames = new Map<string, { playerId: string | null }>();

export function GameStateProvider({ children, initialGame }: { children: React.ReactNode, initialGame: Game }) {
  const [game, setGame] = useState<Game>(initialGame);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const wsManager = ConnectionStateManager.getInstance();
  const playerInitialized = useRef(false);
  const initializationInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Add this function BEFORE initializePlayer
  const broadcastPlayerJoin = useCallback(async (player: Player) => {
    if (!game?.id || !player?.id) return;
    
    try {
      const connection = await wsManager.getOrCreateConnection(game.id, player.id);
      await connection.send({
        type: 'PLAYER_JOIN',
        gameId: game.id,
        data: player
      });
    } catch (error) {
      console.error('Failed to broadcast player join:', error);
    }
  }, [game?.id]);

  // Initialize player first
  const initializePlayer = useCallback(async () => {
    // Check if we already have a player ID in localStorage
    const storedPlayerId = localStorage.getItem(`player_${game.id}`);
    
    if (storedPlayerId) {
      try {
        console.log(`Found stored player ID: ${storedPlayerId} for game: ${game.id}`);
        const result = await client.graphql({
          query: getPlayer,
          variables: { id: storedPlayerId }
        });
        const existingPlayer = result.data.getPlayer;
        if (existingPlayer) {
          console.log(`Successfully retrieved existing player: ${existingPlayer.id}`);
          if (mountedRef.current) {
            setCurrentPlayer(existingPlayer);
          }
          return existingPlayer;
        }
      } catch (error) {
        console.warn('Stored player not found:', error);
        // Clear invalid player ID from storage
        localStorage.removeItem(`player_${game.id}`);
      }
    }

    // Check if we already have a player ID in the global map
    const existingInitialization = initializedGames.get(game.id);
    if (existingInitialization?.playerId) {
      try {
        console.log(`Found player ID in global map: ${existingInitialization.playerId}`);
        const result = await client.graphql({
          query: getPlayer,
          variables: { id: existingInitialization.playerId }
        });
        const existingPlayer = result.data.getPlayer;
        if (existingPlayer) {
          console.log(`Successfully retrieved existing player from global map: ${existingPlayer.id}`);
          if (mountedRef.current) {
            setCurrentPlayer(existingPlayer);
          }
          return existingPlayer;
        }
      } catch (error) {
        console.warn('Player from global map not found:', error);
        // Remove invalid player ID from global map
        initializedGames.delete(game.id);
      }
    }

    // Get the game to check the hostId
    try {
      const gameResult = await client.graphql({
        query: getGame,
        variables: { id: game.id }
      });
      const currentGame = gameResult.data.getGame;
      
      // Get existing players
      const playersResult = await client.graphql({
        query: playersByGameId,
        variables: { gameId: game.id }
      });
      const existingPlayers = playersResult.data.playersByGameId.items || [];
      console.log(`Found ${existingPlayers.length} existing players for game: ${game.id}`);
      
      // Determine if this should be the host
      // If no players exist AND this game doesn't have a host player yet
      const shouldBeHost = existingPlayers.length === 0 && 
                           (!currentGame.hostId || currentGame.hostId === game.id);
      
      console.log(`Creating new player for game: ${game.id}, shouldBeHost: ${shouldBeHost}`);
      
      // Create new player
      const result = await client.graphql({
        query: createPlayer,
        variables: {
          input: {
            gameId: game.id,
            name: `Player ${Math.floor(Math.random() * 1000)}`,
            score: 0,
            isHost: shouldBeHost,
            currentWords: [],
            gamePlayersId: game.id
          }
        }
      });
      
      const newPlayer = result.data.createPlayer;
      console.log(`New player created: ${newPlayer.id}, isHost: ${newPlayer.isHost}`);
      
      // Store player ID in localStorage and global map
      localStorage.setItem(`player_${game.id}`, newPlayer.id);
      initializedGames.set(game.id, { playerId: newPlayer.id });
      
      // Broadcast player join event
      setTimeout(() => {
        broadcastPlayerJoin(newPlayer).catch(err => 
          console.warn('Failed to broadcast player join:', err)
        );
      }, 500);
      
      // If this is the host, update the game's hostId
      if (shouldBeHost && newPlayer.id) {
        try {
          console.log(`Updating game hostId to: ${newPlayer.id}`);
          await client.graphql({
            query: updateGameMutation,
            variables: {
              input: {
                id: game.id,
                hostId: newPlayer.id
              }
            }
          });
        } catch (hostUpdateError) {
          console.warn('Failed to update game hostId:', hostUpdateError);
        }
      }
      
      if (mountedRef.current) {
        setCurrentPlayer(newPlayer);
      }
      return newPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }, [game.id, broadcastPlayerJoin]);

  // Add this after the initializePlayer function
  const fetchInitialPlayers = async () => {
    try {
      const result = await client.graphql({
        query: playersByGameId,
        variables: { gameId: game.id }
      });
      const initialPlayers = result.data.playersByGameId.items || [];
      if (mountedRef.current) {
        setPlayers(initialPlayers);
      }
      return initialPlayers;
    } catch (error) {
      console.error('Error fetching initial players:', error);
      return [];
    }
  };

  // Connect WebSocket after player is initialized
  const connect = useCallback(async (playerId: string) => {
    if (!playerId) {
      console.error('Cannot connect without player ID');
      return;
    }

    try {
      const connection = await wsManager.getOrCreateConnection(game.id, playerId);
      
      connection.on('GAME_UPDATE', (data) => {
        if (data?.id === game.id && mountedRef.current) {
          setGame(current => ({ ...current, ...data }));
        }
      });

      // Improved PLAYER_UPDATE handler
      connection.on('PLAYER_UPDATE', (data) => {
        if (!data || !mountedRef.current) return;
        
        console.log('Player update received:', data);
        
        // First fetch all players to ensure we have the latest data
        client.graphql({
          query: playersByGameId,
          variables: { gameId: game.id }
        }).then(result => {
          const allPlayers = result.data.playersByGameId.items || [];
          
          if (mountedRef.current) {
            // Create a map of players by ID for efficient lookup
            const playerMap = new Map(allPlayers.map(p => [p.id, p]));
            
            // Update the specific player with the new data
            if (data.id) {
              playerMap.set(data.id, { ...playerMap.get(data.id) || {}, ...data });
            }
            
            // Convert map back to array and update state
            setPlayers(Array.from(playerMap.values()));
          }
        }).catch(error => {
          console.error('Error fetching players after update:', error);
        });
      });

      // Add a specific handler for PLAYER_JOIN events
      connection.on('PLAYER_JOIN', (data) => {
        if (!data || !mountedRef.current) return;
        
        console.log('New player joined:', data);
        
        setPlayers(current => {
          // Check if player already exists in our list
          const exists = current.some(p => p.id === data.id);
          if (exists) {
            return current; // Player already in list
          }
          
          // Add the new player to our list
          return [...current, data];
        });
      });

      // Add a handler for initial state recovery
      connection.on('STATE_RECOVERY', (data) => {
        if (!data || !mountedRef.current) return;
        
        console.log('State recovery received:', data);
        
        if (data.game && data.game.id === game.id) {
          setGame(current => ({ ...current, ...data.game }));
        }
        
        if (data.players && Array.isArray(data.players)) {
          setPlayers(data.players);
        }
      });

      if (mountedRef.current) {
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
      }
      
      // Request current state from server
      connection.send({
        type: 'GET_STATE',
        gameId: game.id
      }).catch(err => console.warn('Failed to request state:', err));
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      if (mountedRef.current) {
        setIsConnected(false);
        setReconnectAttempts(prev => prev + 1);
      }
      setTimeout(() => {
        if (mountedRef.current) {
          connect(playerId);
        }
      }, 1000 * Math.min(reconnectAttempts + 1, 5));
    }
  }, [game.id, reconnectAttempts]);

  // Main initialization effect
  useEffect(() => {
    mountedRef.current = true;
    let timeoutId: NodeJS.Timeout;

    const initialize = async () => {
      // Check if this game has already been initialized globally
      const existingInit = initializedGames.get(game.id);
      if (existingInit) {
        console.log(`Game ${game.id} already initialized globally with player ${existingInit.playerId}`);
        
        // If we have a player ID, use it
        if (existingInit.playerId) {
          try {
            const result = await client.graphql({
              query: getPlayer,
              variables: { id: existingInit.playerId }
            });
            const player = result.data.getPlayer;
            if (player && mountedRef.current) {
              setCurrentPlayer(player);
              playerInitialized.current = true;
              
              // Fetch players and connect
              const initialPlayers = await fetchInitialPlayers();
              if (!mountedRef.current) return;
              
              setPlayers(initialPlayers);
              await connect(player.id);
              setIsLoading(false);
            }
            return;
          } catch (error) {
            console.warn('Error retrieving player from global map:', error);
            // Continue with initialization if player retrieval fails
          }
        }
      }
      
      // Check if initialization is already in progress
      if (initializationInProgress.current) {
        console.log(`Initialization already in progress for game ${game.id}, skipping`);
        return;
      }
      
      // Check if player is already initialized for this component
      if (playerInitialized.current) {
        console.log(`Player already initialized for game ${game.id}, skipping`);
        return;
      }
      
      // Set initialization flags
      initializationInProgress.current = true;
      initializedGames.set(game.id, { playerId: null });
      
      console.log(`Starting initialization for game: ${game.id}`);
      
      try {
        if (mountedRef.current) {
          setIsLoading(true);
        }
        
        // First initialize player
        const player = await initializePlayer();
        if (!mountedRef.current) {
          console.log('Component unmounted during initialization, but continuing for global state');
          // Still update the global map even if component unmounted
          if (player) {
            initializedGames.set(game.id, { playerId: player.id });
          }
          return;
        }
        
        if (player) {
          playerInitialized.current = true;
          setCurrentPlayer(player);
          
          // Update global map
          initializedGames.set(game.id, { playerId: player.id });
          
          // Log player creation here, where player is defined
          console.log('Player created:', {
            id: player.id,
            isHost: player.isHost,
            existingPlayers: players.length
          });
          
          // Then fetch initial players
          const initialPlayers = await fetchInitialPlayers();
          if (!mountedRef.current) return;
          
          // Create a new array with unique players by ID
          const uniquePlayers = [...initialPlayers];
          
          // Only add the current player if not already in the list
          if (!uniquePlayers.some(p => p.id === player.id)) {
            uniquePlayers.push(player);
          }
          
          // Update state with unique players
          setPlayers(uniquePlayers);
          
          // Only attempt WebSocket connection after we have a player ID
          if (player.id) {
            await connect(player.id);
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (mountedRef.current) {
          setError('Failed to initialize game state');
        }
        // Don't remove from initialized games on error to prevent duplicate players
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          initializationInProgress.current = false;
        }
      }
    };

    console.log('Initializing player for game:', game.id);
    initialize();

    return () => {
      mountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
      // Don't remove the connection on unmount, as we might remount
      // wsManager.removeConnection(game.id);
    };
  }, [game.id, initializePlayer, connect]);

// In GameStateProvider.tsx
const sendMessage = useCallback(async (message: WebSocketMessage) => {
  if (!currentPlayer?.id) {
    console.error('Cannot send message: No player ID available');
    return;
  }
  
  try {
    const connection = await wsManager.getOrCreateConnection(game.id, currentPlayer.id);
    await connection.send(message);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}, [game?.id, currentPlayer]);

  const updateGame = useCallback(async (updates: Partial<Game>) => {
    if (!game) return;
    try {
      // Update local state immediately for optimistic UI
      setGame(current => current ? { ...current, ...updates } : null);
      
      // Broadcast update through WebSocket
      const connection = await wsManager.getOrCreateConnection(game.id);
      await connection.send({
        type: 'GAME_UPDATE',
        gameId: game.id,
        data: updates
      });
    } catch (error) {
      console.error('Failed to update game:', error);
      // Revert optimistic update on error
      setGame(game);
    }
  }, [game]);

  useEffect(() => {
    console.log('Players updated:', players);
  }, [players]);

  // Cleanup effect
  useEffect(() => {
    if (!currentPlayer || !players.length) return;

    const handleBeforeUnload = () => {
      // Don't remove the connection on page unload
      // wsManager.removeConnection(game.id);
      // Don't remove the player ID on unload - this helps with reconnection
      // localStorage.removeItem(`player_${game.id}`);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentPlayer, game.id, players.length]);

  const value = {
    game,
    players,
    isConnected,
    sendMessage,
    updateGame,
    serverTimeOffset: 0,
    isLoading,
    currentPlayer
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}; 