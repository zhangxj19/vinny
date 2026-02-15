import {
  PLAYER_MOVE_DURATION, PLAYER_SPEED_MULT, SPEED_BOOST_MULT,
  SPEED_BOOST_DURATION
} from './config.js';
import { lerp } from './utils.js';

const DIR_OFFSETS = {
  up:    { dx: 0, dy: -1 },
  down:  { dx: 0, dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const DIR_TO_WALL = {
  up: 'top',
  down: 'bottom',
  left: 'left',
  right: 'right',
};

/**
 * 玩家实体
 * 网格对齐移动 + 平滑插值过渡
 */
export class Player {
  constructor(x, y) {
    // 网格坐标
    this.gridX = x;
    this.gridY = y;
    // 渲染坐标（用于平滑插值）
    this.renderX = x;
    this.renderY = y;
    // 移动状态
    this.moving = false;
    this.moveStartX = x;
    this.moveStartY = y;
    this.moveTargetX = x;
    this.moveTargetY = y;
    this.moveTimer = 0;
    this.moveDuration = PLAYER_MOVE_DURATION;
    // 朝向
    this.facing = 'down';
    // 背包
    this.keys = 0;
    this.coins = 0;
    this.score = 0;
    // buff 状态
    this.hasShield = false;
    this.speedBoostTimer = 0;
    this.frozen = false;
  }

  /** 获取当前速度倍率 */
  getSpeedMult() {
    let mult = PLAYER_SPEED_MULT;
    if (this.speedBoostTimer > 0) mult *= SPEED_BOOST_MULT;
    return mult;
  }

  /** 尝试沿指定方向移动 */
  tryMove(dir, grid) {
    if (this.moving) return false;

    const wall = DIR_TO_WALL[dir];
    const cell = grid.get(this.gridX, this.gridY);

    // 检查墙壁
    if (cell.walls[wall]) return false;

    // 检查锁门
    if (cell.lockedDoor === wall) {
      if (this.keys > 0) {
        this.keys--;
        cell.lockedDoor = null;
        // 清除对面的锁门标记
        const [nx, ny] = grid.neighbor(this.gridX, this.gridY, wall);
        const nCell = grid.get(nx, ny);
        const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
        if (nCell) nCell.lockedDoor = null;
      } else {
        return false;
      }
    }

    const offset = DIR_OFFSETS[dir];
    const nx = this.gridX + offset.dx;
    const ny = this.gridY + offset.dy;

    // 边界检查
    if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) return false;

    // 开始移动
    this.moving = true;
    this.moveStartX = this.gridX;
    this.moveStartY = this.gridY;
    this.moveTargetX = nx;
    this.moveTargetY = ny;
    this.moveTimer = 0;
    this.moveDuration = PLAYER_MOVE_DURATION / this.getSpeedMult();
    this.facing = dir;
    this.gridX = nx;
    this.gridY = ny;

    return true;
  }

  /** 更新移动插值 */
  update(dt) {
    // buff 计时
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) this.speedBoostTimer = 0;
    }

    // 移动插值
    if (this.moving) {
      this.moveTimer += dt;
      const t = Math.min(this.moveTimer / this.moveDuration, 1);
      // 使用 ease-out 插值让停止更自然
      const eased = 1 - (1 - t) * (1 - t);
      this.renderX = lerp(this.moveStartX, this.moveTargetX, eased);
      this.renderY = lerp(this.moveStartY, this.moveTargetY, eased);

      if (t >= 1) {
        this.moving = false;
        this.renderX = this.moveTargetX;
        this.renderY = this.moveTargetY;
      }
    }
  }

  /** 应用加速靴 */
  applySpeedBoost() {
    this.speedBoostTimer = SPEED_BOOST_DURATION;
  }

  /** 应用护盾 */
  applyShield() {
    this.hasShield = true;
  }

  /** 使用护盾抵挡一次伤害，返回 true 表示成功抵挡 */
  useShield() {
    if (this.hasShield) {
      this.hasShield = false;
      return true;
    }
    return false;
  }

  /** 拾取钥匙 */
  addKey() {
    this.keys++;
  }

  /** 拾取金币 */
  addCoin(value) {
    this.coins++;
    this.score += value;
  }
}
