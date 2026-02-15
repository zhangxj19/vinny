/**
 * Cell — 迷宫中的一个格子
 * 记录四面墙壁状态和探索信息
 */
export class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.walls = { top: true, right: true, bottom: true, left: true };
    this.visited = false;     // 迷宫生成时使用
    this.explored = false;    // 玩家是否已探索（战争迷雾）
    this.item = null;         // 放置的道具
    this.lockedDoor = null;   // 锁门方向（如 'right'）
  }

  /** 获取未被访问的邻居（迷宫生成用） */
  getUnvisitedNeighbors(grid) {
    const neighbors = [];
    const { x, y } = this;
    if (y > 0 && !grid.get(x, y - 1).visited)
      neighbors.push({ cell: grid.get(x, y - 1), dir: 'top' });
    if (x < grid.width - 1 && !grid.get(x + 1, y).visited)
      neighbors.push({ cell: grid.get(x + 1, y), dir: 'right' });
    if (y < grid.height - 1 && !grid.get(x, y + 1).visited)
      neighbors.push({ cell: grid.get(x, y + 1), dir: 'bottom' });
    if (x > 0 && !grid.get(x - 1, y).visited)
      neighbors.push({ cell: grid.get(x - 1, y), dir: 'left' });
    return neighbors;
  }

  /** 该格是否为死胡同（仅一个出口） */
  isDeadEnd() {
    let openings = 0;
    for (const wall of Object.values(this.walls)) {
      if (!wall) openings++;
    }
    return openings === 1;
  }

  /** 获取通行方向列表 */
  getOpenDirections() {
    const dirs = [];
    if (!this.walls.top) dirs.push('top');
    if (!this.walls.right) dirs.push('right');
    if (!this.walls.bottom) dirs.push('bottom');
    if (!this.walls.left) dirs.push('left');
    return dirs;
  }

  /** 获取通行出口数量 */
  getOpenCount() {
    let count = 0;
    if (!this.walls.top) count++;
    if (!this.walls.right) count++;
    if (!this.walls.bottom) count++;
    if (!this.walls.left) count++;
    return count;
  }
}

/**
 * Grid — 二维网格容器
 */
export class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.cells.push(new Cell(x, y));
      }
    }
  }

  get(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.cells[y * this.width + x];
  }

  /** 移除两个相邻格子之间的墙壁 */
  removeWall(cell, neighbor, dir) {
    const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
    cell.walls[dir] = false;
    neighbor.walls[opposite[dir]] = false;
  }

  /** 检查两格之间是否可通行（无墙、无锁门或有钥匙） */
  canPass(x, y, dir, hasKey = false) {
    const cell = this.get(x, y);
    if (!cell) return false;
    if (cell.walls[dir]) return false;
    // 锁门检查
    if (cell.lockedDoor === dir && !hasKey) return false;
    return true;
  }

  /** 获取指定方向的邻居坐标 */
  neighbor(x, y, dir) {
    const offsets = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };
    const [dx, dy] = offsets[dir];
    return [x + dx, y + dy];
  }

  /** 重置探索状态 */
  resetExplored() {
    for (const cell of this.cells) {
      cell.explored = false;
    }
  }

  /** 获取所有死胡同格子 */
  getDeadEnds() {
    return this.cells.filter(c => c.isDeadEnd());
  }

  /** 获取所有交叉口（3个及以上出口） */
  getIntersections() {
    return this.cells.filter(c => c.getOpenCount() >= 3);
  }
}
