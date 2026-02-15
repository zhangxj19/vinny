/**
 * 键盘输入管理器
 * 支持 WASD + 方向键，带输入缓冲
 */
export class Input {
  constructor() {
    this.keys = new Set();
    this.buffer = null;  // 缓冲的下一步方向

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    // 阻止方向键滚动页面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    this.keys.add(e.key);

    // 输入缓冲：记录最新按下的方向
    const dir = this._keyToDir(e.key);
    if (dir) {
      this.buffer = dir;
    }
  }

  _onKeyUp(e) {
    this.keys.delete(e.key);
  }

  _keyToDir(key) {
    switch (key) {
      case 'ArrowUp': case 'w': case 'W': return 'up';
      case 'ArrowDown': case 's': case 'S': return 'down';
      case 'ArrowLeft': case 'a': case 'A': return 'left';
      case 'ArrowRight': case 'd': case 'D': return 'right';
      default: return null;
    }
  }

  /** 获取当前按住的方向（优先返回缓冲方向） */
  getDirection() {
    if (this.buffer) {
      const dir = this.buffer;
      this.buffer = null;
      return dir;
    }

    // 无缓冲时检查当前按键状态
    for (const key of this.keys) {
      const dir = this._keyToDir(key);
      if (dir) return dir;
    }
    return null;
  }

  /** 检查暂停键 */
  isPausePressed() {
    return this.keys.has('Escape') || this.keys.has('p') || this.keys.has('P');
  }

  /** 检查确认键 */
  isConfirmPressed() {
    return this.keys.has('Enter') || this.keys.has(' ');
  }

  /** 消费一次性按键（按下后立即清除，防止重复触发） */
  consumeKey(key) {
    if (this.keys.has(key)) {
      this.keys.delete(key);
      return true;
    }
    return false;
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
