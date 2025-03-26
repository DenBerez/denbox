import { GameStatus, GameType, Game } from '@/types/game';
import { fetchAuthSession } from 'aws-amplify/auth';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { getGame } from '@/graphql/queries';
import config from '../aws-exports';

export type WebSocketMessageType = 
  | 'GAME_UPDATE'
  | 'PLAYER_UPDATE'
  | 'ROUND_START'
  | 'ROUND_END'
  | 'DRAWING_UPDATE';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  gameId: string;
  data: any;
}

export enum WebSocketConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR'
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
  private readonly gameId: string;
  private readonly playerId: string;
  private handlers: Map<string, ((data: any) => void)[]> = new Map();
  private readonly baseUrl: string;
  private messageQueue: WebSocketMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(gameId: string, playerId: string) {
    this.gameId = gameId;
    this.playerId = playerId;
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://wll4r0f1z1.execute-api.us-east-1.amazonaws.com/production';
  }

  public getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  public async connect(retryAttempts: number = 3): Promise<void> {
    if (this.connectionState === WebSocketConnectionState.CONNECTING) {
      throw new Error('Connection already in progress');
    }

    // Allow anonymous connections if needed
    const playerIdParam = this.playerId ? `&playerId=${this.playerId}` : '';

    this.connectionState = WebSocketConnectionState.CONNECTING;
    
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        const wsUrl = `${this.baseUrl}?gameId=${this.gameId}${playerIdParam}&apiKey=${config.aws_appsync_apiKey}`;
        console.log('Connecting to:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        await new Promise<void>((resolve, reject) => {
          this.ws!.onopen = () => {
            this.connectionState = WebSocketConnectionState.CONNECTED;
            console.log('WebSocket connected');
            resolve();
          };

          this.ws!.onerror = (error) => {
            this.connectionState = WebSocketConnectionState.ERROR;
            console.error('WebSocket error:', error);
            reject(error);
          };

          this.ws!.onclose = () => {
            this.connectionState = WebSocketConnectionState.DISCONNECTED;
            console.log('WebSocket closed');
          };

          this.ws!.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const handlers = this.handlers.get(message.type) || [];
            handlers.forEach(handler => handler(message.data));
          };
        });

        return; // Successfully connected
      } catch (error) {
        if (attempt === retryAttempts - 1) {
          throw error; // Last attempt failed
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
      }
    }
  }

  private async processMessageQueue() {
    while (this.messageQueue.length > 0 && this.connectionState === WebSocketConnectionState.CONNECTED) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.send(message);
      }
    }
  }

  public async send(message: WebSocketMessage): Promise<boolean> {
    if (this.connectionState !== WebSocketConnectionState.CONNECTED) {
      this.messageQueue.push(message);
      return false;
    }

    if (!this.ws) throw new Error('WebSocket is not connected');
    this.ws.send(JSON.stringify(message));
    return true;
  }

  public disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.ws?.close();
    this.ws = null;
    this.connectionState = WebSocketConnectionState.DISCONNECTED;
  }

  public on(type: WebSocketMessageType, handler: (data: any) => void) {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  public off(type: WebSocketMessageType, handler: (data: any) => void) {
    const handlers = this.handlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.handlers.set(type, handlers);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState === WebSocketConnectionState.CONNECTED) {
        this.send({
          type: 'HEARTBEAT',
          gameId: this.gameId,
          data: { timestamp: Date.now() }
        });
      }
    }, 30000); // Every 30 seconds
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log(`Received ${message.type} message:`, message);
      
      // Emit the event to all listeners
      this.emit(message.type, message.data);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }
}