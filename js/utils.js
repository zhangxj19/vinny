/** 线性插值 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** 钳制范围 */
export function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

/** Fisher-Yates 洗牌 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 曼哈顿距离 */
export function manhattan(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/** 范围随机整数 [min, max) */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/** 方向偏移 */
export const DIR = {
  up:    { dx: 0, dy: -1 },
  down:  { dx: 0, dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** 反方向映射 */
export const OPPOSITE = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** 方向名到墙壁键 */
export const DIR_TO_WALL = {
  up: 'top',
  down: 'bottom',
  left: 'left',
  right: 'right',
};
