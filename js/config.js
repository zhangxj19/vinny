// ── 画布与渲染 ──
export const CANVAS_W = 800;
export const CANVAS_H = 600;
export const CELL_SIZE = 32;          // 每个格子在画布上的像素大小
export const HUD_HEIGHT = 36;        // 顶部 HUD 栏高度（像素）
export const SPRITE_SIZE = 12;        // sprite 原始像素尺寸
export const WALL_THICKNESS = 2;      // 墙壁厚度（像素）

// ── 迷宫 ──
export const BASE_MAZE_W = 15;       // 第一关迷宫宽度
export const BASE_MAZE_H = 15;       // 第一关迷宫高度
export const MAZE_GROW = 4;          // 每关增加格数
export const LOOP_RATIO = 0.08;      // 环路比例（随机移除墙壁）

// ── 玩家 ──
export const PLAYER_MOVE_DURATION = 120;  // 移动插值时长（ms）
export const PLAYER_SPEED_MULT = 1.0;     // 基础速度倍率
export const SPEED_BOOST_MULT = 1.5;      // 加速靴倍率
export const SPEED_BOOST_DURATION = 8000; // 加速靴持续时间（ms）
export const SHIELD_DURATION = Infinity;  // 护盾持续到被击中

// ── 敌人 ──
export const ENEMY_MISTAKE_CHANCE = 0.25;  // 每步 25% 概率走错方向
export const ENEMY_VIEW_RADIUS = 7;       // 敌人视野半径（格），超出则无法追踪玩家
export const ENEMY_BASE_COUNT = 1;        // 第一关敌人数量
export const ENEMY_ADD_PER_LEVEL = 1;     // 每关增加
export const ENEMY_MIN_SPAWN_RATIO = 0.6; // 最小出生距离（迷宫尺寸比例）

export const CHASER_SPEED = 0.6;          // 追踪者速度（玩家比例）
export const CHASER_REPATH_MS = 800;

export const AMBUSHER_SPEED = 0.55;
export const AMBUSHER_REPATH_MS = 1000;
export const AMBUSHER_LOOK_AHEAD = 2;     // 预判玩家前方格数

export const PATROLLER_SPEED_PATROL = 0.5;
export const PATROLLER_SPEED_CHASE = 0.65;
export const PATROLLER_REPATH_PATROL_MS = 1000;
export const PATROLLER_REPATH_CHASE_MS = 500;
export const PATROLLER_ALERT_DIST = 4;    // 进入追击模式的距离

// ── 道具 ──
export const FREEZE_DURATION = 5000;      // 冰冻球持续（ms）
export const MAP_REVEAL_DURATION = 8000;  // 地图卷轴持续（ms）
export const COIN_SCORE = 100;

// ── 战争迷雾 ──
export const VIEW_RADIUS = 7;             // 可见半径（格）
export const FOG_EXPLORED_ALPHA = 0.7;    // 已探索区域遮罩透明度

// ── 关卡 ──
export const LEVEL_TIME_BASE = 180;       // 基础限时（秒）
export const LEVEL_TIME_ADD = 40;         // 每关增加（秒）
export const LEVEL_BONUS = 500;           // 通关奖励分
export const TIME_SCORE_MULT = 10;        // 剩余时间分数倍率

// ── 颜色 ──
export const COLORS = {
  bg:           '#1a1a2e',
  wall:         '#4a4a6a',
  wallHighlight:'#5a5a7a',
  floor:        '#16213e',
  floorAlt:     '#1a2540',
  player:       '#00d4ff',
  chaser:       '#ff4444',
  ambusher:     '#ff8800',
  patroller:    '#cc44ff',
  key:          '#ffd700',
  coin:         '#ffcc00',
  boots:        '#00ff88',
  shield:       '#44aaff',
  freeze:       '#88eeff',
  mapScroll:    '#ff88ff',
  exit:         '#00ff44',
  exitGlow:     '#44ff88',
  lockedDoor:   '#ffd700',
  fog:          '#000000',
  fogExplored:  '#0a0a1a',
  hud:          '#ffffff',
  hudBg:        'rgba(0,0,0,0.6)',
};
