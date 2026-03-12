import { BattleManager } from './battle';

/** Shared in-memory store for active battles, accessible by both battle handler and donation processor. */
export const activeBattles = new Map<string, BattleManager>();
