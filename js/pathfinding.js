import { manhattan } from './utils.js';

/**
 * A* 寻路算法
 * 在迷宫网格中找到从 (sx,sy) 到 (ex,ey) 的最短路径
 *
 * 使用二叉堆优化的开放列表，避免大迷宫中的性能问题
 */

const DIRS = ['top', 'right', 'bottom', 'left'];
const DIR_OFFSETS = {
  top:    [0, -1],
  right:  [1, 0],
  bottom: [0, 1],
  left:   [-1, 0],
};

/**
 * @param {Grid} grid - 迷宫网格
 * @param {number} sx - 起点 X
 * @param {number} sy - 起点 Y
 * @param {number} ex - 终点 X
 * @param {number} ey - 终点 Y
 * @param {boolean} ignoreLocks - 敌人忽略锁门
 * @returns {Array<[number,number]>|null} 路径坐标数组（含起点），或 null
 */
export function astar(grid, sx, sy, ex, ey, ignoreLocks = true) {
  // 起止相同
  if (sx === ex && sy === ey) return [[sx, sy]];

  const w = grid.width;
  const size = w * grid.height;

  // 使用 typed arrays 优化性能
  const gScore = new Float32Array(size).fill(Infinity);
  const fScore = new Float32Array(size).fill(Infinity);
  const cameFrom = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);

  const startIdx = sy * w + sx;
  const endIdx = ey * w + ex;

  gScore[startIdx] = 0;
  fScore[startIdx] = manhattan(sx, sy, ex, ey);

  // 简易二叉堆（[fScore, index]）
  const open = new MinHeap();
  open.push(fScore[startIdx], startIdx);

  while (open.size > 0) {
    const currentIdx = open.pop();

    if (currentIdx === endIdx) {
      return reconstructPath(cameFrom, currentIdx, w);
    }

    if (closed[currentIdx]) continue;
    closed[currentIdx] = 1;

    const cx = currentIdx % w;
    const cy = (currentIdx - cx) / w;
    const cell = grid.get(cx, cy);

    for (const dir of DIRS) {
      // 检查墙壁
      if (cell.walls[dir]) continue;

      // 检查锁门（敌人可忽略）
      if (!ignoreLocks && cell.lockedDoor === dir) continue;

      const [dx, dy] = DIR_OFFSETS[dir];
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) continue;

      const nIdx = ny * w + nx;
      if (closed[nIdx]) continue;

      const tentativeG = gScore[currentIdx] + 1;

      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = currentIdx;
        gScore[nIdx] = tentativeG;
        fScore[nIdx] = tentativeG + manhattan(nx, ny, ex, ey);
        open.push(fScore[nIdx], nIdx);
      }
    }
  }

  return null; // 无路径
}

/** 回溯路径 */
function reconstructPath(cameFrom, endIdx, w) {
  const path = [];
  let idx = endIdx;
  while (idx !== -1) {
    const x = idx % w;
    const y = (idx - x) / w;
    path.unshift([x, y]);
    idx = cameFrom[idx];
  }
  return path;
}

/**
 * 最小堆 — 按 fScore 排序
 */
class MinHeap {
  constructor() {
    this.data = []; // [fScore, index] pairs stored flat: [f0, i0, f1, i1, ...]
    this.size = 0;
  }

  push(f, idx) {
    const pos = this.size;
    this.size++;
    if (this.data.length < this.size * 2) {
      this.data.push(f, idx);
    } else {
      this.data[pos * 2] = f;
      this.data[pos * 2 + 1] = idx;
    }
    this._bubbleUp(pos);
  }

  pop() {
    const idx = this.data[1];
    this.size--;
    if (this.size > 0) {
      this.data[0] = this.data[this.size * 2];
      this.data[1] = this.data[this.size * 2 + 1];
      this._sinkDown(0);
    }
    return idx;
  }

  _bubbleUp(pos) {
    while (pos > 0) {
      const parent = (pos - 1) >> 1;
      if (this.data[pos * 2] < this.data[parent * 2]) {
        this._swap(pos, parent);
        pos = parent;
      } else {
        break;
      }
    }
  }

  _sinkDown(pos) {
    while (true) {
      let smallest = pos;
      const left = 2 * pos + 1;
      const right = 2 * pos + 2;

      if (left < this.size && this.data[left * 2] < this.data[smallest * 2]) {
        smallest = left;
      }
      if (right < this.size && this.data[right * 2] < this.data[smallest * 2]) {
        smallest = right;
      }
      if (smallest !== pos) {
        this._swap(pos, smallest);
        pos = smallest;
      } else {
        break;
      }
    }
  }

  _swap(a, b) {
    const tf = this.data[a * 2];
    const ti = this.data[a * 2 + 1];
    this.data[a * 2] = this.data[b * 2];
    this.data[a * 2 + 1] = this.data[b * 2 + 1];
    this.data[b * 2] = tf;
    this.data[b * 2 + 1] = ti;
  }
}
