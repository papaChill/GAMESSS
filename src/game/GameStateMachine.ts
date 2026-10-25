import type { GameMode, GameState } from './GameState';

const ALLOWED_TRANSITIONS: Record<GameMode, readonly GameMode[]> = {
  playing: ['paused', 'warning', 'gameOver'],
  warning: ['paused', 'playing', 'gameOver'],
  paused: ['playing', 'warning', 'gameOver'],
  gameOver: [],
};

export class GameStateMachine {
  private resumeMode: 'playing' | 'warning' | undefined;

  constructor(private readonly state: GameState) {}

  get mode(): GameMode {
    return this.state.mode;
  }

  pause(): void {
    if (this.mode !== 'playing' && this.mode !== 'warning') {
      throw new Error(`Cannot pause while the game is ${this.mode}`);
    }

    this.resumeMode = this.mode;
    this.transitionTo('paused');
  }

  resume(): void {
    if (this.mode !== 'paused' || this.resumeMode === undefined) {
      throw new Error('Cannot resume when the game is not paused');
    }

    const mode = this.resumeMode;
    this.transitionTo(mode);
    this.resumeMode = undefined;
  }

  beginWarning(): void {
    this.transitionTo('warning');
  }

  finishWarning(): void {
    this.transitionTo('playing');
  }

  endGame(): void {
    this.transitionTo('gameOver');
    this.resumeMode = undefined;
  }

  private transitionTo(nextMode: GameMode): void {
    if (
      this.mode === 'paused' &&
      nextMode !== 'gameOver' &&
      nextMode !== this.resumeMode
    ) {
      throw new Error(`Cannot resume from paused to ${nextMode}`);
    }
    if (!ALLOWED_TRANSITIONS[this.mode].includes(nextMode)) {
      throw new Error(`Invalid game state transition: ${this.mode} -> ${nextMode}`);
    }

    this.state.mode = nextMode;
  }
}
