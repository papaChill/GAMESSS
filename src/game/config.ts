import Phaser from 'phaser';
import { GameScene } from './GameScene';

export interface PhaseConfig {
  readonly scoreFrom: number;
  readonly speedMult: number;
  readonly spawnMs: number;
  readonly sides: number;
}

export const PHASES: readonly PhaseConfig[] = [
  { scoreFrom: 0, speedMult: 1, spawnMs: 800, sides: 2 },
  { scoreFrom: 15, speedMult: 1.2, spawnMs: 650, sides: 4 },
];

export const WARNING_MS = 1500;
export const SHAKE_MS = 400;
export const SHAKE_POWER = 0.006;

export const ROTATION_SPEED = 5;
export const HIT_RADIUS = 35;
export const SHIELD_HALF_ARC = Math.PI / 4;
export const PLAYER_SIZE = 50;
export const SHIELD_THICKNESS = 10;

export const BASE_SPEED = 200;
export const SPEED_PER_SCORE = 8;
export const MAX_SPEED_BONUS = 250;
export const PROJECTILE_SIZE = 16;
export const PROJECTILE_SPAWN_OFFSET = 20;

export const BAR_WIDTH = 200;
export const HUD_X = 24;
export const SCORE_Y = 24;
export const PHASE_PROGRESS_Y = 56;
export const PROGRESS_BAR_Y = 90;
export const PHASE_WARNING_Y_OFFSET = 150;
export const PAUSE_TEXT_Y_OFFSET = 90;
export const GAME_OVER_TEXT_Y_OFFSET = 90;

export const COLORS = {
  background: '#0f172a',
  player: 0x38bdf8,
  shield: 0x22c55e,
  projectile: 0xef4444,
  playerHit: 0x991b1b,
  progressBackground: 0x334155,
  progress: 0xfacc15,
  phaseProgress: 0xef4444,
} as const;

export function createGame(parent: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 640,
    backgroundColor: COLORS.background,
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  return new Phaser.Game(config);
}
