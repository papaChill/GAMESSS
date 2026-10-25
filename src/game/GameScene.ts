import Phaser from 'phaser';
import { GameHud } from './GameHud';
import { createInitialGameState, type GameState } from './GameState';
import { GameStateMachine } from './GameStateMachine';
import { PHASES, SHAKE_MS, SHAKE_POWER, WARNING_MS } from './config';
import { Player } from './Player';
import { ProjectileSystem } from './ProjectileSystem';

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private stateMachine!: GameStateMachine;
  private player!: Player;
  private projectileSystem!: ProjectileSystem;
  private hud!: GameHud;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
  private pauseKeys!: Phaser.Input.Keyboard.Key[];

  constructor() {
    super('GameScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.gameState = createInitialGameState();
    this.stateMachine = new GameStateMachine(this.gameState);
    this.player = new Player(this, width, height);
    this.projectileSystem = new ProjectileSystem(this);
    this.hud = new GameHud(this, width, height, PHASES[1].scoreFrom);

    if (!this.input.keyboard) throw new Error('No keyboard');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
    this.pauseKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    ];
  }

  update(_time: number, delta: number): void {
    if (this.stateMachine.mode === 'gameOver') return;

    if (this.pauseKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      if (this.stateMachine.mode === 'paused') {
        this.stateMachine.resume();
      } else {
        this.stateMachine.pause();
      }
      this.hud.setPaused(this.stateMachine.mode === 'paused');
    }
    if (this.stateMachine.mode === 'paused') return;

    if (this.stateMachine.mode === 'warning') {
      this.gameState.warningTimerMs -= delta;
      if (this.gameState.warningTimerMs <= 0) {
        this.gameState.warningTimerMs = 0;
        this.stateMachine.finishWarning();
        this.hud.hidePhaseWarning();
      }
    }

    const phase = PHASES[this.gameState.phaseIndex];
    const deltaSeconds = delta / 1000;
    this.player.rotate(
      this.cursors.left.isDown || this.wasd.left.isDown,
      this.cursors.right.isDown || this.wasd.right.isDown,
      deltaSeconds,
    );
    const playerHit = this.projectileSystem.update(
      delta,
      phase,
      this.gameState.score,
      this.player,
      this.stateMachine.mode === 'playing',
      () => this.handleShieldBlock(),
      () => this.endGame(),
    );
    if (playerHit) return;
    this.startNextPhaseIfReady();
  }

  private handleShieldBlock(): void {
    this.gameState.score += 1;
    this.hud.setScore(this.gameState.score);

    const nextPhase = PHASES[this.gameState.phaseIndex + 1];
    if (nextPhase) {
      this.hud.updatePhaseProgress(this.gameState.score, nextPhase.scoreFrom);
    }
  }

  private startNextPhaseIfReady(): void {
    if (this.stateMachine.mode !== 'playing') return;

    const nextPhaseIndex = this.gameState.phaseIndex + 1;
    const nextPhase = PHASES[nextPhaseIndex];
    if (!nextPhase || this.gameState.score < nextPhase.scoreFrom) return;

    this.gameState.phaseIndex = nextPhaseIndex;
    this.gameState.warningTimerMs = WARNING_MS;
    this.stateMachine.beginWarning();
    this.hud.showPhaseWarning();
    this.cameras.main.shake(SHAKE_MS, SHAKE_POWER);
  }

  private endGame(): void {
    this.stateMachine.endGame();
    this.player.markHit();
    this.hud.showGameOver(this.scale.width, this.scale.height);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.restart();
    });
  }
}
