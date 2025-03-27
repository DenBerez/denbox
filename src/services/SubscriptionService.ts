import { GraphQLSubscription } from '@aws-amplify/api';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { 
  onUpdateGameById, 
  onUpdatePlayerByGameId, 
  onCreatePlayerByGameId 
} from '@/graphql/subscriptions';
import { Game, Player } from '@/types/game';

type SubscriptionHandler<T> = (data: T) => void;
type SubscriptionType = 'GAME_UPDATE' | 'PLAYER_UPDATE' | 'PLAYER_JOIN';

export class SubscriptionService {
  public subscriptions: Map<string, { subscription: GraphQLSubscription<any>, handlers: Set<SubscriptionHandler<any>> }> = new Map();
  public static instance: SubscriptionService;

  public constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  public subscribeToGame(gameId: string, handler: SubscriptionHandler<Game>): () => void {
    const key = `game:${gameId}`;
    
    if (!this.subscriptions.has(key)) {
      const subscription = client.graphql({
        query: onUpdateGameById,
        variables: { id: gameId }
      }).subscribe({
        next: ({ data }) => {
          const handlers = this.subscriptions.get(key)?.handlers || new Set();
          const game = data?.onUpdateGameById;
          if (game) {
            handlers.forEach(h => h(game));
          }
        },
        error: (error) => console.error('Game subscription error:', error)
      });

      this.subscriptions.set(key, { 
        subscription, 
        handlers: new Set([handler]) 
      });
    } else {
      // Add handler to existing subscription
      this.subscriptions.get(key)?.handlers.add(handler);
    }

    // Return unsubscribe function
    return () => {
      const sub = this.subscriptions.get(key);
      if (sub) {
        sub.handlers.delete(handler);
        
        // If no handlers left, unsubscribe and remove
        if (sub.handlers.size === 0) {
          sub.subscription.unsubscribe();
          this.subscriptions.delete(key);
        }
      }
    };
  }

  public subscribeToPlayerUpdates(gameId: string, handler: SubscriptionHandler<Player>): () => void {
    const key = `playerUpdates:${gameId}`;
    
    if (!this.subscriptions.has(key)) {
      const subscription = client.graphql({
        query: onUpdatePlayerByGameId,
        variables: { gameId }
      }).subscribe({
        next: ({ data }) => {
          const handlers = this.subscriptions.get(key)?.handlers || new Set();
          const player = data?.onUpdatePlayerByGameId;
          if (player) {
            handlers.forEach(h => h(player));
          }
        },
        error: (error) => console.error('Player update subscription error:', error)
      });

      this.subscriptions.set(key, { 
        subscription, 
        handlers: new Set([handler]) 
      });
    } else {
      this.subscriptions.get(key)?.handlers.add(handler);
    }

    return () => {
      const sub = this.subscriptions.get(key);
      if (sub) {
        sub.handlers.delete(handler);
        if (sub.handlers.size === 0) {
          sub.subscription.unsubscribe();
          this.subscriptions.delete(key);
        }
      }
    };
  }

  public subscribeToNewPlayers(gameId: string, handler: SubscriptionHandler<Player>): () => void {
    const key = `playerJoin:${gameId}`;
    
    if (!this.subscriptions.has(key)) {
      const subscription = client.graphql({
        query: onCreatePlayerByGameId,
        variables: { gameId }
      }).subscribe({
        next: ({ data }) => {
          const handlers = this.subscriptions.get(key)?.handlers || new Set();
          const player = data?.onCreatePlayerByGameId;
          if (player) {
            handlers.forEach(h => h(player));
          }
        },
        error: (error) => console.error('New player subscription error:', error)
      });

      this.subscriptions.set(key, { 
        subscription, 
        handlers: new Set([handler]) 
      });
    } else {
      this.subscriptions.get(key)?.handlers.add(handler);
    }

    return () => {
      const sub = this.subscriptions.get(key);
      if (sub) {
        sub.handlers.delete(handler);
        if (sub.handlers.size === 0) {
          sub.subscription.unsubscribe();
          this.subscriptions.delete(key);
        }
      }
    };
  }

  public unsubscribeAll(): void {
    this.subscriptions.forEach(sub => {
      sub.subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
} 