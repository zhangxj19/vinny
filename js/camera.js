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
    // 目标：将玩家置于可视区域（HUD 下方）的中心
    const goalX = targetX * CELL_SIZE + CELL_SIZE / 2 - CANVAS_W / 2;
    const goalY = targetY * CELL_SIZE + CELL_SIZE / 2 - (CANVAS_H + HUD_HEIGHT) / 2;

    // 平滑插值
    const t = 1 - Math.exp(-this.smoothing * dt / 1000);
    this.x = lerp(this.x, goalX, t);
    this.y = lerp(this.y, goalY, t);

    // 钳制在迷宫边界（minY = -HUD_HEIGHT 确保迷宫顶部不被 HUD 遮挡）
    const maxX = mazeWidth * CELL_SIZE - CANVAS_W;
    const maxY = mazeHeight * CELL_SIZE - CANVAS_H;
    this.x = clamp(this.x, 0, Math.max(0, maxX));
    this.y = clamp(this.y, -HUD_HEIGHT, Math.max(-HUD_HEIGHT, maxY));
  }

  /** 立即对准目标（无插值） */
  snapTo(targetX, targetY, mazeWidth, mazeHeight) {
    this.x = targetX * CELL_SIZE + CELL_SIZE / 2 - CANVAS_W / 2;
    this.y = targetY * CELL_SIZE + CELL_SIZE / 2 - (CANVAS_H + HUD_HEIGHT) / 2;

    const maxX = mazeWidth * CELL_SIZE - CANVAS_W;
    const maxY = mazeHeight * CELL_SIZE - CANVAS_H;
    this.x = clamp(this.x, 0, Math.max(0, maxX));
    this.y = clamp(this.y, -HUD_HEIGHT, Math.max(-HUD_HEIGHT, maxY));
  }
}
