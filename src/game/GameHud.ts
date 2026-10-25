import Phaser from 'phaser';
import {
  BAR_WIDTH,
  COLORS,
  GAME_OVER_TEXT_Y_OFFSET,
  HUD_X,
  PAUSE_TEXT_Y_OFFSET,
  PHASE_PROGRESS_Y,
  PHASE_WARNING_Y_OFFSET,
  PROGRESS_BAR_Y,
  SCORE_Y,
} from './config';

export class GameHud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly phaseText: Phaser.GameObjects.Text;
  private readonly progressBar: Phaser.GameObjects.Rectangle;
  private readonly warningText: Phaser.GameObjects.Text;
  private readonly pauseText: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, width: number, height: number, nextPhaseScore: number) {
    this.scene = scene;
    this.scoreText = scene.add.text(HUD_X, SCORE_Y, 'Score: 0', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    });
    this.phaseText = scene.add.text(
      HUD_X,
      PHASE_PROGRESS_Y,
      `До фазы 2: ${nextPhaseScore}`,
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#facc15',
      },
    );

    scene.add.rectangle(HUD_X, PROGRESS_BAR_Y, BAR_WIDTH, 8, COLORS.progressBackground)
      .setOrigin(0, 0);
    this.progressBar = scene.add.rectangle(HUD_X, PROGRESS_BAR_Y, 0, 8, COLORS.progress)
      .setOrigin(0, 0);

    this.warningText = scene.add
      .text(width / 2, height / 2 - PHASE_WARNING_Y_OFFSET, '⚠ ФАЗА 2 ⚠\nСнаряды сверху и снизу!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        color: '#facc15',
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.pauseText = scene.add
      .text(width / 2, height / 2 - PAUSE_TEXT_Y_OFFSET, 'ПАУЗА\nP / ESC — продолжить', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  setScore(score: number): void {
    this.scoreText.setText(`Score: ${score}`);
  }

  updatePhaseProgress(score: number, targetScore: number): void {
    const remaining = Math.max(0, targetScore - score);
    this.phaseText.setText(`До фазы 2: ${remaining}`);
    this.progressBar.width = BAR_WIDTH * Math.min(1, score / targetScore);
  }

  showPhaseWarning(): void {
    this.phaseText.setText('ФАЗА 2').setColor('#ef4444');
    this.progressBar.width = BAR_WIDTH;
    this.progressBar.setFillStyle(COLORS.phaseProgress);
    this.warningText.setVisible(true);
  }

  hidePhaseWarning(): void {
    this.warningText.setVisible(false);
  }

  setPaused(paused: boolean): void {
    this.pauseText.setVisible(paused);
  }

  showGameOver(width: number, height: number): void {
    this.scene.add.text(
      width / 2,
      height / 2 + GAME_OVER_TEXT_Y_OFFSET,
      'ЩИТ ПРОБИТ!\nПРОБЕЛ — рестарт\nEsc/p — пауза',
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
      },
    ).setOrigin(0.5);
  }
}
