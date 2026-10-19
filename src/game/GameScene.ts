import Phaser from 'phaser';

interface Projectile {
  rect: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
}
export class GameScene extends Phaser.Scene {
  // Контейнер объединяет квадрат и его щит в одно целое для вращения
  private playerContainer!: Phaser.GameObjects.Container;
  private playerBox!: Phaser.GameObjects.Rectangle;
  private shield!: Phaser.GameObjects.Rectangle;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private gameOver = false;

  private projectiles: Projectile[] = [];
  private spawnTimer = 0;

  private pauseKeys!: Phaser.Input.Keyboard.Key[];
  private pauseText!: Phaser.GameObjects.Text;
  private paused = false;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }
  
  private elapsed = 0;       // время игры в мс (без пауз)
  private phase = 1;
  private warningTimer = 0;  // пока > 0 — показываем предупреждение и не спавним пули
  private warningText!: Phaser.GameObjects.Text;

  create(): void {
    const { width, height } = this.scale;
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.projectiles = [];
    this.elapsed = 0;
    this.phase = 1;
    this.warningTimer = 0;
    this.spawnTimer = 0;

    // Текст счёта
    this.scoreText = this.add.text(24, 24, 'Score: 0', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    });
    this.timerText = this.add.text(24, 56, 'До фазы 2: 15', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#facc15',
    });
    this.warningText = this.add
    .text(width / 2, height / 2 - 150, '⚠ ФАЗА 2 ⚠\nСнаряды сверху и снизу!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '32px',
      color: '#facc15',
      align: 'center',
    })
    .setOrigin(0.5)
    .setVisible(false);

    // 1. Создаем игрока: базовый квадрат (размер 50х50)
    this.playerBox = this.add.rectangle(0, 0, 50, 50, 0x38bdf8);

    // 2. Создаем ЩИТ на правой грани квадрата (зеленая полоска толщиной 10)
    // x = 25 (правая граница квадрата), y = 0
    this.shield = this.add.rectangle(25, 0, 10, 50, 0x22c55e);

    // Объединяем их в контейнер прямо в центре экрана
    this.playerContainer = this.add.container(width / 2, height / 2, [this.playerBox, this.shield]);

    // Управление
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

    this.pauseText = this.add
      .text(width / 2, height / 2 - 90, 'ПАУЗА\nP / ESC — продолжить', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false);
    
  }

  update(_time: number, delta: number): void {
    //if (this.gameOver) return;

    if (this.gameOver) return;

    // Переключение паузы
    if (this.pauseKeys.some((k) => Phaser.Input.Keyboard.JustDown(k))) {
      this.paused = !this.paused;
      this.pauseText.setVisible(this.paused);
    }
    if (this.paused) return;
    this.elapsed += delta;

    // Обратный отсчёт до фазы 2 (посекундно)
    if (this.phase === 1) {
      const left = Math.max(0, Math.ceil((15000 - this.elapsed) / 1000));
      const label = `До фазы 2: ${left}`;
      if (this.timerText.text !== label) this.timerText.setText(label);
    }

    if (this.phase === 1 && this.elapsed >= 15000) {
      this.phase = 2;
      this.warningTimer = 1500;
      this.warningText.setVisible(true);
      this.timerText.setText('ФАЗА 2').setColor('#ef4444');
      this.cameras.main.shake(400, 0.006); // длительность мс, сила
    }

    if (this.warningTimer > 0) {
      this.warningTimer -= delta;
      if (this.warningTimer <= 0) this.warningText.setVisible(false);
    }
    const seconds = delta / 1000;

    // Вращение контейнера (квадрат + щит поворачиваются вместе)
    const ROTATION_SPEED = 5;
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.playerContainer.rotation -= ROTATION_SPEED * seconds;
    }
    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.playerContainer.rotation += ROTATION_SPEED * seconds;
    }

    // Спавн пуль
    if (this.warningTimer <= 0) {
      this.spawnTimer += delta;
      const interval = this.phase === 2 ? 650 : 800;
      if (this.spawnTimer > interval) {
        this.spawnProjectile();
        this.spawnTimer = 0;
      }
    }

    // Обработка пуль
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      //p.rect.x += p.speed * seconds;
      p.rect.x += p.vx * seconds;
      p.rect.y += p.vy * seconds;
      // Дистанция от пули до центра игрока
      const dist = Phaser.Math.Distance.Between(
        p.rect.x, p.rect.y,
        this.playerContainer.x, this.playerContainer.y
      );

      // Зона контакта с квадратом
      if (dist <= 35) {
        // Вычисляем угол, с которого прилетела пуля относительно игрока
        const angleToBullet = Phaser.Math.Angle.Between(
          this.playerContainer.x, this.playerContainer.y,
          p.rect.x, p.rect.y
        );

        // Разница углов между направлением щита и пулей
        const angleDiff = Phaser.Math.Angle.Wrap(this.playerContainer.rotation - angleToBullet);

        // Если пуля попала в сектор щита (примерно ±45 градусов от направления щита)
        if (Math.abs(angleDiff) < Math.PI / 4) {
          // ОТБИЛИ ЩИТОМ!
          p.rect.destroy();
          this.projectiles.splice(i, 1);
          this.score += 1;
          this.scoreText.setText(`Score: ${this.score}`);
        } else {
          // ПОПАДАНИЕ В ГОЛОЕ ТЕЛО — СМЕРТЬ
          this.endGame();
          return;
        }
      }
    }
  }

  private spawnProjectile(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const mult = this.phase === 2 ? 1.2 : 1;
    const speed = (200 + Math.min(this.score * 8, 250)) * mult;

    // Фаза 1: только слева/справа. Фаза 2: ещё сверху/снизу
    const side = Phaser.Math.Between(0, this.phase === 2 ? 3 : 1);

    let x = 0, y = 0, vx = 0, vy = 0;
    switch (side) {
      case 0: x = -20;         y = cy;          vx = speed;  break; // слева
      case 1: x = width + 20;  y = cy;          vx = -speed; break; // справа
      case 2: x = cx;          y = -20;         vy = speed;  break; // сверху
      default: x = cx;         y = height + 20; vy = -speed; break; // снизу
    }

    const rect = this.add.rectangle(x, y, 16, 16, 0xef4444);
    this.projectiles.push({ rect, vx, vy });
  }

  private endGame(): void {
    this.gameOver = true;
    this.playerBox.setFillStyle(0x991b1b);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 90, 'ЩИТ ПРОБИТ!\nПРОБЕЛ — рестарт\nEsc/p — пауза', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.restart();
    });
  }
}



