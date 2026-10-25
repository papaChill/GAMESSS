export type GameMode = 'playing' | 'warning' | 'paused' | 'gameOver';

export interface GameState {
  score: number;
  phaseIndex: number;
  warningTimerMs: number;
  mode: GameMode;
}

export function createInitialGameState(): GameState {
  return {
    score: 0,
    phaseIndex: 0,
    warningTimerMs: 0,
    mode: 'playing',
  };
}
