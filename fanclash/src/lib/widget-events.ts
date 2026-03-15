// Widget Event Bus — type definitions and local pub/sub
// Cross-iframe communication uses Socket.IO relay (see overlay components)

export type WidgetEventType =
  | 'battle:finished'
  | 'rpg:levelup'
  | 'train:combo'
  | 'meter:max'
  | 'quiz:correct'
  | 'gacha:pull'
  | 'slots:jackpot'
  | 'goal:complete';

export type WidgetActionType =
  | 'roulette:spin'
  | 'gacha:pull'
  | 'slots:spin'
  | 'weather:blizzard'
  | 'train:celebrate'
  | 'alert:special';

export interface WidgetEvent {
  type: WidgetEventType;
  data: Record<string, unknown>;
  sourceWidgetId?: string;
  streamerId?: string;
  timestamp: number;
}

type EventHandler = (event: WidgetEvent) => void;

class WidgetEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(type: WidgetEventType | WidgetActionType, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => { this.handlers.get(type)?.delete(handler); };
  }

  emit(
    type: WidgetEventType,
    data: Record<string, unknown> = {},
    sourceWidgetId?: string,
  ): void {
    const event: WidgetEvent = { type, data, sourceWidgetId, timestamp: Date.now() };
    this.handlers.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error('Widget event handler error:', e);
      }
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}

// Singleton — shared across all widgets on the same page
export const widgetEventBus = new WidgetEventBus();
