import { COIN_SCORE } from './config.js';
import { shuffle } from './utils.js';

/** 道具类型 */
export const ItemType = {
  KEY:    'key',
  COIN:   'coin',
  BOOTS:  'boots',
  SHIELD: 'shield',
  FREEZE: 'freeze',
  MAP:    'map',
};

/** 道具定义 */
const ITEM_DEFS = {
  [ItemType.KEY]:    { name: '钥匙',     rarity: 0 },
  [ItemType.COIN]:   { name: '金币',     rarity: 0 },
  [ItemType.BOOTS]:  { name: '加速靴',   rarity: 1 },
  [ItemType.SHIELD]: { name: '护盾',     rarity: 1 },
  [ItemType.FREEZE]: { name: '冰冻球',   rarity: 2 },
  [ItemType.MAP]:    { name: '地图卷轴', rarity: 3 },
};

/**
 * 在迷宫中放置道具
 * @param {Grid} grid - 迷宫网格
 * @param {number} numKeys - 需要的钥匙数
 * @param {number} level - 当前关卡（影响道具数量）
 * @returns {Array} 放置的道具列表
 */
export function placeItems(grid, numKeys, level) {
  const items = [];
  const deadEnds = shuffle([...grid.getDeadEnds()]);
  const intersections = shuffle([...grid.getIntersections()]);

  // 排除起点和终点附近 3 格的区域
  const excludeRadius = 3;
  const isExcluded = (cell) => {
    return (cell.x <= excludeRadius && cell.y <= excludeRadius) ||
           (cell.x >= grid.width - 1 - excludeRadius && cell.y >= grid.height - 1 - excludeRadius);
  };

  const availableDeadEnds = deadEnds.filter(c => !isExcluded(c));
  const availableIntersections = intersections.filter(c => !isExcluded(c));

  let deadEndIdx = 0;
  let intersectionIdx = 0;

  // 辅助函数：获取下一个可用的死胡同
  const nextDeadEnd = () => {
    while (deadEndIdx < availableDeadEnds.length) {
      const cell = availableDeadEnds[deadEndIdx++];
      if (!cell.item) return cell;
    }
    return null;
  };

  // 辅助函数：获取下一个可用的交叉口
  const nextIntersection = () => {
    while (intersectionIdx < availableIntersections.length) {
      const cell = availableIntersections[intersectionIdx++];
      if (!cell.item) return cell;
    }
    return null;
  };

  // 1. 放置钥匙 — 优先死胡同
  for (let i = 0; i < numKeys; i++) {
    const cell = nextDeadEnd();
    if (cell) {
      cell.item = { type: ItemType.KEY };
      items.push({ type: ItemType.KEY, x: cell.x, y: cell.y });
    }
  }

  // 2. 放置金币 — 交叉口
  const coinCount = 5 + level * 2;
  for (let i = 0; i < coinCount; i++) {
    const cell = nextIntersection();
    if (cell) {
      cell.item = { type: ItemType.COIN };
      items.push({ type: ItemType.COIN, x: cell.x, y: cell.y });
    }
  }

  // 3. 放置加速靴 — 随机
  const bootsCount = 1 + Math.floor(level / 2);
  for (let i = 0; i < bootsCount; i++) {
    const cell = nextDeadEnd() || nextIntersection();
    if (cell) {
      cell.item = { type: ItemType.BOOTS };
      items.push({ type: ItemType.BOOTS, x: cell.x, y: cell.y });
    }
  }

  // 4. 放置护盾
  const shieldCount = 1;
  for (let i = 0; i < shieldCount; i++) {
    const cell = nextDeadEnd() || nextIntersection();
    if (cell) {
      cell.item = { type: ItemType.SHIELD };
      items.push({ type: ItemType.SHIELD, x: cell.x, y: cell.y });
    }
  }

  // 5. 放置冰冻球 — 死胡同
  const freezeCount = 1;
  for (let i = 0; i < freezeCount; i++) {
    const cell = nextDeadEnd();
    if (cell) {
      cell.item = { type: ItemType.FREEZE };
      items.push({ type: ItemType.FREEZE, x: cell.x, y: cell.y });
    }
  }

  // 6. 放置地图卷轴 — 稀有，仅高关卡
  if (level >= 2) {
    const cell = nextDeadEnd();
    if (cell) {
      cell.item = { type: ItemType.MAP };
      items.push({ type: ItemType.MAP, x: cell.x, y: cell.y });
    }
  }

  return items;
}

/**
 * 拾取道具并应用效果
 * @returns {{ type: string, name: string }|null} 拾取的道具信息
 */
export function pickupItem(player, grid, enemies, gameState) {
  const cell = grid.get(player.gridX, player.gridY);
  if (!cell || !cell.item) return null;

  const item = cell.item;
  cell.item = null;

  switch (item.type) {
    case ItemType.KEY:
      player.addKey();
      return { type: item.type, name: '钥匙' };

    case ItemType.COIN:
      player.addCoin(COIN_SCORE);
      return { type: item.type, name: '金币 +100' };

    case ItemType.BOOTS:
      player.applySpeedBoost();
      return { type: item.type, name: '加速靴' };

    case ItemType.SHIELD:
      player.applyShield();
      return { type: item.type, name: '护盾' };

    case ItemType.FREEZE:
      for (const enemy of enemies) {
        enemy.freeze(gameState.freezeDuration);
      }
      return { type: item.type, name: '冰冻球' };

    case ItemType.MAP:
      gameState.mapRevealTimer = gameState.mapRevealDuration;
      return { type: item.type, name: '地图卷轴' };

    default:
      return null;
  }
}
