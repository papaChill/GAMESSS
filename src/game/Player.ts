import Phaser from 'phaser';
import {
  COLORS,
  PLAYER_SIZE,
  ROTATION_SPEED,
  SHIELD_HALF_ARC,
  SHIELD_THICKNESS,
} from './config';

export class Player {
  private readonly container: Phaser.GameObjects.Container;
  private readonly box: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.box = scene.add.rectangle(0, 0, PLAYER_SIZE, PLAYER_SIZE, COLORS.player);
    const shield = scene.add.rectangle(
      PLAYER_SIZE / 2,
      0,
      SHIELD_THICKNESS,
      PLAYER_SIZE,
      COLORS.shield,
    );
    this.container = scene.add.container(width / 2, height / 2, [this.box, shield]);
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  rotate(left: boolean, right: boolean, deltaSeconds: number): void {
    if (left) this.container.rotation -= ROTATION_SPEED * deltaSeconds;
    if (right) this.container.rotation += ROTATION_SPEED * deltaSeconds;
  }

  isShieldFacing(targetX: number, targetY: number): boolean {
    const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const angleDifference = Phaser.Math.Angle.Wrap(this.container.rotation - angleToTarget);
    return Math.abs(angleDifference) < SHIELD_HALF_ARC;
  }

  markHit(): void {
    this.box.setFillStyle(COLORS.playerHit);
  }
}
