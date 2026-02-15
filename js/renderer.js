import {
  CANVAS_W, CANVAS_H, CELL_SIZE, SPRITE_SIZE,
  VIEW_RADIUS, FOG_EXPLORED_ALPHA, COLORS
} from './config.js';
import {
  PLAYER_SPRITE, CHASER_SPRITE, AMBUSHER_SPRITE, PATROLLER_SPRITE,
  KEY_SPRITE, COIN_SPRITE, BOOTS_SPRITE, SHIELD_SPRITE,
  FREEZE_SPRITE, MAP_SPRITE, EXIT_SPRITE,
  WALL_TILE, FLOOR_TILE
} from './sprites.js';
import { EnemyType } from './enemy.js';
import { ItemType } from './items.js';

/**
 * 渲染器 — 所有 Canvas 绘制逻辑
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // 离屏缓冲（用于迷雾合成）
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = CANVAS_W;
    this.fogCanvas.height = CANVAS_H;
    this.fogCtx = this.fogCanvas.getContext('2d');

    // 预渲染墙壁和地板瓦片
    this.wallTileCanvas = this._prerenderTile(WALL_TILE, 8);
    this.floorTileCanvas = this._prerenderTile(FLOOR_TILE, 8);
  }

  /** 预渲染一个瓦片纹理到离屏 canvas */
  _prerenderTile(tileData, size) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const tCtx = c.getContext('2d');
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (tileData[y] && tileData[y][x]) {
          tCtx.fillStyle = tileData[y][x];
          tCtx.fillRect(x, y, 1, 1);
        }
      }
    }
    return c;
  }

  /** 绘制像素 sprite */
  drawSprite(sprite, screenX, screenY, scale = 1, alpha = 1) {
    const ctx = this.ctx;
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    const pixelSize = (CELL_SIZE / SPRITE_SIZE) * scale;

    for (let y = 0; y < sprite.length; y++) {
      for (let x = 0; x < sprite[y].length; x++) {
        if (sprite[y][x]) {
          ctx.fillStyle = sprite[y][x];
          ctx.fillRect(
            screenX + x * pixelSize,
            screenY + y * pixelSize,
            Math.ceil(pixelSize),
            Math.ceil(pixelSize)
          );
        }
      }
    }
    ctx.globalAlpha = oldAlpha;
  }

  /** 清屏 */
  clear() {
    this.ctx.fillStyle = COLORS.bg;
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /** 绘制迷宫地板和墙壁 */
  drawMaze(grid, camera) {
    const ctx = this.ctx;
    const startCol = Math.max(0, Math.floor(camera.x / CELL_SIZE) - 1);
    const endCol = Math.min(grid.width, Math.ceil((camera.x + CANVAS_W) / CELL_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / CELL_SIZE) - 1);
    const endRow = Math.min(grid.height, Math.ceil((camera.y + CANVAS_H) / CELL_SIZE) + 1);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const cell = grid.get(x, y);
        const sx = x * CELL_SIZE - camera.x;
        const sy = y * CELL_SIZE - camera.y;

        // 地板（8x8 瓦片放大到 CELL_SIZE，imageSmoothingEnabled=false 保持像素锐利）
        ctx.drawImage(this.floorTileCanvas, sx, sy, CELL_SIZE, CELL_SIZE);

        // 墙壁
        const wallW = 3;

        if (cell.walls.top) {
          this._drawWallH(sx, sy, CELL_SIZE, wallW, cell.lockedDoor === 'top');
        }
        if (cell.walls.bottom) {
          this._drawWallH(sx, sy + CELL_SIZE - wallW, CELL_SIZE, wallW, cell.lockedDoor === 'bottom');
        }
        if (cell.walls.left) {
          this._drawWallV(sx, sy, wallW, CELL_SIZE, cell.lockedDoor === 'left');
        }
        if (cell.walls.right) {
          this._drawWallV(sx + CELL_SIZE - wallW, sy, wallW, CELL_SIZE, cell.lockedDoor === 'right');
        }
      }
    }
  }

  /** 绘制水平墙壁 */
  _drawWallH(x, y, w, h, locked) {
    const ctx = this.ctx;
    if (locked) {
      ctx.fillStyle = COLORS.lockedDoor;
      ctx.fillRect(x, y, w, h);
      // 锁孔装饰
      ctx.fillStyle = '#000';
      ctx.fillRect(x + w / 2 - 2, y, 4, h);
    } else {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = COLORS.wallHighlight;
      ctx.fillRect(x, y, w, 1);
    }
  }

  /** 绘制垂直墙壁 */
  _drawWallV(x, y, w, h, locked) {
    const ctx = this.ctx;
    if (locked) {
      ctx.fillStyle = COLORS.lockedDoor;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y + h / 2 - 2, w, 4);
    } else {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = COLORS.wallHighlight;
      ctx.fillRect(x, y, 1, h);
    }
  }

  /** 绘制出口 */
  drawExit(exitX, exitY, camera, time) {
    const sx = exitX * CELL_SIZE - camera.x;
    const sy = exitY * CELL_SIZE - camera.y;

    // 脉动光效
    const pulse = 0.85 + 0.15 * Math.sin(time / 300);
    this.drawSprite(EXIT_SPRITE, sx, sy, pulse);

    // 外发光
    const ctx = this.ctx;
    const glow = Math.abs(Math.sin(time / 500)) * 0.3;
    ctx.fillStyle = `rgba(0, 255, 68, ${glow})`;
    ctx.fillRect(sx - 2, sy - 2, CELL_SIZE + 4, CELL_SIZE + 4);
  }

  /** 绘制道具 */
  drawItems(grid, camera, time) {
    const startCol = Math.max(0, Math.floor(camera.x / CELL_SIZE) - 1);
    const endCol = Math.min(grid.width, Math.ceil((camera.x + CANVAS_W) / CELL_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / CELL_SIZE) - 1);
    const endRow = Math.min(grid.height, Math.ceil((camera.y + CANVAS_H) / CELL_SIZE) + 1);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const cell = grid.get(x, y);
        if (!cell.item) continue;

        const sx = x * CELL_SIZE - camera.x;
        const sy = y * CELL_SIZE - camera.y;

        // 脉动动画
        const pulse = 0.85 + 0.15 * Math.sin(time / 400 + x * 0.5 + y * 0.7);

        const sprite = this._getItemSprite(cell.item.type);
        if (sprite) {
          this.drawSprite(sprite, sx, sy, pulse);
        }
      }
    }
  }

  _getItemSprite(type) {
    switch (type) {
      case ItemType.KEY:    return KEY_SPRITE;
      case ItemType.COIN:   return COIN_SPRITE;
      case ItemType.BOOTS:  return BOOTS_SPRITE;
      case ItemType.SHIELD: return SHIELD_SPRITE;
      case ItemType.FREEZE: return FREEZE_SPRITE;
      case ItemType.MAP:    return MAP_SPRITE;
      default: return null;
    }
  }

  /** 绘制玩家 */
  drawPlayer(player, camera, time) {
    const sx = player.renderX * CELL_SIZE - camera.x;
    const sy = player.renderY * CELL_SIZE - camera.y;

    // 护盾光环
    if (player.hasShield) {
      const ctx = this.ctx;
      const glow = 0.2 + 0.1 * Math.sin(time / 300);
      ctx.fillStyle = `rgba(68, 170, 255, ${glow})`;
      ctx.beginPath();
      ctx.arc(sx + CELL_SIZE / 2, sy + CELL_SIZE / 2, CELL_SIZE * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 加速特效
    if (player.speedBoostTimer > 0) {
      const ctx = this.ctx;
      ctx.fillStyle = `rgba(0, 255, 136, 0.3)`;
      ctx.fillRect(sx + 4, sy + CELL_SIZE - 6, CELL_SIZE - 8, 4);
    }

    this.drawSprite(PLAYER_SPRITE, sx, sy);
  }

  /** 绘制敌人 */
  drawEnemies(enemies, camera, time) {
    for (const enemy of enemies) {
      const sx = enemy.renderX * CELL_SIZE - camera.x;
      const sy = enemy.renderY * CELL_SIZE - camera.y;

      // 跳过不在视口的敌人
      if (sx < -CELL_SIZE || sx > CANVAS_W || sy < -CELL_SIZE || sy > CANVAS_H) continue;

      let sprite;
      switch (enemy.type) {
        case EnemyType.CHASER:    sprite = CHASER_SPRITE; break;
        case EnemyType.AMBUSHER:  sprite = AMBUSHER_SPRITE; break;
        case EnemyType.PATROLLER: sprite = PATROLLER_SPRITE; break;
      }

      if (enemy.frozen) {
        // 冰冻效果：淡蓝色叠加
        this.drawSprite(sprite, sx, sy, 1, 0.6);
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(136, 238, 255, 0.3)';
        ctx.fillRect(sx, sy, CELL_SIZE, CELL_SIZE);
      } else {
        this.drawSprite(sprite, sx, sy);
      }

      // 感叹号动画：敌人发现玩家时弹出 "!"
      if (enemy.alerted && !enemy.frozen && enemy.alertShowTimer > 0) {
        const ctx = this.ctx;
        // 弹跳动画：前半段弹上，后半段回落
        const progress = 1 - enemy.alertShowTimer / 800;
        let bounceY;
        if (progress < 0.3) {
          // 弹上阶段
          bounceY = -12 * (progress / 0.3);
        } else {
          // 回落并停住
          const t = (progress - 0.3) / 0.7;
          bounceY = -12 * (1 - t * 0.5);
        }

        const alertX = sx + CELL_SIZE / 2;
        const alertY = sy - 4 + bounceY;

        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // 黑色描边增强可见度
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('!', alertX, alertY);
        // 黄色填充
        ctx.fillStyle = '#ffd700';
        ctx.fillText('!', alertX, alertY);
      }
    }
  }

  /**
   * 绘制战争迷雾
   * 使用 Canvas 合成实现：先画全黑遮罩，再用 destination-out 挖出可见区域
   */
  drawFog(grid, player, camera, mapRevealed) {
    const fogCtx = this.fogCtx;
    const playerScreenX = player.renderX * CELL_SIZE - camera.x + CELL_SIZE / 2;
    const playerScreenY = player.renderY * CELL_SIZE - camera.y + CELL_SIZE / 2;

    // 标记玩家周围为已探索
    const px = player.gridX;
    const py = player.gridY;
    for (let dy = -VIEW_RADIUS; dy <= VIEW_RADIUS; dy++) {
      for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
        if (dx * dx + dy * dy <= VIEW_RADIUS * VIEW_RADIUS) {
          const cell = grid.get(px + dx, py + dy);
          if (cell) cell.explored = true;
        }
      }
    }

    if (mapRevealed) {
      // 地图卷轴激活：不画迷雾
      return;
    }

    // 绘制迷雾层
    fogCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 1. 先填充全黑
    fogCtx.fillStyle = COLORS.fog;
    fogCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. 用 destination-out 挖出已探索区域（暗色）
    fogCtx.globalCompositeOperation = 'destination-out';

    // 已探索区域半透明挖出
    const startCol = Math.max(0, Math.floor(camera.x / CELL_SIZE) - 1);
    const endCol = Math.min(grid.width, Math.ceil((camera.x + CANVAS_W) / CELL_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / CELL_SIZE) - 1);
    const endRow = Math.min(grid.height, Math.ceil((camera.y + CANVAS_H) / CELL_SIZE) + 1);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const cell = grid.get(x, y);
        if (cell && cell.explored) {
          const sx = x * CELL_SIZE - camera.x;
          const sy = y * CELL_SIZE - camera.y;
          fogCtx.fillStyle = `rgba(0,0,0,${1 - FOG_EXPLORED_ALPHA})`;
          fogCtx.fillRect(sx, sy, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // 3. 玩家周围完全可见（圆形）
    fogCtx.fillStyle = 'rgba(0,0,0,1)';
    fogCtx.beginPath();
    fogCtx.arc(
      playerScreenX,
      playerScreenY,
      VIEW_RADIUS * CELL_SIZE,
      0,
      Math.PI * 2
    );
    fogCtx.fill();

    fogCtx.globalCompositeOperation = 'source-over';

    // 将迷雾层叠加到主画布
    this.ctx.drawImage(this.fogCanvas, 0, 0);
  }
}
