import {
  CHASER_SPEED, CHASER_REPATH_MS,
  AMBUSHER_SPEED, AMBUSHER_REPATH_MS, AMBUSHER_LOOK_AHEAD,
  PATROLLER_SPEED_PATROL, PATROLLER_SPEED_CHASE,
  PATROLLER_REPATH_PATROL_MS, PATROLLER_REPATH_CHASE_MS,
  PATROLLER_ALERT_DIST,
  PLAYER_MOVE_DURATION,
  ENEMY_MIN_SPAWN_RATIO,
} from './config.js';
import { astar } from './pathfinding.js';
import { manhattan, lerp, clamp, shuffle } from './utils.js';

const DIR_OFFSETS = {
  top:    { dx: 0, dy: -1 },
  down:   { dx: 0, dy: 1 },
  left:   { dx: -1, dy: 0 },
  right:  { dx: 1, dy: 0 },
};

/** 敌人类型枚举 */
export const EnemyType = {
  CHASER: 'chaser',
  AMBUSHER: 'ambusher',
  PATROLLER: 'patroller',
};

/**
 * 敌人实体
 */
export class Enemy {
  constructor(x, y, type) {
    this.gridX = x;
    this.gridY = y;
    this.renderX = x;
    this.renderY = y;
    this.type = type;
    this.frozen = false;
    this.frozenTimer = 0;

    // 移动状态
    this.moving = false;
    this.moveStartX = x;
    this.moveStartY = y;
    this.moveTargetX = x;
    this.moveTargetY = y;
    this.moveTimer = 0;
    this.moveDuration = 200;

    // 路径
    this.path = [];
    this.pathIndex = 0;
    this.repathTimer = 0;

    // 巡逻者状态
    this.alertMode = false;
    this.patrolTarget = null;

    this._configByType();
  }

  _configByType() {
    switch (this.type) {
      case EnemyType.CHASER:
        this.speedMult = CHASER_SPEED;
        this.repathInterval = CHASER_REPATH_MS;
        break;
      case EnemyType.AMBUSHER:
        this.speedMult = AMBUSHER_SPEED;
        this.repathInterval = AMBUSHER_REPATH_MS;
        break;
      case EnemyType.PATROLLER:
        this.speedMult = PATROLLER_SPEED_PATROL;
        this.repathInterval = PATROLLER_REPATH_PATROL_MS;
        break;
    }
  }

  /** 计算目标位置（根据 AI 类型） */
  getTarget(player, grid) {
    switch (this.type) {
      case EnemyType.CHASER:
        return { x: player.gridX, y: player.gridY };

      case EnemyType.AMBUSHER: {
        // 预判玩家前方位置
        const offsets = {
          up: { dx: 0, dy: -1 },
          down: { dx: 0, dy: 1 },
          left: { dx: -1, dy: 0 },
          right: { dx: 1, dy: 0 },
        };
        const off = offsets[player.facing] || { dx: 0, dy: 0 };
        const tx = clamp(player.gridX + off.dx * AMBUSHER_LOOK_AHEAD, 0, grid.width - 1);
        const ty = clamp(player.gridY + off.dy * AMBUSHER_LOOK_AHEAD, 0, grid.height - 1);
        return { x: tx, y: ty };
      }

      case EnemyType.PATROLLER: {
        const dist = manhattan(this.gridX, this.gridY, player.gridX, player.gridY);

        if (dist <= PATROLLER_ALERT_DIST) {
          // 切换到追击模式
          if (!this.alertMode) {
            this.alertMode = true;
            this.speedMult = PATROLLER_SPEED_CHASE;
            this.repathInterval = PATROLLER_REPATH_CHASE_MS;
          }
          return { x: player.gridX, y: player.gridY };
        } else {
          // 巡逻模式
          if (this.alertMode) {
            this.alertMode = false;
            this.speedMult = PATROLLER_SPEED_PATROL;
            this.repathInterval = PATROLLER_REPATH_PATROL_MS;
          }
          // 选择随机巡逻点
          if (!this.patrolTarget ||
              (this.gridX === this.patrolTarget.x && this.gridY === this.patrolTarget.y)) {
            this.patrolTarget = this._randomPatrolTarget(grid);
          }
          return this.patrolTarget;
        }
      }

      default:
        return { x: player.gridX, y: player.gridY };
    }
  }

