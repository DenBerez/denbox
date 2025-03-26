import { WebSocketService, WebSocketConnectionState } from "@/services/WebSocketService";
import { GameStatus, Game } from "@/types/game";

type WebSocketEventHandler = (data: any) => void;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export class ConnectionStateManager {
  private static instance: ConnectionStateManager;
  private connections: Map<string, WebSocketService> = new Map();
  private eventHandlers: Map<string, Map<string, Set<WebSocketEventHandler>>> = new Map();
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private eventListeners: Map<string, Map<string, Set<Function>>> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new ConnectionStateManager();
    }
    return this.instance;
  }

  async getOrCreateConnection(gameId: string, playerId?: string): Promise<WebSocketService> {
    const connectionKey = playerId ? `${gameId}-${playerId}` : gameId;
    
    if (this.connections.has(connectionKey)) {
      const existingConnection = this.connections.get(connectionKey)!;
      if (existingConnection.connectionState === WebSocketConnectionState.CONNECTED) {
        return existingConnection;
      }
      // If connection exists but is disconnected, remove it
      this.removeConnection(gameId, playerId);
    }

    // Create new connection
    const connection = new WebSocketService(gameId, playerId || '');
    
    await connection.connect();
    
    this.connections.set(connectionKey, connection);
    this.connectionStatus.set(connectionKey, 'connected');
    
    // Set up connection monitoring
    connection.on('disconnect', () => {
      this.connectionStatus.set(connectionKey, 'disconnected');
      this.handleDisconnect(gameId, playerId);
    });

    this.setupConnectionHandlers(gameId, connection);
    
    return connection;
  }


  private setupConnectionHandlers(gameId: string, ws: WebSocketService) {
    if (!this.eventHandlers.has(gameId)) {
      this.eventHandlers.set(gameId, new Map());
    }
    
    // Set up standard event handlers
    ws.on('STATE_RECOVERY', (data) => this.notifyHandlers(gameId, 'STATE_RECOVERY', data));
    ws.on('GAME_UPDATE', (data) => this.notifyHandlers(gameId, 'GAME_UPDATE', data));
    ws.on('PLAYER_UPDATE', (data) => this.notifyHandlers(gameId, 'PLAYER_UPDATE', data));
    ws.on('PLAYER_JOIN', (data) => this.notifyHandlers(gameId, 'PLAYER_JOIN', data));
    ws.on('PLAYER_LEAVE', (data) => this.notifyHandlers(gameId, 'PLAYER_LEAVE', data));
  }

  addEventListener(gameId: string, event: string, handler: WebSocketEventHandler) {
    if (!this.eventHandlers.has(gameId)) {
      this.eventHandlers.set(gameId, new Map());
    }
    
    const gameHandlers = this.eventHandlers.get(gameId)!;
    if (!gameHandlers.has(event)) {
      gameHandlers.set(event, new Set());
    }
    
    gameHandlers.get(event)!.add(handler);
  }

  removeEventListener(gameId: string, event: string, handler: WebSocketEventHandler) {
    const gameHandlers = this.eventHandlers.get(gameId);
    if (!gameHandlers) return;
    
    const eventHandlers = gameHandlers.get(event);
    if (!eventHandlers) return;
    
    eventHandlers.delete(handler);
  }

  private notifyHandlers(gameId: string, event: string, data: any) {
    const gameHandlers = this.eventHandlers.get(gameId);
    if (!gameHandlers) return;
    
    const eventHandlers = gameHandlers.get(event);
    if (!eventHandlers) return;
    
    eventHandlers.forEach(handler => handler(data));
  }

  private handleDisconnect(gameId: string, playerId?: string) {
    const connectionKey = playerId ? `${gameId}-${playerId}` : gameId;
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeouts.has(connectionKey)) {
      clearTimeout(this.reconnectTimeouts.get(connectionKey)!);
    }

    // Attempt to reconnect
    const timeout = setTimeout(async () => {
      try {
        await this.getOrCreateConnection(gameId, playerId);
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, 1000);

    this.reconnectTimeouts.set(connectionKey, timeout);
  }

  removeConnection(gameId: string, playerId?: string) {
    const connectionKey = playerId ? `${gameId}-${playerId}` : gameId;
    
    if (this.reconnectTimeouts.has(connectionKey)) {
      clearTimeout(this.reconnectTimeouts.get(connectionKey)!);
      this.reconnectTimeouts.delete(connectionKey);
    }

    const connection = this.connections.get(connectionKey);
    if (connection) {
      connection.disconnect();
      this.connections.delete(connectionKey);
      this.connectionStatus.delete(connectionKey);
    }
  }

  getConnectionStatus(gameId: string): ConnectionStatus {
    return this.connectionStatus.get(gameId) || 'disconnected';
  }

  getConnection(gameId: string): WebSocketService | undefined {
    return this.connections.get(gameId);
  }
}
