import { CANVAS_W, CANVAS_H, COLORS } from './config.js';

/**
 * UI 界面绘制
 * 菜单、暂停、游戏结束等覆盖层
 */

/** 绘制主菜单 */
export function drawMenu(ctx) {
  // 背景
  ctx.fillStyle = '#0a0a1e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 标题
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('VINNY', CANVAS_W / 2, CANVAS_H / 3 - 20);

  ctx.fillStyle = '#6688aa';
  ctx.font = '16px monospace';
  ctx.fillText('迷 宫 追 逐', CANVAS_W / 2, CANVAS_H / 3 + 30);

  // 像素风装饰线
  ctx.fillStyle = '#00d4ff';
  for (let i = 0; i < 20; i++) {
    const x = CANVAS_W / 2 - 100 + i * 10;
    ctx.fillRect(x, CANVAS_H / 3 + 50, 6, 2);
  }

  // 开始提示
  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('按 Enter 或 空格 开始游戏', CANVAS_W / 2, CANVAS_H * 0.6);
  }

  // 操作说明
  ctx.fillStyle = '#556677';
  ctx.font = '13px monospace';
  ctx.fillText('WASD / 方向键 移动', CANVAS_W / 2, CANVAS_H * 0.75);
  ctx.fillText('ESC 暂停', CANVAS_W / 2, CANVAS_H * 0.75 + 22);
  ctx.fillText('收集钥匙 → 开锁门 → 到达出口', CANVAS_W / 2, CANVAS_H * 0.75 + 44);
}

/** 绘制暂停覆盖 */
export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('暂 停', CANVAS_W / 2, CANVAS_H / 2 - 20);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  ctx.fillText('按 ESC 继续', CANVAS_W / 2, CANVAS_H / 2 + 25);
}

/** 绘制通关画面 */
export function drawLevelComplete(ctx, level, score, timeBonus) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff44';
  ctx.font = 'bold 36px monospace';
  ctx.fillText(`第 ${level} 关 通过！`, CANVAS_W / 2, CANVAS_H / 3);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText(`关卡奖励: +500`, CANVAS_W / 2, CANVAS_H / 2 - 30);
  ctx.fillText(`时间奖励: +${timeBonus}`, CANVAS_W / 2, CANVAS_H / 2);
  ctx.fillText(`总分: ${score}`, CANVAS_W / 2, CANVAS_H / 2 + 30);

  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px monospace';
    ctx.fillText('按 Enter 进入下一关', CANVAS_W / 2, CANVAS_H * 0.72);
  }
}

/** 绘制游戏结束画面 */
export function drawGameOver(ctx, reason, score, level) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('游 戏 结 束', CANVAS_W / 2, CANVAS_H / 3);

  ctx.fillStyle = '#ff8888';
  ctx.font = '16px monospace';
  ctx.fillText(reason, CANVAS_W / 2, CANVAS_H / 3 + 40);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText(`最终得分: ${score}`, CANVAS_W / 2, CANVAS_H / 2 + 10);
  ctx.fillText(`到达关卡: ${level}`, CANVAS_W / 2, CANVAS_H / 2 + 40);

  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px monospace';
    ctx.fillText('按 Enter 重新开始', CANVAS_W / 2, CANVAS_H * 0.72);
  }
}

/** 绘制 HUD（得分、钥匙、时间等） */
export function drawHUD(ctx, player, level, timeLeft, message) {
  const pad = 10;
  const h = 36;

  // HUD 背景条
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, h);

  ctx.textBaseline = 'middle';
  ctx.font = '14px monospace';
  const y = h / 2;

  // 关卡
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`关卡 ${level}`, pad, y);

  // 钥匙
  ctx.fillStyle = COLORS.key;
  ctx.fillText(`🔑 ${player.keys}`, pad + 80, y);

  // 金币/分数
  ctx.fillStyle = COLORS.coin;
  ctx.fillText(`● ${player.score}`, pad + 140, y);

  // buff 状态
  let buffX = pad + 240;
  if (player.hasShield) {
    ctx.fillStyle = COLORS.shield;
    ctx.fillText('🛡', buffX, y);
    buffX += 30;
  }
  if (player.speedBoostTimer > 0) {
    ctx.fillStyle = COLORS.boots;
    ctx.fillText('⚡', buffX, y);
    buffX += 30;
  }

  // 时间
  ctx.textAlign = 'right';
  const timeColor = timeLeft <= 30 ? '#ff4444' : timeLeft <= 60 ? '#ffaa00' : '#ffffff';
  ctx.fillStyle = timeColor;
  const mins = Math.floor(timeLeft / 60);
  const secs = Math.floor(timeLeft % 60);
  ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_W - pad, y);

  // 拾取提示信息
  if (message && message.timer > 0) {
    const alpha = Math.min(1, message.timer / 500);
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(message.text, CANVAS_W / 2, h + 30);
    ctx.globalAlpha = 1;
  }
}
