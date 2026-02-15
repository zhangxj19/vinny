import {
  CANVAS_W, CANVAS_H, HUD_HEIGHT,
  BASE_MAZE_W, BASE_MAZE_H, MAZE_GROW,
  ENEMY_BASE_COUNT, ENEMY_ADD_PER_LEVEL,
  FREEZE_DURATION, MAP_REVEAL_DURATION,
  LEVEL_TIME_BASE, LEVEL_TIME_ADD,
  LEVEL_BONUS, TIME_SCORE_MULT,
  VIEW_RADIUS,
} from './config.js';
import { generateMaze, placeLocks, distanceMap } from './maze.js';
import { Player } from './player.js';
import { pickEnemySpawns, createEnemies } from './enemy.js';
import { placeItems, pickupItem } from './items.js';
import { Renderer } from './renderer.js';
import { Camera } from './camera.js';
import { Input } from './input.js';
import { drawMenu, drawPause, drawLevelComplete, drawGameOver, drawHUD } from './ui.js';

/** 游戏状态枚举 */
const State = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
};

/**
 * Game — 主游戏类
 * 管理游戏循环、状态机、关卡初始化
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.camera = new Camera();
    this.input = new Input();

    this.state = State.MENU;
    this.level = 1;
    this.grid = null;
    this.player = null;
    this.enemies = [];
    this.exitX = 0;
    this.exitY = 0;
    this.timeLeft = 0;
    this.gameTime = 0;

    // 游戏状态共享对象（用于道具效果）
    this.gameState = {
      freezeDuration: FREEZE_DURATION,
      mapRevealDuration: MAP_REVEAL_DURATION,
      mapRevealTimer: 0,
    };

    // 拾取提示信息
    this.message = { text: '', timer: 0 };

    // 通关数据
    this.timeBonus = 0;

    // 游戏结束原因
    this.deathReason = '';

    // 暂停防抖
    this._pauseDebounce = 0;

    // 启动游戏循环
    this.lastTime = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  /** 初始化关卡 */
  initLevel() {
    const w = BASE_MAZE_W + (this.level - 1) * MAZE_GROW;
    const h = BASE_MAZE_H + (this.level - 1) * MAZE_GROW;
    const mazeW = Math.min(w, 35);
    const mazeH = Math.min(h, 35);

    // 生成迷宫
    this.grid = generateMaze(mazeW, mazeH);

    // 放置锁门
    const numLocks = Math.min(this.level, 3);
    placeLocks(this.grid, numLocks);

    // 玩家出生在左上角
    this.player = new Player(0, 0);
    // 继承之前的分数
    if (this._prevScore !== undefined) {
      this.player.score = this._prevScore;
    }

    // 出口在右下角
    this.exitX = mazeW - 1;
    this.exitY = mazeH - 1;

    // 计算距离图
    const dMap = distanceMap(this.grid, 0, 0);

    // 放置敌人
    const enemyCount = ENEMY_BASE_COUNT + (this.level - 1) * ENEMY_ADD_PER_LEVEL;
    const spawns = pickEnemySpawns(this.grid, enemyCount, 0, 0, dMap);
    this.enemies = createEnemies(spawns);

    // 放置道具（钥匙数 = 锁门数 + 1 作为余量）
    placeItems(this.grid, numLocks + 1, this.level);

    // 时间限制
    this.timeLeft = LEVEL_TIME_BASE + (this.level - 1) * LEVEL_TIME_ADD;

    // 重置游戏状态
    this.gameState.mapRevealTimer = 0;
    this.message = { text: '', timer: 0 };
    this.gameTime = 0;

    // 摄像机对准玩家
    this.camera.snapTo(0, 0, this.grid.width, this.grid.height);
  }

  /** 游戏主循环 */
  _loop(now) {
    const dt = Math.min(now - this.lastTime, 50); // 限制最大 dt 防止跳帧
    this.lastTime = now;

    this.update(dt);
    this.render(now);

    requestAnimationFrame(this._loop);
  }

  /** 更新逻辑 */
  update(dt) {
    this._pauseDebounce -= dt;

    switch (this.state) {
      case State.MENU:
        if (this.input.consumeKey('Enter') || this.input.consumeKey(' ')) {
          this.level = 1;
          this._prevScore = 0;
          this.initLevel();
          this.state = State.PLAYING;
        }
        break;

      case State.PLAYING:
        this._updatePlaying(dt);
        break;

      case State.PAUSED:
        if ((this.input.consumeKey('Escape') || this.input.consumeKey('p') || this.input.consumeKey('P'))
            && this._pauseDebounce <= 0) {
          this.state = State.PLAYING;
          this._pauseDebounce = 200;
        }
        break;

      case State.LEVEL_COMPLETE:
        if (this.input.consumeKey('Enter') || this.input.consumeKey(' ')) {
          this._prevScore = this.player.score;
          this.level++;
          this.initLevel();
          this.state = State.PLAYING;
        }
        break;

      case State.GAME_OVER:
        if (this.input.consumeKey('Enter') || this.input.consumeKey(' ')) {
          this.state = State.MENU;
        }
        break;
    }
  }

  /** 游戏进行中更新 */
  _updatePlaying(dt) {
    // 暂停
    if ((this.input.consumeKey('Escape') || this.input.consumeKey('p') || this.input.consumeKey('P'))
        && this._pauseDebounce <= 0) {
      this.state = State.PAUSED;
      this._pauseDebounce = 200;
      return;
    }

    this.gameTime += dt;

    // 倒计时
    this.timeLeft -= dt / 1000;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.deathReason = '时间耗尽！';
      this.state = State.GAME_OVER;
      return;
    }

    // 地图卷轴计时
    if (this.gameState.mapRevealTimer > 0) {
      this.gameState.mapRevealTimer -= dt;
    }

    // 拾取消息计时
    if (this.message.timer > 0) {
      this.message.timer -= dt;
    }

    // 玩家移动（仅在非动画时消费输入缓冲，避免丢失按键）
    if (!this.player.moving) {
      const dir = this.input.getDirection();
      if (dir) {
        this.player.tryMove(dir, this.grid);
      }
    }
    this.player.update(dt);

    // 道具拾取
    const pickup = pickupItem(this.player, this.grid, this.enemies, this.gameState);
    if (pickup) {
      this.message = { text: `获得 ${pickup.name}`, timer: 1500 };
    }

    // 敌人更新
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player, this.grid);
    }

    // 碰撞检测（玩家 vs 敌人）
    for (const enemy of this.enemies) {
      if (enemy.frozen) continue;
      if (enemy.gridX === this.player.gridX && enemy.gridY === this.player.gridY) {
        if (this.player.useShield()) {
          this.message = { text: '护盾抵挡了攻击！', timer: 2000 };
          // 击退敌人：强制重新寻路
          enemy.path = [];
          enemy.repathTimer = 0;
        } else {
          this.deathReason = '被敌人抓到了！';
          this.state = State.GAME_OVER;
          return;
        }
      }
    }

    // 到达出口
    if (this.player.gridX === this.exitX && this.player.gridY === this.exitY) {
      // 检查是否有锁门（如果所有锁门都开了就通过）
      this.timeBonus = Math.floor(this.timeLeft) * TIME_SCORE_MULT;
      this.player.score += LEVEL_BONUS + this.timeBonus;
      this.state = State.LEVEL_COMPLETE;
      return;
    }

    // 摄像机跟随
    this.camera.update(
      this.player.renderX, this.player.renderY,
      this.grid.width, this.grid.height, dt
    );
  }

  /** 渲染 */
  render(now) {
    const ctx = this.renderer.ctx;

    switch (this.state) {
      case State.MENU:
        drawMenu(ctx);
        break;

      case State.PLAYING:
      case State.PAUSED:
        this._renderGame(now);
        if (this.state === State.PAUSED) {
          drawPause(ctx);
        }
        break;

      case State.LEVEL_COMPLETE:
        this._renderGame(now);
        drawLevelComplete(ctx, this.level, this.player.score, this.timeBonus);
        break;

      case State.GAME_OVER:
        this._renderGame(now);
        drawGameOver(ctx, this.deathReason, this.player.score, this.level);
        break;
    }
  }

  /** 绘制游戏场景 */
  _renderGame(now) {
    this.renderer.clear();

    // 将游戏区域下移 HUD_HEIGHT，避免地图被顶部状态栏遮挡
    const ctx = this.renderer.ctx;
    ctx.save();
    ctx.translate(0, HUD_HEIGHT);

    this.renderer.drawMaze(this.grid, this.camera);
    this.renderer.drawExit(this.exitX, this.exitY, this.camera, now);
    this.renderer.drawItems(this.grid, this.camera, now);
    this.renderer.drawPlayer(this.player, this.camera, now);

    // 敌人只在可见范围内绘制（迷雾限制）
    const mapRevealed = this.gameState.mapRevealTimer > 0;
    if (mapRevealed) {
      this.renderer.drawEnemies(this.enemies, this.camera, now);
    } else {
      // 只绘制可见范围内的敌人
      const visibleEnemies = this.enemies.filter(e => {
        const dx = e.gridX - this.player.gridX;
        const dy = e.gridY - this.player.gridY;
        return dx * dx + dy * dy <= (VIEW_RADIUS + 1) * (VIEW_RADIUS + 1);
      });
      this.renderer.drawEnemies(visibleEnemies, this.camera, now);
    }

    // 战争迷雾
    this.renderer.drawFog(this.grid, this.player, this.camera, mapRevealed);

    ctx.restore();

    // HUD 固定在屏幕顶部（不受 translate 影响）
    drawHUD(this.renderer.ctx, this.player, this.level, this.timeLeft, this.message);
  }
}

// 启动游戏
new Game();