  _randomPatrolTarget(grid) {
    // 随机选一个交叉口或死胡同作为巡逻目标
    const candidates = grid.getIntersections();
    if (candidates.length === 0) return { x: this.gridX, y: this.gridY };
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return { x: pick.x, y: pick.y };
  }

  /** 更新敌人状态 */
  update(dt, player, grid) {
    // 冰冻状态
    if (this.frozen) {
      this.frozenTimer -= dt;
      if (this.frozenTimer <= 0) {
        this.frozen = false;
        this.frozenTimer = 0;
      }
      return;
    }

    // 路径重算计时
    this.repathTimer -= dt;
    if (this.repathTimer <= 0) {
      this.repathTimer = this.repathInterval;
      const target = this.getTarget(player, grid);
      const newPath = astar(grid, this.gridX, this.gridY, target.x, target.y);
      if (newPath && newPath.length > 1) {
        this.path = newPath;
        this.pathIndex = 1; // 跳过起点
      }
    }

    // 沿路径移动
    if (!this.moving && this.path.length > 0 && this.pathIndex < this.path.length) {
      const [nx, ny] = this.path[this.pathIndex];

      // 验证可通行
      const dx = nx - this.gridX;
      const dy = ny - this.gridY;
      let dir;
      if (dx === 1) dir = 'right';
      else if (dx === -1) dir = 'left';
      else if (dy === 1) dir = 'bottom';
      else if (dy === -1) dir = 'top';

      const cell = grid.get(this.gridX, this.gridY);
      if (dir && cell && !cell.walls[dir]) {
        this.moving = true;
        this.moveStartX = this.gridX;
        this.moveStartY = this.gridY;
        this.moveTargetX = nx;
        this.moveTargetY = ny;
        this.moveTimer = 0;
        this.moveDuration = PLAYER_MOVE_DURATION / this.speedMult;
        this.gridX = nx;
        this.gridY = ny;
        this.pathIndex++;
      } else {
        // 路径失效，强制重算
        this.path = [];
        this.repathTimer = 0;
      }
    }

    // 移动插值
    if (this.moving) {
      this.moveTimer += dt;
      const t = Math.min(this.moveTimer / this.moveDuration, 1);
      this.renderX = lerp(this.moveStartX, this.moveTargetX, t);
      this.renderY = lerp(this.moveStartY, this.moveTargetY, t);

      if (t >= 1) {
        this.moving = false;
        this.renderX = this.moveTargetX;
        this.renderY = this.moveTargetY;
      }
    }
  }

  /** 冰冻该敌人 */
  freeze(duration) {
    this.frozen = true;
    this.frozenTimer = duration;
  }
}

/**
 * 在迷宫中为敌人选择出生点
 * 确保距离玩家足够远
 */
export function pickEnemySpawns(grid, count, playerX, playerY, distMap) {
  const maxDist = distMap ? Math.max(...distMap.values()) : grid.width + grid.height;
  const minDist = Math.floor(maxDist * ENEMY_MIN_SPAWN_RATIO);

  // 收集所有足够远的格子
  const candidates = [];
  for (const cell of grid.cells) {
    const key = `${cell.x},${cell.y}`;
    const d = distMap ? (distMap.get(key) || 0) : manhattan(cell.x, cell.y, playerX, playerY);
    if (d >= minDist) {
      candidates.push(cell);
    }
  }

  // 如果候选不够，降低距离要求
  if (candidates.length < count) {
    const allCells = [...grid.cells]
      .filter(c => !(c.x === playerX && c.y === playerY))
      .sort((a, b) => {
        const da = distMap ? (distMap.get(`${a.x},${a.y}`) || 0) : manhattan(a.x, a.y, playerX, playerY);
        const db = distMap ? (distMap.get(`${b.x},${b.y}`) || 0) : manhattan(b.x, b.y, playerX, playerY);
        return db - da;
      });
    return allCells.slice(0, count).map(c => ({ x: c.x, y: c.y }));
  }

  shuffle(candidates);
  return candidates.slice(0, count).map(c => ({ x: c.x, y: c.y }));
}

/**
 * 创建敌人实例数组
 * 交替分配三种类型
 */
export function createEnemies(spawns) {
  const types = [EnemyType.CHASER, EnemyType.AMBUSHER, EnemyType.PATROLLER];
  return spawns.map((pos, i) => {
    const type = types[i % types.length];
    const enemy = new Enemy(pos.x, pos.y, type);
    // 交错路径重算以避免同帧计算
    enemy.repathTimer = (i * 100) % enemy.repathInterval;
    return enemy;
  });
}
