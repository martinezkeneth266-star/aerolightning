// gestureController.js — Controles táctiles para AeroLightning (sin lector de pantalla)

class GestureController {
  constructor(element, audioManager, gameActions) {
    this.el = element;
    this.audio = audioManager;
    this.actions = gameActions;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.lastTapTime = 0;
    this.longPressTimer = null;
    this.longPressTriggered = false;
    this.touchCount = 1;

    this.SWIPE_THRESHOLD = 40;
    this.DOUBLE_TAP_WINDOW = 300;
    this.LONG_PRESS_DELAY = 500;

    this._bind();
  }

  _bind() {
    this.el.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: true });
    this.el.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: true });
    this.el.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: true });
  }

  _onTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.longPressTriggered = false;
    this.touchCount = e.touches.length;

    this.longPressTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this.actions.recargar();
      this.audio.playEffect('recarga');
    }, this.LONG_PRESS_DELAY);
  }

  _onTouchMove(e) {
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
      clearTimeout(this.longPressTimer);
    }
  }

  _onTouchEnd(e) {
    clearTimeout(this.longPressTimer);
    if (this.longPressTriggered) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.SWIPE_THRESHOLD) {
      this._handleTap();
      return;
    }

    if (this.touchCount >= 2) {
      if (dy < 0) { this.actions.acelerar(); }
      else { this.actions.frenar(); }
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      this.actions.girar(dx > 0 ? 'derecha' : 'izquierda');
    } else {
      if (dy < 0) this.actions.ascender();
      else this.actions.descender();
    }
  }

  _handleTap() {
    const now = Date.now();
    if (now - this.lastTapTime < this.DOUBLE_TAP_WINDOW) {
      this.actions.misil();
      this.audio.playEffect('misil');
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
      setTimeout(() => {
        if (Date.now() - this.lastTapTime >= this.DOUBLE_TAP_WINDOW) {
          this.actions.disparar();
          this.audio.playEffect('disparoAmetralladora');
        }
      }, this.DOUBLE_TAP_WINDOW);
    }
  }
    }
