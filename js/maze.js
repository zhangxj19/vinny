import { Grid } from './grid.js';
import { LOOP_RATIO } from './config.js';
import { shuffle, randInt } from './utils.js';

/**
 * 使用递归回溯法（深度优先）生成完美迷宫
 * 然后随机移除一些墙壁创建环路
 */
export function generateMaze(width, height) {
  const grid = new Grid(width, height);

  // ── 递归回溯法 ──
  const stack = [];
  const start = grid.get(0, 0);
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = current.getUnvisitedNeighbors(grid);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const { cell: next, dir } = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid.removeWall(current, next, dir);
      next.visited = true;
      stack.push(next);
    }
  }

  // 重置 visited 标记
  for (const cell of grid.cells) {
    cell.visited = false;
  }

  // ── 创建环路 ──
  addLoops(grid);

  return grid;
}

/**
 * 随机移除墙壁以创建环路
 * 环路让玩家有多条逃跑路线，而非唯一路径
 */
function addLoops(grid) {
  const wallPairs = [];

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.get(x, y);
      // 仅检查右边和下边，避免重复
      if (x < grid.width - 1 && cell.walls.right) {
        wallPairs.push({ x, y, dir: 'right' });
      }
      if (y < grid.height - 1 && cell.walls.bottom) {
        wallPairs.push({ x, y, dir: 'bottom' });
      }
    }
  }

  shuffle(wallPairs);
  const removeCount = Math.floor(wallPairs.length * LOOP_RATIO);

  for (let i = 0; i < removeCount && i < wallPairs.length; i++) {
    const { x, y, dir } = wallPairs[i];
    const cell = grid.get(x, y);
    const [nx, ny] = grid.neighbor(x, y, dir);
    const neighbor = grid.get(nx, ny);
    if (neighbor) {
      grid.removeWall(cell, neighbor, dir);
    }
  }
}

/**
 * 在迷宫中放置锁门
 * 锁门放在从起点到终点路径上的关键位置
 */
export function placeLocks(grid, numLocks) {
  if (numLocks <= 0) return [];

  // 用 BFS 找起点到终点的路径
  const path = bfsPath(grid, 0, 0, grid.width - 1, grid.height - 1);
  if (!path || path.length < 6) return [];

  const locks = [];
  // 在路径的中段放置锁门，避免太靠近起点/终点
  const segment = Math.floor(path.length / (numLocks + 1));

  for (let i = 0; i < numLocks; i++) {
    const idx = segment * (i + 1);
    if (idx >= path.length - 1) break;

    const [cx, cy] = path[idx];
    const [nx, ny] = path[idx + 1];

    // 确定方向
    let dir;
    if (nx > cx) dir = 'right';
    else if (nx < cx) dir = 'left';
    else if (ny > cy) dir = 'bottom';
    else dir = 'top';

    const cell = grid.get(cx, cy);
    if (!cell.walls[dir] && !cell.lockedDoor) {
      cell.lockedDoor = dir;
      // 对面也要标记
      const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
      const nCell = grid.get(nx, ny);
      if (nCell) nCell.lockedDoor = opposite[dir];
      locks.push({ x: cx, y: cy, dir });
    }
  }

  return locks;
}

/** BFS 寻路（返回坐标数组） */
function bfsPath(grid, sx, sy, ex, ey) {
  const queue = [[sx, sy]];
  const came = new Map();
  came.set(`${sx},${sy}`, null);

  const dirs = ['top', 'right', 'bottom', 'left'];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();

    if (cx === ex && cy === ey) {
      // 回溯路径
      const path = [];
      let key = `${ex},${ey}`;
      while (key) {
        const [x, y] = key.split(',').map(Number);
        path.unshift([x, y]);
        key = came.get(key);
      }
      return path;
    }

    for (const dir of dirs) {
      if (!grid.get(cx, cy).walls[dir]) {
        const [nx, ny] = grid.neighbor(cx, cy, dir);
        const nKey = `${nx},${ny}`;
        if (!came.has(nKey)) {
          came.set(nKey, `${cx},${cy}`);
          queue.push([nx, ny]);
        }
      }
    }
  }

  return null;
}

/**
 * 计算从起点到各点的路径距离（BFS）
 * 用于确保敌人出生点远离玩家
 */
export function distanceMap(grid, sx, sy) {
  const dist = new Map();
  const queue = [[sx, sy, 0]];
  dist.set(`${sx},${sy}`, 0);

  const dirs = ['top', 'right', 'bottom', 'left'];

  while (queue.length > 0) {
    const [cx, cy, d] = queue.shift();

    for (const dir of dirs) {
      if (!grid.get(cx, cy).walls[dir]) {
        const [nx, ny] = grid.neighbor(cx, cy, dir);
        const nKey = `${nx},${ny}`;
        if (!dist.has(nKey)) {
          dist.set(nKey, d + 1);
          queue.push([nx, ny, d + 1]);
        }
      }
    }
  }

  return dist;
}
