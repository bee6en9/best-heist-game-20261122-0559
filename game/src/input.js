// Keyboard input. Held keys give a steering direction; one-shot presses (grab, smoke,
// jam, pause, restart, mute, confirm) are queued as bit flags and taken once by the loop,
// so a press between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_GRAB = 4;
export const ACTION_SMOKE = 8;
export const ACTION_JAM = 16;
export const ACTION_RESTART = 32;
export const ACTION_MUTE = 64;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const SNEAK = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const GRAB = new Set(['KeyE']);
const SMOKE = new Set(['Space']);
const JAM = new Set(['KeyJ']);
const RESTART = new Set(['KeyR']);
const MUTE = new Set(['KeyM']);

export function createInput(target) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let sneak = false;
  let actions = 0;

  function press(code, repeat) {
    if (UP.has(code)) up = true;
    else if (DOWN.has(code)) down = true;
    else if (LEFT.has(code)) left = true;
    else if (RIGHT.has(code)) right = true;
    else if (SNEAK.has(code)) sneak = true;
    else if (repeat) return;
    else if (CONFIRM.has(code)) actions |= ACTION_CONFIRM;
    else if (PAUSE.has(code)) actions |= ACTION_PAUSE;
    else if (GRAB.has(code)) actions |= ACTION_GRAB;
    else if (SMOKE.has(code)) actions |= ACTION_SMOKE;
    else if (JAM.has(code)) actions |= ACTION_JAM;
    else if (RESTART.has(code)) actions |= ACTION_RESTART;
    else if (MUTE.has(code)) actions |= ACTION_MUTE;
  }

  window.addEventListener('keydown', (event) => {
    press(event.code, event.repeat);
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code) || SMOKE.has(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (SNEAK.has(event.code)) sneak = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = down = left = right = sneak = false;
  });
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_CONFIRM;
  });

  return {
    /** { x: -1..1, y: -1..1 } steering direction, normalised. */
    direction() {
      const x = (right ? 1 : 0) - (left ? 1 : 0);
      const y = (down ? 1 : 0) - (up ? 1 : 0);
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.SQRT2;
        return { x: x * inv, y: y * inv };
      }
      return { x, y };
    },
    sneaking() {
      return sneak;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
