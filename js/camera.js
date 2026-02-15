import { CANVAS_W, CANVAS_H, CELL_SIZE, HUD_HEIGHT } from './config.js';
import { lerp, clamp } from './utils.js';

/**
 * 摄像机 — 平滑跟随玩家，钳制在迷宫边界内
 */
export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.smoothing = 8; // 越大跟随越快
  }

  /** 更新摄像机位置 */
  update(targetX, targetY, mazeWidth, mazeHeight, dt) {
    // 目标：将玩家置于游戏可视区域（HUD 下方）的中心
    const gameAreaH = CANVAS_H - HUD_HEIGHT;
    const goalX = targetX * CELL_SIZE + CELL_SIZE / 2 - CANVAS_W / 2;
    const goalY = targetY * CELL_SIZE + CELL_SIZE / 2 - gameAreaH / 2;

    // 平滑插值
    const t = 1 - Math.exp(-this.smoothing * dt / 1000);
    this.x = lerp(this.x, goalX, t);
    this.y = lerp(this.y, goalY, t);

    // 钳制在迷宫边界（游戏区域通过 ctx.translate 偏移，摄像机 minY = 0）
    const maxX = mazeWidth * CELL_SIZE - CANVAS_W;
    const maxY = mazeHeight * CELL_SIZE - gameAreaH;
    this.x = clamp(this.x, 0, Math.max(0, maxX));
    this.y = clamp(this.y, 0, Math.max(0, maxY));
  }

  /** 立即对准目标（无插值） */
  snapTo(targetX, targetY, mazeWidth, mazeHeight) {
    const gameAreaH = CANVAS_H - HUD_HEIGHT;
    this.x = targetX * CELL_SIZE + CELL_SIZE / 2 - CANVAS_W / 2;
    this.y = targetY * CELL_SIZE + CELL_SIZE / 2 - gameAreaH / 2;

    const maxX = mazeWidth * CELL_SIZE - CANVAS_W;
    const maxY = mazeHeight * CELL_SIZE - gameAreaH;
    this.x = clamp(this.x, 0, Math.max(0, maxX));
    this.y = clamp(this.y, 0, Math.max(0, maxY));
  }
}
