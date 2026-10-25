import Phaser from 'phaser';
import {
  BASE_SPEED,
  COLORS,
  HIT_RADIUS,
  MAX_SPEED_BONUS,
  PROJECTILE_SIZE,
  PROJECTILE_SPAWN_OFFSET,
  SPEED_PER_SCORE,
} from './config';
import type { PhaseConfig } from './config';
import type { Player } from './Player';

interface Projectile {
  rect: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
}

export class ProjectileSystem {
  private readonly projectiles: Projectile[] = [];
  private spawnTimerMs = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  update(
    deltaMs: number,
    phase: PhaseConfig,
    score: number,
    player: Player,
    allowSpawn: boolean,
    onShieldBlock: () => void,
    onPlayerHit: () => void,
  ): boolean {
    if (allowSpawn) {
      this.spawnTimerMs += deltaMs;
      if (this.spawnTimerMs >= phase.spawnMs) {
        this.spawnProjectile(phase, score);
        this.spawnTimerMs = 0;
      }
    }

    const deltaSeconds = deltaMs / 1000;
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      projectile.rect.x += projectile.vx * deltaSeconds;
      projectile.rect.y += projectile.vy * deltaSeconds;

      const distance = Phaser.Math.Distance.Between(
        projectile.rect.x,
        projectile.rect.y,
        player.x,
        player.y,
      );
      if (distance > HIT_RADIUS) continue;

      const blockedByShield = player.isShieldFacing(projectile.rect.x, projectile.rect.y);
      projectile.rect.destroy();
      this.projectiles.splice(index, 1);
      if (blockedByShield) {
        onShieldBlock();
      } else {
        onPlayerHit();
        return true;
      }
    }

    return false;
  }

  private spawnProjectile(phase: PhaseConfig, score: number): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const speed = (BASE_SPEED + Math.min(score * SPEED_PER_SCORE, MAX_SPEED_BONUS)) * phase.speedMult;
    const side = Phaser.Math.Between(0, phase.sides - 1);

    let x = centerX;
    let y = centerY;
    let vx = 0;
    let vy = 0;

    switch (side) {
      case 0:
        x = -PROJECTILE_SPAWN_OFFSET;
        vx = speed;
        break;
      case 1:
        x = width + PROJECTILE_SPAWN_OFFSET;
        vx = -speed;
        break;
      case 2:
        y = -PROJECTILE_SPAWN_OFFSET;
        vy = speed;
        break;
      default:
        y = height + PROJECTILE_SPAWN_OFFSET;
        vy = -speed;
        break;
    }

    const rect = this.scene.add.rectangle(x, y, PROJECTILE_SIZE, PROJECTILE_SIZE, COLORS.projectile);
    this.projectiles.push({ rect, vx, vy });
  }
}