// import Phaser from 'phaser';

// interface Projectile {
//   rect: Phaser.GameObjects.Rectangle;
//   speed: number;
// }

// export class GameScene extends Phaser.Scene {
//   private player!: Phaser.GameObjects.Rectangle;
//   private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
//   private wasd!: Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
//   private scoreText!: Phaser.GameObjects.Text;
//   private score = 0;
//   private gameOver = false;

//   private projectiles: Projectile[] = [];
//   private spawnTimer = 0;

//   constructor() {
//     super('GameScene');
//   }

//   create(): void {
//     const { width, height } = this.scale;
//     this.score = 0;
//     this.gameOver = false;
//     this.projectiles = [];

//     // Текст счета
//     this.scoreText = this.add.text(24, 24, 'Score: 0', {
//       fontFamily: 'system-ui, sans-serif',
//       fontSize: '24px',
//       color: '#ffffff',
//     });

//     // Центральный квадрат игрока (в центре экрана)
//     this.player = this.add.rectangle(width / 2, height / 2, 50, 50, 0x38bdf8);

//     // Управление (A/D и стрелки)
//     if (!this.input.keyboard) throw new Error('No keyboard');
//     this.cursors = this.input.keyboard.createCursorKeys();
//     this.wasd = this.input.keyboard.addKeys({
//       left: Phaser.Input.Keyboard.KeyCodes.A,
//       right: Phaser.Input.Keyboard.KeyCodes.D,
//     }) as Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
//   }

//   update(time: number, delta: number): void {
//     if (this.gameOver) return;

//     const seconds = delta / 1000;

//     // 1. Поворот квадрата вправо/влево со скоростью
//     const ROTATION_SPEED = 4; // Скорость вращения
//     if (this.cursors.left.isDown || this.wasd.left.isDown) {
//       this.player.rotation -= ROTATION_SPEED * seconds;
//     }
//     if (this.cursors.right.isDown || this.wasd.right.isDown) {
//       this.player.rotation += ROTATION_SPEED * seconds;
//     }

//     // 2. Спавн проджектайлов слева и справа
//     this.spawnTimer += delta;
//     if (this.spawnTimer > 700) { // каждые 0.7 сек
//       this.spawnProjectile();
//       this.spawnTimer = 0;
//     }

//     // 3. Движение проджектайлов к центру
//     const centerX = this.scale.width / 2;

//     for (let i = this.projectiles.length - 1; i >= 0; i--) {
//       const p = this.projectiles[i];
//       p.rect.x += p.speed * seconds;

//       // Проверка столкновения с игроком по расстоянию
//       const dist = Phaser.Math.Distance.Between(p.rect.x, p.rect.y, this.player.x, this.player.y);
      
//       if (dist < 35) { // Врезался в центр!
//         this.endGame();
//         return;
//       }

//       // Если пролетел центр и улетел за экран — даем очко и удаляем
//       if ((p.speed > 0 && p.rect.x > this.scale.width + 50) || 
//           (p.speed < 0 && p.rect.x < -50)) {
//         p.rect.destroy();
//         this.projectiles.splice(i, 1);
//         this.score += 1;
//         this.scoreText.setText(`Score: ${this.score}`);
//       }
//     }
//   }

//   private spawnProjectile(): void {
//     const { width, height } = this.scale;
//     const centerY = height / 2;

//     // Случайно выбираем сторону: 0 = слева, 1 = справа
//     const fromLeft = Math.random() > 0.5;
//     const startX = fromLeft ? -20 : width + 20;
    
//     // Летят с разной высотой (чуть выше/ниже центра)
//     const startY = centerY + Phaser.Math.Between(-25, 25);
    
//     // Скорость (если слева — летит вправо (+), если справа — влево (-))
//     const baseSpeed = 300 + Math.min(this.score * 10, 400); // ускоряются со счетом
//     const speed = fromLeft ? baseSpeed : -baseSpeed;

//     // Создаем квадрат-проджектаил (красный)
//     const rect = this.add.rectangle(startX, startY, 20, 20, 0xef4444);

//     this.projectiles.push({ rect, speed });
//   }

//   private endGame(): void {
//     this.gameOver = true;
//     this.player.setFillStyle(0xff0000); // Квадрат краснеет при смерти
    
//     this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, 'ИГРА ОКОНЧЕНА!\nНажми ПРОБЕЛ для рестарта', {
//       fontFamily: 'system-ui, sans-serif',
//       fontSize: '22px',
//       color: '#ffffff',
//       align: 'center'
//     }).setOrigin(0.5);

//     this.input.keyboard?.once('keydown-SPACE', () => {
//       this.scene.restart();
//     });
//   }
// }